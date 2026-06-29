import { Room } from "@colyseus/core";
import type { Client } from "@colyseus/core";
import { TeamsState, TeamsPlayer } from "./schema/TeamsState.js";
import { generateRoomCode } from "../utils/roomCode.js";
import ProblemModel from "../models/Problem.js";
import { evaluateTestCase } from "../services/piston.js";

const ROUND_DURATION_SECS = 600;
const START_COUNTDOWN_MS  = 5_000;
const RESULTS_PAUSE_MS    = 5_000;

interface ProblemData {
    title: string; description: string; difficulty: string; points: number;
    timeLimit: number;
    examples: { input: string; output: string; explanation: string }[];
    hiddenTestCases: { input: string; expectedOutput: string }[];
    templates: { python: string; javascript: string; cpp: string };
    tags: string[];
    constraints: string;
    companies: string[];
    expectedComplexity: string;
    hints: string[];
}

export class TeamsRoom extends Room<TeamsState> {
    maxClients = 20;

    private problems: ProblemData[] = [];
    private currentProblemIndex = 0;
    private roundTimer: ReturnType<typeof setTimeout> | null = null;

    // ── Lifecycle ────────────────────────────────────────────────────────────

    async onCreate(options: any) {
        this.setState(new TeamsState());
        this.state.roomCode   = options?.lobbyRoomCode ?? generateRoomCode();
        this.state.roundDuration = options?.timePerQuestion ?? ROUND_DURATION_SECS;
        this.state.phase         = "countdown";
        this.state.phaseStartsAt = Date.now() + START_COUNTDOWN_MS;
        await this.setMetadata({ roomCode: this.state.roomCode });

        const filter: any = {};
        if (options?.category && options.category !== "All Categories") filter.tags = options.category;
        if (options?.difficulty && options.difficulty !== "Mixed") filter.difficulty = options.difficulty.toLowerCase();

        let docs = await ProblemModel.find(filter).sort({ order: 1 }).lean();
        if (docs.length === 0) {
            docs = await ProblemModel.find({}).sort({ order: 1 }).lean();
        }
        this.problems = docs.map((d) => ({
            title: d.title, description: d.description,
            difficulty: d.difficulty, points: d.points ?? 100,
            timeLimit: d.timeLimit ?? 5000,
            examples: (d.examples as any[]).map((e) => ({
                input: e.input, output: e.output, explanation: e.explanation ?? "",
            })),
            hiddenTestCases: (d.hiddenTestCases as any[]).map((t) => ({
                input: t.input, expectedOutput: t.expectedOutput,
            })),
            templates: d.templates as any,
            tags: d.tags ?? [],
            constraints: d.constraints ?? "",
            companies: d.companies ?? [],
            expectedComplexity: d.expectedComplexity ?? "",
            hints: d.hints ?? [],
        }));
        this.state.totalRounds = Math.min(5, this.problems.length || 1);

        // ── "ready" handshake: client sends this after registering all listeners
        this.onMessage("ready", (client: Client) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) return;
            client.send("problem", this.buildProblemPayload(this.currentProblemIndex));
            client.send("phaseSync", {
                phase: this.state.phase, roundNumber: this.state.roundNumber,
                totalRounds: this.state.totalRounds, roundEndsAt: this.state.roundEndsAt,
                phaseStartsAt: this.state.phaseStartsAt,
                teamAlphaScore: this.state.teamAlphaScore,
                teamBetaScore: this.state.teamBetaScore,
            });
        });

        // ── Run Code ─────────────────────────────────────────────────────────
        this.onMessage("runCode", async (client: Client, data: { code: string; language: string }) => {
            try {
                const problem = this.problems[this.currentProblemIndex];
                if (!problem) { client.send("runCodeResult", { error: "No problem loaded" }); return; }
                const results = await Promise.all(
                    problem.examples.map((ex) =>
                        evaluateTestCase(data.language, data.code, ex.input, ex.output, problem.timeLimit)
                    )
                );
                client.send("runCodeResult", {
                    results: results.map((r, i) => ({
                        input: problem.examples[i].input,
                        expectedOutput: problem.examples[i].output,
                        actualOutput: r.actualOutput,
                        passed: r.passed,
                        verdict: r.verdict,
                        stderr: r.stderr,
                    })),
                });
            } catch (err) {
                console.error("[TeamsRoom] runCode error:", err);
                client.send("runCodeResult", { error: "Execution service error" });
            }
        });

        // ── Submit Code ──────────────────────────────────────────────────────
        this.onMessage("submitCode", async (client: Client, data: { code: string; language: string }) => {
            try {
                const player = this.state.players.get(client.sessionId);
                if (!player || !player.team) { client.send("submitResult", { verdict: "error", details: "No team assigned" }); return; }
                if (this.state.phase !== "coding") { client.send("submitResult", { verdict: "not_active", details: "Round not active" }); return; }
                if (player.submissionStatus === "accepted") { client.send("submitResult", { verdict: "already_accepted", details: "" }); return; }

                const problem = this.problems[this.currentProblemIndex];
                if (!problem) { client.send("submitResult", { verdict: "error", details: "No problem loaded" }); return; }

                player.submissions += 1;
                player.submissionStatus = "pending";

                const results = await Promise.all(
                    problem.hiddenTestCases.map((tc) =>
                        evaluateTestCase(data.language, data.code, tc.input, tc.expectedOutput, problem.timeLimit)
                    )
                );
                const allPassed = results.every((r) => r.passed);
                const failedResult = results.find((r) => !r.passed);
                const verdict = allPassed ? "accepted" : (failedResult?.verdict ?? "wrong_answer");
                const details = failedResult?.verdict === "wrong_answer"
                    ? `Expected: ${failedResult.expectedOutput}\nGot: ${failedResult.actualOutput}`
                    : failedResult?.stderr?.slice(0, 300) ?? "";
                player.submissionStatus = verdict;

                if (verdict === "accepted") {
                    const timeLeft = Math.max(0, (this.state.roundEndsAt - Date.now()) / 1000);
                    const timeBonus = Math.floor((timeLeft / ROUND_DURATION_SECS) * 30);
                    const earned = problem.points + timeBonus;
                    player.score += earned;
                    player.solved += 1;

                    // Update team score
                    if (player.team === "alpha") this.state.teamAlphaScore += earned;
                    else this.state.teamBetaScore += earned;

                    this.broadcast("liveEvent", {
                        username: player.username,
                        team: player.team,
                        type: "accepted",
                        message: `solved (+${earned} pts)`,
                        color: "green",
                    });
                    client.send("submitResult", { verdict, details: "", score: player.score, earned });
                    this.checkRoundEnd();
                } else {
                    this.broadcast("liveEvent", {
                        username: player.username,
                        team: player.team,
                        type: "wrong",
                        message: verdict.replace(/_/g, " "),
                        color: "red",
                    });
                    client.send("submitResult", { verdict, details, canRetry: true });
                }
            } catch (err) {
                console.error("[TeamsRoom] submitCode error:", err);
                client.send("submitResult", { verdict: "error", details: "Execution service unavailable" });
            }
        });

        this.clock.setTimeout(() => this.startRound(0), START_COUNTDOWN_MS);
        console.log("[TeamsRoom] Created, code:", this.state.roomCode);
    }

    onJoin(client: Client, options: { username?: string; preferredTeam?: "alpha" | "beta" }) {
        const player     = new TeamsPlayer();
        player.id        = client.sessionId;
        player.username  = options.username?.trim() || "Guest";
        player.isHost    = this.state.players.size === 0;

        // Balanced team assignment or preferred team
        if (options.preferredTeam === "alpha" || options.preferredTeam === "beta") {
            player.team = options.preferredTeam;
        } else {
            const all   = Array.from(this.state.players.values());
            const alpha = all.filter((p) => p.team === "alpha").length;
            const beta  = all.filter((p) => p.team === "beta").length;
            player.team = alpha <= beta ? "alpha" : "beta";
        }

        this.state.players.set(client.sessionId, player);
        console.log(`[TeamsRoom] ${player.username} joined team ${player.team}`);
    }

    async onLeave(client: Client, consented: boolean) {
        const player = this.state.players.get(client.sessionId);
        if (!player) return;

        console.log(`[TeamsRoom] ${player.username} disconnected. Waiting for reconnection...`);

        try {
            if (consented) throw new Error("consented");
            await this.allowReconnection(client, 20);
            console.log(`[TeamsRoom] ${player.username} reconnected!`);
        } catch (e) {
            this.state.players.delete(client.sessionId);
            console.log(`[TeamsRoom] ${player.username} left for good`);
        }
    }

    onDispose() {
        if (this.roundTimer) clearTimeout(this.roundTimer);
        console.log("[TeamsRoom] Disposed:", this.state.roomCode);
    }

    // ── Game Flow ────────────────────────────────────────────────────────────

    private startRound(index: number) {
        this.currentProblemIndex  = index;
        this.state.roundNumber    = index + 1;
        this.state.phase          = "coding";
        this.state.roundEndsAt    = Date.now() + ROUND_DURATION_SECS * 1000;
        this.state.phaseStartsAt  = Date.now();

        this.state.players.forEach((p) => {
            p.submissionStatus = "";
            p.submissions      = 0;
        });

        this.broadcast("problem", this.buildProblemPayload(index));
        this.broadcast("phaseSync", {
            phase: this.state.phase, roundNumber: this.state.roundNumber,
            totalRounds: this.state.totalRounds, roundEndsAt: this.state.roundEndsAt,
            phaseStartsAt: this.state.phaseStartsAt,
        });

        this.roundTimer = setTimeout(() => {
            this.roundTimer = null;
            this.endRound();
        }, ROUND_DURATION_SECS * 1000);
    }

    private checkRoundEnd() {
        const all = Array.from(this.state.players.values());
        if (all.every((p) => p.submissionStatus === "accepted")) {
            if (this.roundTimer) { clearTimeout(this.roundTimer); this.roundTimer = null; }
            setTimeout(() => this.endRound(), 2000);
        }
    }

    private endRound() {
        this.state.phase = "results";
        const nextIndex  = this.state.roundNumber; // 1-indexed → next is same value

        // Announce which team won this round
        const winner =
            this.state.teamAlphaScore > this.state.teamBetaScore ? "alpha" :
            this.state.teamAlphaScore < this.state.teamBetaScore ? "beta" : "tie";
        this.broadcast("roundResult", {
            roundNumber: this.state.roundNumber,
            teamAlphaScore: this.state.teamAlphaScore,
            teamBetaScore: this.state.teamBetaScore,
            roundWinner: winner,
        });

        if (nextIndex < this.problems.length) {
            setTimeout(() => this.startRound(nextIndex), RESULTS_PAUSE_MS);
        } else {
            setTimeout(() => this.finishGame(), RESULTS_PAUSE_MS);
        }
    }

    private finishGame() {
        this.state.phase = "finished";
        const overall =
            this.state.teamAlphaScore > this.state.teamBetaScore ? "alpha" :
            this.state.teamAlphaScore < this.state.teamBetaScore ? "beta" : "tie";

        const leaderboard = Array.from(this.state.players.values())
            .map((p) => ({
                id: p.id, username: p.username, team: p.team,
                score: p.score, solved: p.solved,
            }))
            .sort((a, b) => b.score - a.score);

        this.broadcast("gameOver", {
            winner: overall,
            teamAlphaScore: this.state.teamAlphaScore,
            teamBetaScore: this.state.teamBetaScore,
            leaderboard,
        });
        console.log("[TeamsRoom] Game over! Winner team:", overall);
    }

    private buildProblemPayload(index: number) {
        const p = this.problems[index];
        if (!p) return null;
        return {
            title: p.title, description: p.description,
            difficulty: p.difficulty, points: p.points,
            examples: p.examples,
            hiddenCount: p.hiddenTestCases.length,
            templates: p.templates, tags: p.tags,
        };
    }
}
