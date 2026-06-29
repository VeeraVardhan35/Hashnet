import { Room } from "@colyseus/core";
import type { Client } from "@colyseus/core";
import { BattleState, BattlePlayer } from "./schema/BattleState.js";
import { generateRoomCode } from "../utils/roomCode.js";
import ProblemModel from "../models/Problem.js";
import { evaluateTestCase } from "../services/piston.js";

const ROUND_DURATION_SECS = 600; // 10 minutes per problem
const START_COUNTDOWN_MS = 5_000;
const RESULTS_PAUSE_MS = 5_000;

interface ProblemData {
    title: string;
    description: string;
    difficulty: string;
    points: number;
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

export class BattleRoom extends Room<BattleState> {
    maxClients = 12;

    private problems: ProblemData[] = [];
    private currentProblemIndex = 0;
    private roundTimer: ReturnType<typeof setTimeout> | null = null;

    // ── Lifecycle ──────────────────────────────────────────────────────────────

    async onCreate(options: any) {
        this.setState(new BattleState());

        this.state.roomCode = options?.lobbyRoomCode ?? generateRoomCode();
        this.state.roundDuration = options?.timePerQuestion ?? ROUND_DURATION_SECS;
        this.state.phase = "countdown";
        this.state.phaseStartsAt = Date.now() + START_COUNTDOWN_MS;

        await this.setMetadata({ roomCode: this.state.roomCode });

        console.log("[BattleRoom] Created, code:", this.state.roomCode);

        // Load problems matching filters
        const filter: any = {};
        if (options?.category && options.category !== "All Categories") filter.tags = options.category;
        if (options?.difficulty && options.difficulty !== "Mixed") filter.difficulty = options.difficulty.toLowerCase();

        let docs = await ProblemModel.find(filter).sort({ order: 1 }).lean();
        if (docs.length === 0) {
            docs = await ProblemModel.find({}).sort({ order: 1 }).lean();
        }
        this.problems = docs.map((d) => ({
            title: d.title,
            description: d.description,
            difficulty: d.difficulty,
            points: d.points ?? 100,
            timeLimit: d.timeLimit ?? 5000,
            examples: (d.examples as any[]).map((e) => ({
                input: e.input,
                output: e.output,
                explanation: e.explanation ?? "",
            })),
            hiddenTestCases: (d.hiddenTestCases as any[]).map((t) => ({
                input: t.input,
                expectedOutput: t.expectedOutput,
            })),
            templates: d.templates as any,
            tags: d.tags ?? [],
            constraints: d.constraints ?? "",
            companies: d.companies ?? [],
            expectedComplexity: d.expectedComplexity ?? "",
            hints: d.hints ?? [],
        }));

        this.state.totalRounds = Math.min(5, this.problems.length || 1);

        // Auto-start after countdown
        this.clock.setTimeout(() => {
            this.startRound(0);
        }, START_COUNTDOWN_MS);

        // ── Message: Run Code (against visible examples only) ────────────────
        this.onMessage(
            "runCode",
            async (
                client: Client,
                data: { code: string; language: string }
            ) => {
                try {
                    const problem = this.problems[this.currentProblemIndex];
                    if (!problem) {
                        client.send("runCodeResult", { error: "No problem loaded" });
                        return;
                    }

                    const results = await Promise.all(
                        problem.examples.map((ex) =>
                            evaluateTestCase(
                                data.language,
                                data.code,
                                ex.input,
                                ex.output,
                                problem.timeLimit
                            )
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
                    // Catch Piston API timeouts / network errors so they never
                    // propagate as unhandled rejections (which crash the room).
                    console.error("[BattleRoom] runCode error:", err);
                    client.send("runCodeResult", {
                        error: `Execution service unavailable: ${err instanceof Error ? err.message : "Unknown error"}`,
                    });
                }
            }
        );

        // ── Message: Submit Code (against hidden test cases) ─────────────────────
        this.onMessage(
            "submitCode",
            async (
                client: Client,
                data: { code: string; language: string }
            ) => {
                try {
                    const player = this.state.players.get(client.sessionId);
                    if (!player) return;
                    if (!player.isAlive) {
                        client.send("submitResult", { verdict: "eliminated", details: "You are already eliminated." });
                        return;
                    }
                    if (player.submissionStatus === "accepted") {
                        client.send("submitResult", { verdict: "already_accepted", details: "You already solved this!" });
                        return;
                    }
                    if (this.state.phase !== "coding") {
                        client.send("submitResult", { verdict: "not_active", details: "No active round." });
                        return;
                    }

                    const problem = this.problems[this.currentProblemIndex];
                    if (!problem) return;

                    player.submissionStatus = "pending";
                    player.submissions += 1;

                    // Run against every hidden test case sequentially (fail-fast)
                    let verdict: string = "accepted";
                    let details = "";

                    for (const tc of problem.hiddenTestCases) {
                        const result = await evaluateTestCase(
                            data.language,
                            data.code,
                            tc.input,
                            tc.expectedOutput,
                            problem.timeLimit
                        );

                        if (!result.passed) {
                            verdict = result.verdict;
                            details =
                                result.verdict === "wrong_answer"
                                    ? `Expected: ${result.expectedOutput}\nGot: ${result.actualOutput}`
                                    : result.stderr?.slice(0, 300) ?? "";
                            break;
                        }
                    }

                    player.submissionStatus = verdict;

                    if (verdict === "accepted") {
                        const timeLeft = Math.max(
                            0,
                            (this.state.roundEndsAt - Date.now()) / 1000
                        );
                        const timeBonus = Math.floor(
                            (timeLeft / ROUND_DURATION_SECS) * 30
                        );
                        const earned = problem.points + timeBonus;
                        player.score += earned;
                        player.solved += 1;

                        this.broadcast("liveEvent", {
                            username: player.username,
                            type: "accepted",
                            message: `solved in ${Math.floor(ROUND_DURATION_SECS - timeLeft)}s`,
                            color: "green",
                        });

                        client.send("submitResult", { verdict, details: "", score: player.score, earned });

                        // Check if everyone alive has now accepted
                        this.checkRoundEnd();
                    } else {
                        // Wrong / TLE / RE → record verdict, let them retry.
                        // No immediate elimination — lowest scorer is cut at round end.
                        const verdictLabel: Record<string, string> = {
                            wrong_answer: "Wrong Answer",
                            time_limit_exceeded: "Time Limit Exceeded",
                            runtime_error: "Runtime Error",
                        };
                        this.broadcast("liveEvent", {
                            username: player.username,
                            type: "wrong",
                            message: verdictLabel[verdict] ?? verdict,
                            color: "red",
                        });
                        client.send("submitResult", { verdict, details, canRetry: true });
                    }
                } catch (err) {
                    // Catch Piston API timeouts / network errors so they never
                    // propagate as unhandled rejections (which crash the room).
                    console.error("[BattleRoom] submitCode error:", err);
                    // Reset pending status so the player can try again
                    const player = this.state.players.get(client.sessionId);
                    if (player && player.submissionStatus === "pending") {
                        player.submissionStatus = "";
                    }
                    client.send("submitResult", {
                        verdict: "error",
                        details: `Execution service unavailable. Please try again.`,
                    });
                }
            }
        );

        // ── Message: "ready" — client signals all listeners are registered ──────
        // Sent by the client right after it calls room.onMessage(...) for all types.
        // This prevents "problem" / "phaseSync" from arriving before listeners exist.
        this.onMessage("ready", (client: Client) => {
            console.log(`[BattleRoom] Client ready: ${client.sessionId}`);

            if (this.problems.length > 0) {
                this.sendProblemToClient(client, this.currentProblemIndex);
            }

            client.send("phaseSync", {
                phase: this.state.phase,
                roundNumber: this.state.roundNumber,
                totalRounds: this.state.totalRounds,
                roundEndsAt: this.state.roundEndsAt,
                phaseStartsAt: this.state.phaseStartsAt,
            });
        });
    }

    onJoin(client: Client, options: { username?: string }) {
        const player = new BattlePlayer();
        player.id = client.sessionId;
        player.username = options.username?.trim() || "Guest";
        player.isHost = this.state.players.size === 0;
        player.isAlive = true;
        this.state.players.set(client.sessionId, player);

        console.log(`[BattleRoom] ${player.username} joined`);
        // Initial problem + phaseSync are sent when the client sends "ready"
        // (after it has registered all onMessage listeners) to avoid race conditions.
    }

    async onLeave(client: Client, consented: boolean) {
        const player = this.state.players.get(client.sessionId);
        if (!player) return;

        console.log(`[BattleRoom] ${player.username} disconnected. Waiting for reconnection...`);

        try {
            if (consented) throw new Error("consented");
            await this.allowReconnection(client, 20);
            console.log(`[BattleRoom] ${player.username} reconnected!`);
        } catch (e) {
            const wasHost = player.isAlive && player.isHost;
            this.state.players.delete(client.sessionId);
            console.log(`[BattleRoom] ${player.username} left for good`);

            if (wasHost && this.state.players.size > 0) {
                const next = Array.from(this.state.players.values()).find(p => p.isAlive);
                if (next) next.isHost = true;
            }
        }
    }

    onDispose() {
        if (this.roundTimer !== null) clearTimeout(this.roundTimer);
        console.log("[BattleRoom] Disposed:", this.state.roomCode);
    }

    // ── Game Flow ──────────────────────────────────────────────────────────────

    private startRound(index: number) {
        this.currentProblemIndex = index;
        this.state.roundNumber = index + 1;
        this.state.phase = "coding";
        this.state.roundEndsAt = Date.now() + ROUND_DURATION_SECS * 1000;
        this.state.phaseStartsAt = Date.now();

        // Reset per-round state for alive players only
        this.state.players.forEach((p) => {
            if (p.isAlive) {
                p.submissionStatus = "";
                p.submissions = 0;
            }
        });

        // Broadcast the problem (no hidden test cases in payload)
        this.broadcast("problem", this.buildProblemPayload(index));

        console.log(
            `[BattleRoom] Round ${index + 1}/${this.problems.length} started`
        );

        // Auto-end after time limit — just end the round (eliminateLowestScorer runs in endRound)
        this.roundTimer = setTimeout(() => {
            this.roundTimer = null;
            this.endRound();
        }, ROUND_DURATION_SECS * 1000);
    }

    private checkRoundEnd() {
        // Round ends early only when every alive player has accepted the problem.
        // Wrong/TLE/RE players can retry, so they don't count as "done" yet.
        const alive = Array.from(this.state.players.values()).filter(
            (p) => p.isAlive
        );
        if (alive.length === 0) {
            this.endRound();
            return;
        }
        const allSolved = alive.every((p) => p.submissionStatus === "accepted");
        if (allSolved) {
            if (this.roundTimer !== null) {
                clearTimeout(this.roundTimer);
                this.roundTimer = null;
            }
            setTimeout(() => this.endRound(), 2000);
        }
    }

    /**
     * Eliminate the player(s) with the LOWEST total score.
     * If everyone is tied (e.g. nobody solved anything), nobody is eliminated
     * so the game continues to the next round giving players another chance.
     */
    private eliminateLowestScorer() {
        const alive = Array.from(this.state.players.values()).filter(
            (p) => p.isAlive
        );
        if (alive.length <= 1) return; // last player cannot be eliminated here

        const minScore = Math.min(...alive.map((p) => p.score));
        const toEliminate = alive.filter((p) => p.score === minScore);

        // If everyone is tied at the same (lowest) score, don't eliminate anyone
        if (toEliminate.length === alive.length) {
            console.log(
                `[BattleRoom] All ${alive.length} players tied at ${minScore} pts — no elimination this round`
            );
            this.broadcast("liveEvent", {
                username: "System",
                type: "system",
                message: "All players tied — no elimination this round!",
                color: "yellow",
            });
            return;
        }

        toEliminate.forEach((p) => {
            p.isAlive = false;
            p.eliminatedRound = this.state.roundNumber;
            this.broadcast("liveEvent", {
                username: p.username,
                type: "eliminated",
                message: `eliminated (${p.score} pts)`,
                color: "red",
            });
            console.log(
                `[BattleRoom] ${p.username} eliminated in round ${this.state.roundNumber} (score: ${p.score})`
            );
        });
    }

    private endRound() {
        this.state.phase = "results";

        // Eliminate the lowest scorer(s)
        this.eliminateLowestScorer();

        const alive = Array.from(this.state.players.values()).filter(
            (p) => p.isAlive
        );
        const nextRoundIndex = this.state.roundNumber; // 1-indexed, so next index = roundNumber

        // Game ends if: 0 alive remain, OR we've run all rounds
        // Note: alive.length === 1 no longer ends the game early — last player
        // continues through remaining rounds and gets a champion result.
        if (alive.length === 0 || nextRoundIndex >= this.problems.length) {
            setTimeout(() => this.finishGame(), RESULTS_PAUSE_MS);
        } else {
            setTimeout(() => this.startRound(nextRoundIndex), RESULTS_PAUSE_MS);
        }
    }

    private finishGame() {
        this.state.phase = "finished";
        const leaderboard = Array.from(this.state.players.values())
            .map((p) => ({
                id: p.id,
                username: p.username,
                score: p.score,
                solved: p.solved,
                isAlive: p.isAlive,
                eliminatedRound: p.eliminatedRound,
            }))
            .sort((a, b) => {
                // Alive players first, then by score descending
                if (a.isAlive !== b.isAlive) return a.isAlive ? -1 : 1;
                return b.score - a.score;
            });
        this.broadcast("gameOver", { leaderboard });
        console.log(
            "[BattleRoom] Game over! Winner:",
            leaderboard[0]?.username ?? "nobody"
        );
    }

    private buildProblemPayload(index: number) {
        const p = this.problems[index];
        return {
            title: p.title,
            description: p.description,
            difficulty: p.difficulty,
            points: p.points,
            examples: p.examples, // visible examples only
            hiddenCount: p.hiddenTestCases.length,
            templates: p.templates,
            tags: p.tags,
        };
    }

    private sendProblemToClient(client: Client, index: number) {
        if (index >= this.problems.length) return;
        client.send("problem", this.buildProblemPayload(index));
    }
}
