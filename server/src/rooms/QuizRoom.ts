import { Room } from "@colyseus/core";
import type { Client } from "@colyseus/core";
import { QuizState, QuizPlayer } from "./schema/QuizState.js";
import { generateRoomCode } from "../utils/roomCode.js";
import QuestionModel from "../models/Question.js";

const QUESTION_COUNT = 6;
const ROUND_DURATION_SECS = 30;
const REVEAL_DURATION_MS = 2_500; // brief pause between questions
const START_COUNTDOWN_MS = 5_000; // wait 5 s for all lobby players to connect

interface QuestionData {
    text: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    difficulty: string;
    points: number;
    category: string;
}

export class QuizRoom extends Room<QuizState> {
    maxClients = 8;

    /** Private — never sent in schema (only via direct message on join) */
    private questions: QuestionData[] = [];

    /** Ref to the current question timer so we can cancel early */
    private questionTimer: ReturnType<typeof setTimeout> | null = null;

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    async onCreate(options: { lobbyRoomCode?: string }) {
        this.setState(new QuizState());

        this.state.roomCode = options?.lobbyRoomCode ?? generateRoomCode();
        this.state.totalQuestions = QUESTION_COUNT;
        this.state.roundDuration = ROUND_DURATION_SECS;

        await this.setMetadata({ roomCode: this.state.roomCode });

        console.log("[QuizRoom] Created, code:", this.state.roomCode);

        // Load random questions from DB
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

        // Auto-start 5 s after room creation (gives lobby players time to navigate & connect)
        this.state.phase = "countdown";
        this.state.phaseStartsAt = Date.now() + START_COUNTDOWN_MS;

        this.clock.setTimeout(() => {
            if (this.state.players.size > 0) {
                this.beginQuestion(0);
            }
        }, START_COUNTDOWN_MS);

        // ── Message Handlers ─────────────────────────────────────────────────

        this.onMessage(
            "submitAnswer",
            (client: Client, data: { optionIndex: number }) => {
                const player = this.state.players.get(client.sessionId);
                if (!player || player.answered) return;
                if (this.state.phase !== "question") return;

                const question = this.questions[this.state.questionIndex];
                if (!question) return;

                const isCorrect = data.optionIndex === question.correctIndex;
                player.answered = true;
                player.lastAnswerCorrect = isCorrect;

                if (isCorrect) {
                    const timeLeft = Math.max(
                        0,
                        (this.state.roundEndsAt - Date.now()) / 1000
                    );
                    const timeBonus = Math.floor(
                        (timeLeft / ROUND_DURATION_SECS) * 5
                    );
                    const earned = question.points + timeBonus;
                    player.score += earned;
                    player.streak += 1;

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

                // If every player has answered, advance early
                const allAnswered = Array.from(
                    this.state.players.values()
                ).every((p) => p.answered);

                if (allAnswered) {
                    if (this.questionTimer !== null) {
                        clearTimeout(this.questionTimer);
                        this.questionTimer = null;
                    }
                    // Short delay so the last player sees their result
                    setTimeout(() => this.advanceFromQuestion(), REVEAL_DURATION_MS);
                }
            }
        );
    }

    onJoin(client: Client, options: { username?: string }) {
        const player = new QuizPlayer();
        player.id = client.sessionId;
        player.username = options.username?.trim() || "Guest";
        player.isHost = this.state.players.size === 0;

        this.state.players.set(client.sessionId, player);

        // Send ALL questions (including correct answers) immediately.
        // Answer evaluation happens client-side for instant feedback;
        // scores are server-verified on submitAnswer.
        client.send("questions", this.questions);

        // Also send current phase so late joiners sync properly
        client.send("phaseSync", {
            phase: this.state.phase,
            questionIndex: this.state.questionIndex,
            roundEndsAt: this.state.roundEndsAt,
            phaseStartsAt: this.state.phaseStartsAt,
        });

        console.log(
            `[QuizRoom] ${player.username} joined (host: ${player.isHost})`
        );
    }

    onLeave(client: Client) {
        const player = this.state.players.get(client.sessionId);
        if (!player) return;

        const wasHost = player.isHost;
        this.state.players.delete(client.sessionId);

        console.log(`[QuizRoom] ${player.username} left`);

        if (wasHost && this.state.players.size > 0) {
            const nextHost = Array.from(this.state.players.values())[0];
            nextHost.isHost = true;
        }
    }

    onDispose() {
        if (this.questionTimer !== null) {
            clearTimeout(this.questionTimer);
        }
        console.log("[QuizRoom] Disposed:", this.state.roomCode);
    }

    // ── Game Flow ─────────────────────────────────────────────────────────────

    private beginQuestion(index: number) {
        this.state.questionIndex = index;
        this.state.phase = "question";
        this.state.roundEndsAt = Date.now() + ROUND_DURATION_SECS * 1000;
        this.state.phaseStartsAt = Date.now();

        // Reset answered flag for all players
        this.state.players.forEach((p) => {
            p.answered = false;
            p.lastAnswerCorrect = false;
        });

        console.log(
            `[QuizRoom] Question ${index + 1}/${this.questions.length}`
        );

        this.questionTimer = setTimeout(() => {
            this.questionTimer = null;
            this.advanceFromQuestion();
        }, ROUND_DURATION_SECS * 1000);
    }

    private advanceFromQuestion() {
        const next = this.state.questionIndex + 1;
        if (next < this.questions.length) {
            this.state.phase = "reveal";
            // Brief reveal pause before the next question
            setTimeout(() => this.beginQuestion(next), REVEAL_DURATION_MS);
        } else {
            this.endGame();
        }
    }

    private endGame() {
        this.state.phase = "finished";

        const leaderboard = Array.from(this.state.players.values())
            .map((p) => ({
                id: p.id,
                username: p.username,
                score: p.score,
                streak: p.streak,
            }))
            .sort((a, b) => b.score - a.score);

        this.broadcast("gameOver", { leaderboard });
        console.log("[QuizRoom] Game over!");
    }
}
