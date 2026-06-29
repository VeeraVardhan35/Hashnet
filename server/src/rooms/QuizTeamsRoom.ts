import { Room } from "@colyseus/core";
import type { Client } from "@colyseus/core";
import { QuizTeamsState, QuizTeamsPlayer } from "./schema/QuizTeamsState.js";
import { generateRoomCode } from "../utils/roomCode.js";
import QuestionModel from "../models/Question.js";

const QUESTION_COUNT = 6;
const ROUND_DURATION_SECS = 30;   // Max time per question
const REVEAL_SECS = 5;            // How long to show reveal before next question
const START_COUNTDOWN_MS = 5_000;

interface QuestionData {
    text: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    difficulty: string;
    points: number;
    category: string;
}

export class QuizTeamsRoom extends Room<QuizTeamsState> {
    maxClients = 8;
    private questions: QuestionData[] = [];
    private questionTimer: ReturnType<typeof setTimeout> | null = null;
    private revealTimer: ReturnType<typeof setTimeout> | null = null;
    private revealStarted = false; // guard: only start reveal once per question
    private nextTeam: "alpha" | "beta" = "alpha";

    async onCreate(options: any) {
        this.setState(new QuizTeamsState());
        this.state.roomCode = options?.lobbyRoomCode ?? generateRoomCode();
        
        const qCount = options?.questionsCount ?? QUESTION_COUNT;
        this.state.totalQuestions = qCount;
        this.state.roundDuration = options?.timePerQuestion ?? ROUND_DURATION_SECS;

        await this.setMetadata({ roomCode: this.state.roomCode });

        console.log("[QuizTeamsRoom] Created, code:", this.state.roomCode);

        const filter: any = {};
        if (options?.category && options.category !== "All Categories") filter.category = options.category;
        if (options?.difficulty && options.difficulty !== "Mixed") filter.difficulty = options.difficulty.toLowerCase();

        let docs = await QuestionModel.aggregate([
            { $match: filter },
            { $sample: { size: qCount } },
        ]);

        if (docs.length === 0) {
            docs = await QuestionModel.aggregate([{ $sample: { size: qCount } }]);
        }

        this.questions = docs.map((d) => ({
            text: d.text,
            options: d.options,
            correctIndex: d.correctIndex,
            explanation: d.explanation ?? "",
            difficulty: d.difficulty ?? "medium",
            points: d.points ?? 10,
            category: d.category ?? "General",
        }));

        this.state.phase = "countdown";
        this.state.phaseStartsAt = Date.now() + START_COUNTDOWN_MS;

        this.clock.setTimeout(() => {
            if (this.state.players.size > 0) {
                this.beginQuestion(0);
            }
        }, START_COUNTDOWN_MS);

        this.onMessage("submitAnswer", (client: Client, data: { optionIndex: number }) => {
            const player = this.state.players.get(client.sessionId);
            if (!player || player.answered) return;
            if (this.state.phase !== "playing") return;

            const question = this.questions[this.state.questionIndex];
            if (!question) return;

            const isCorrect = data.optionIndex === question.correctIndex;
            player.answered = true;
            player.lastAnswerCorrect = isCorrect;

            if (isCorrect) {
                const timeLeft = Math.max(0, (this.state.roundEndsAt - Date.now()) / 1000);
                const timeBonus = Math.floor((timeLeft / ROUND_DURATION_SECS) * 5);
                const earned = question.points + timeBonus;
                player.score += earned;
                player.streak += 1;

                if (player.team === "alpha") {
                    this.state.teamAlphaScore += earned;
                } else {
                    this.state.teamBetaScore += earned;
                }

                this.broadcast("activity", {
                    username: player.username,
                    correct: true,
                    points: earned,
                });
            } else {
                player.streak = 0;
                this.broadcast("activity", {
                    username: player.username,
                    correct: false,
                    points: 0,
                });
            }

            // ── Start 5-second reveal on the FIRST answer of this question ──
            if (!this.revealStarted) {
                this.revealStarted = true;

                if (this.questionTimer !== null) {
                    clearTimeout(this.questionTimer);
                    this.questionTimer = null;
                }

                // Change state to reveal so all clients see the phase change
                this.state.phase = "reveal";
                // Standard countdown using the roundEndsAt property
                this.state.roundEndsAt = Date.now() + REVEAL_SECS * 1000;

                this.revealTimer = setTimeout(() => {
                    this.revealTimer = null;
                    this.advanceFromQuestion();
                }, REVEAL_SECS * 1000);
            }
        });
    }

    onJoin(client: Client, options: { username?: string; preferredTeam?: "alpha" | "beta" }) {
        const player = new QuizTeamsPlayer();
        player.id = client.sessionId;
        player.username = options.username?.trim() || "Guest";
        player.isHost = this.state.players.size === 0;

        // Respect the preferred team from the lobby, balance automatically if not set
        if (options.preferredTeam === "alpha" || options.preferredTeam === "beta") {
            player.team = options.preferredTeam;
        } else {
            const alphaCount = Array.from(this.state.players.values()).filter((p) => p.team === "alpha").length;
            const betaCount  = Array.from(this.state.players.values()).filter((p) => p.team === "beta").length;
            player.team = alphaCount <= betaCount ? "alpha" : "beta";
        }
        this.nextTeam = player.team === "alpha" ? "beta" : "alpha";

        this.state.players.set(client.sessionId, player);

        client.send("questions", this.questions);
        client.send("phaseSync", {
            phase: this.state.phase,
            questionIndex: this.state.questionIndex,
            roundEndsAt: this.state.roundEndsAt,
            phaseStartsAt: this.state.phaseStartsAt,
        });

        console.log(`[QuizTeamsRoom] ${player.username} joined Team ${player.team}`);
    }

    async onLeave(client: Client, consented: boolean) {
        const player = this.state.players.get(client.sessionId);
        if (!player) return;

        console.log(`[QuizTeamsRoom] ${player.username} disconnected. Waiting for reconnection...`);

        try {
            if (consented) throw new Error("consented");
            await this.allowReconnection(client, 20);
            console.log(`[QuizTeamsRoom] ${player.username} reconnected!`);
        } catch (e) {
            const wasHost = player.isHost;
            this.state.players.delete(client.sessionId);
            console.log(`[QuizTeamsRoom] ${player.username} left for good`);

            if (wasHost && this.state.players.size > 0) {
                const nextHost = Array.from(this.state.players.values())[0];
                nextHost.isHost = true;
            }
        }
    }

    onDispose() {
        if (this.questionTimer !== null) clearTimeout(this.questionTimer);
        if (this.revealTimer  !== null) clearTimeout(this.revealTimer);
    }

    private beginQuestion(index: number) {
        this.state.questionIndex = index;
        this.state.phase = "playing";
        this.state.roundEndsAt = Date.now() + ROUND_DURATION_SECS * 1000;
        this.state.phaseStartsAt = Date.now();
        this.revealStarted = false; // reset for new question

        this.state.players.forEach((p) => {
            p.answered = false;
            p.lastAnswerCorrect = false;
        });

        // Full-duration fallback: if nobody answers within ROUND_DURATION_SECS, advance anyway
        this.questionTimer = setTimeout(() => {
            this.questionTimer = null;
            if (!this.revealStarted) {
                this.revealStarted = true;
                this.state.phase = "reveal";
                this.state.roundEndsAt = Date.now() + 2000;
                this.revealTimer = setTimeout(() => {
                    this.revealTimer = null;
                    this.advanceFromQuestion();
                }, 2000);
            }
        }, ROUND_DURATION_SECS * 1000);
    }

    private advanceFromQuestion() {
        if (this.state.questionIndex + 1 < this.questions.length) {
            this.beginQuestion(this.state.questionIndex + 1);
        } else {
            this.state.phase = "finished";
        }
    }
}
