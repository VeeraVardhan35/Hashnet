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

    async onCreate(options: { lobbyRoomCode?: string }) {
        this.setState(new QuizTeamsState());
        this.state.roomCode = options?.lobbyRoomCode ?? generateRoomCode();
        this.state.totalQuestions = QUESTION_COUNT;
        this.state.roundDuration = ROUND_DURATION_SECS;

        await this.setMetadata({ roomCode: this.state.roomCode });
        console.log("[QuizTeamsRoom] Created, code:", this.state.roomCode);

        const docs = await QuestionModel.aggregate([
            { $sample: { size: QUESTION_COUNT } },
        ]);

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

                // Cancel the full-duration question timer
                if (this.questionTimer !== null) {
                    clearTimeout(this.questionTimer);
                    this.questionTimer = null;
                }

                const nextQuestionAt = Date.now() + REVEAL_SECS * 1000;

                // Tell all clients: "next question in X seconds"
                this.broadcast("revealCountdown", { nextQuestionAt });

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

    onLeave(client: Client) {
        const player = this.state.players.get(client.sessionId);
        if (!player) return;
        const wasHost = player.isHost;
        this.state.players.delete(client.sessionId);

        if (wasHost && this.state.players.size > 0) {
            const nextHost = Array.from(this.state.players.values())[0];
            nextHost.isHost = true;
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
                // Nobody answered — treat as "time's up" and give a short reveal then advance
                this.revealStarted = true;
                const nextQuestionAt = Date.now() + 2000;
                this.broadcast("revealCountdown", { nextQuestionAt });
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


const QUESTION_COUNT = 6;
const ROUND_DURATION_SECS = 30;
const REVEAL_DURATION_MS = 2_500;
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
    private nextTeam: "alpha" | "beta" = "alpha";

    async onCreate(options: { lobbyRoomCode?: string }) {
        this.setState(new QuizTeamsState());
        this.state.roomCode = options?.lobbyRoomCode ?? generateRoomCode();
        this.state.totalQuestions = QUESTION_COUNT;
        this.state.roundDuration = ROUND_DURATION_SECS;

        await this.setMetadata({ roomCode: this.state.roomCode });
        console.log("[QuizTeamsRoom] Created, code:", this.state.roomCode);

        const docs = await QuestionModel.aggregate([
            { $sample: { size: QUESTION_COUNT } },
        ]);

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

            const allAnswered = Array.from(this.state.players.values()).every((p) => p.answered);
            if (allAnswered) {
                if (this.questionTimer !== null) {
                    clearTimeout(this.questionTimer);
                    this.questionTimer = null;
                }
                setTimeout(() => this.advanceFromQuestion(), REVEAL_DURATION_MS);
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
            // Auto-balance: count current teams and assign to smaller team
            const alphaCount = Array.from(this.state.players.values()).filter((p) => p.team === "alpha").length;
            const betaCount  = Array.from(this.state.players.values()).filter((p) => p.team === "beta").length;
            player.team = alphaCount <= betaCount ? "alpha" : "beta";
        }
        this.nextTeam = player.team === "alpha" ? "beta" : "alpha"; // keep alternation in sync

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

    onLeave(client: Client) {
        const player = this.state.players.get(client.sessionId);
        if (!player) return;
        const wasHost = player.isHost;
        this.state.players.delete(client.sessionId);

        if (wasHost && this.state.players.size > 0) {
            const nextHost = Array.from(this.state.players.values())[0];
            nextHost.isHost = true;
        }
    }

    onDispose() {
        if (this.questionTimer !== null) {
            clearTimeout(this.questionTimer);
        }
    }

    private beginQuestion(index: number) {
        this.state.questionIndex = index;
        this.state.phase = "playing";
        this.state.roundEndsAt = Date.now() + ROUND_DURATION_SECS * 1000;
        this.state.phaseStartsAt = Date.now();

        this.state.players.forEach((p) => {
            p.answered = false;
            p.lastAnswerCorrect = false;
        });

        this.questionTimer = setTimeout(() => {
            this.questionTimer = null;
            this.advanceFromQuestion();
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
