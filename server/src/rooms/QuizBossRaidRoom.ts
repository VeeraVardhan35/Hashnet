import { Room } from "@colyseus/core";
import type { Client } from "@colyseus/core";
import { QuizBossRaidState, QuizRaidPlayer } from "./schema/QuizBossRaidState.js";
import { generateRoomCode } from "../utils/roomCode.js";
import QuestionModel from "../models/Question.js";

function pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

const QUESTION_COUNT = 15; // More questions for Boss Raid
const ROUND_DURATION_SECS = 20; // Faster paced questions
const REVEAL_DURATION_MS = 2_500;
const START_COUNTDOWN_MS = 5_000;

const ROLE_DMG_MULTI: Record<string, number> = { dps: 1.5, tank: 0.8, support: 1.0 };
const ROLE_MAX_HP: Record<string, number> = { dps: 100, tank: 150, support: 100 };
const BOSS_ABILITIES = ["doom", "silence", "stun", "cleave"] as const;

interface QuestionData {
    text: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    difficulty: string;
    points: number;
    category: string;
}

export class QuizBossRaidRoom extends Room<QuizBossRaidState> {
    maxClients = 8;
    private questions: QuestionData[] = [];
    private questionTimer: ReturnType<typeof setTimeout> | null = null;
    private bossTimer: ReturnType<typeof setTimeout> | null = null;
    private revealTimer: ReturnType<typeof setTimeout> | null = null;
    private revealStarted = false;

    async onCreate(options: any) {
        this.setState(new QuizBossRaidState());
        this.state.roomCode = options?.lobbyRoomCode ?? generateRoomCode();
        
        const qCount = options?.questionsCount ?? QUESTION_COUNT;
        this.state.totalQuestions = qCount;
        this.state.roundDuration = options?.timePerQuestion ?? ROUND_DURATION_SECS;

        const bossLevel = Math.max(1, Math.min(10, options?.bossLevel ?? 5));
        this.state.bossLevel = bossLevel;
        // Boss HP scales with level from 200 (level 1) to 1200 (level 10)
        this.state.bossMaxHp = 200 + Math.floor(((bossLevel - 1) / 9) * 1000);
        this.state.bossHp = this.state.bossMaxHp;

        await this.setMetadata({ roomCode: this.state.roomCode });
        console.log("[QuizBossRaidRoom] Created, code:", this.state.roomCode, "| boss HP:", this.state.bossMaxHp);

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
                this.scheduleNextAbility();
            }
        }, START_COUNTDOWN_MS);

        this.onMessage("submitAnswer", (client: Client, data: { optionIndex: number }) => {
            const player = this.state.players.get(client.sessionId);
            if (!player || player.answered || !player.isAlive) return;
            if (this.state.phase !== "playing") return;
            if (Date.now() < player.stunnedUntil || Date.now() < player.silencedUntil) return;

            const question = this.questions[this.state.questionIndex];
            if (!question) return;

            const isCorrect = data.optionIndex === question.correctIndex;
            player.answered = true;
            player.lastAnswerCorrect = isCorrect;

            if (isCorrect) {
                const timeLeft = Math.max(0, (this.state.roundEndsAt - Date.now()) / 1000);
                const timeBonus = Math.floor((timeLeft / ROUND_DURATION_SECS) * 5);
                const baseDmg = question.points + timeBonus;
                const dmgMult = ROLE_DMG_MULTI[player.role] ?? 1.0;
                
                // Enrage phase modifier
                let damage = Math.floor(baseDmg * dmgMult);
                if (this.state.bossPhase === "enraged") {
                    damage = Math.floor(damage * 0.8); // Boss takes less damage
                }

                player.score += baseDmg;
                player.damageDealt += damage;
                player.streak += 1;

                this.damageBoss(damage);

                if (player.role === "support") {
                    const allies = Array.from(this.state.players.values()).filter((p) => p.isAlive && p.id !== player.id);
                    if (allies.length > 0) {
                        const target = pick(allies);
                        target.hp = Math.min(target.maxHp, target.hp + 10);
                        this.broadcast("liveEvent", { username: player.username, type: "heal", message: `healed ${target.username} for 10 HP!`, color: "cyan" });
                    }
                }

                this.broadcast("liveEvent", { username: player.username, type: "damage", message: `dealt ${damage} damage to boss!`, color: "green" });
            } else {
                player.streak = 0;
                this.broadcast("liveEvent", { username: player.username, type: "wrong", message: "missed the target!", color: "red" });
            }

            // ── Start 5-second reveal on the FIRST answer of this question ──
            if (!this.revealStarted) {
                this.revealStarted = true;
                
                if (this.questionTimer !== null) {
                    clearTimeout(this.questionTimer);
                    this.questionTimer = null;
                }
                
                this.state.phase = "reveal";
                this.state.roundEndsAt = Date.now() + REVEAL_DURATION_MS;

                this.revealTimer = setTimeout(() => {
                    this.revealTimer = null;
                    this.advanceFromQuestion();
                }, REVEAL_DURATION_MS);
            }
        });
    }

    onJoin(client: Client, options: { username?: string }) {
        const player = new QuizRaidPlayer();
        player.id = client.sessionId;
        player.username = options.username?.trim() || "Guest";
        player.isHost = this.state.players.size === 0;
        player.role = pick(["dps", "tank", "support"] as const);
        player.maxHp = ROLE_MAX_HP[player.role] ?? 100;
        player.hp = player.maxHp;
        
        this.state.players.set(client.sessionId, player);

        client.send("questions", this.questions);
        client.send("phaseSync", {
            phase: this.state.phase,
            questionIndex: this.state.questionIndex,
            roundEndsAt: this.state.roundEndsAt,
            phaseStartsAt: this.state.phaseStartsAt,
        });

        console.log(`[QuizBossRaidRoom] ${player.username} joined (${player.role})`);
    }

    async onLeave(client: Client, consented: boolean) {
        const player = this.state.players.get(client.sessionId);
        if (!player) return;

        console.log(`[QuizBossRaidRoom] ${player.username} disconnected. Waiting for reconnection...`);

        try {
            if (consented) throw new Error("consented");
            await this.allowReconnection(client, 20);
            console.log(`[QuizBossRaidRoom] ${player.username} reconnected!`);
        } catch (e) {
            const wasHost = player.isHost;
            this.state.players.delete(client.sessionId);
            console.log(`[QuizBossRaidRoom] ${player.username} left for good`);

            if (wasHost && this.state.players.size > 0) {
                const nextHost = Array.from(this.state.players.values())[0];
                nextHost.isHost = true;
            }
            this.checkAllDead();
        }
    }

    onDispose() {
        if (this.questionTimer !== null) clearTimeout(this.questionTimer);
        if (this.bossTimer !== null) clearTimeout(this.bossTimer);
        if (this.revealTimer !== null) clearTimeout(this.revealTimer);
    }

    private beginQuestion(index: number) {
        if (this.state.bossHp <= 0) return; // Boss dead
        const alivePlayers = Array.from(this.state.players.values()).filter((p) => p.isAlive);
        if (alivePlayers.length === 0) return; // All dead

        this.state.questionIndex = index;
        this.state.phase = "playing";
        this.state.roundEndsAt = Date.now() + ROUND_DURATION_SECS * 1000;
        this.state.phaseStartsAt = Date.now();
        this.revealStarted = false;

        this.state.players.forEach((p) => {
            p.answered = false;
            p.lastAnswerCorrect = false;
        });

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
        if (this.state.bossHp <= 0 || this.checkAllDead()) return;

        if (this.state.questionIndex + 1 < this.questions.length) {
            this.beginQuestion(this.state.questionIndex + 1);
        } else {
            this.state.phase = "finished";
        }
    }

    private checkAllDead(): boolean {
        const aliveCount = Array.from(this.state.players.values()).filter((p) => p.isAlive).length;
        if (aliveCount === 0) {
            this.state.phase = "finished";
            if (this.questionTimer) clearTimeout(this.questionTimer);
            if (this.bossTimer) clearTimeout(this.bossTimer);
            return true;
        }
        return false;
    }

    private damageBoss(amt: number) {
        if (this.state.bossHp <= 0) return;
        this.state.bossHp = Math.max(0, this.state.bossHp - amt);

        if (this.state.bossHp > 0 && this.state.bossHp <= this.state.bossMaxHp * 0.3 && this.state.bossPhase === "normal") {
            this.state.bossPhase = "enraged";
            this.broadcast("liveEvent", { username: "BOSS", type: "enrage", message: "grows enraged!", color: "red" });
        }

        if (this.state.bossHp <= 0) {
            this.state.bossHp = 0;
            this.state.phase = "finished";
            this.broadcast("liveEvent", { username: "SYSTEM", type: "system", message: "Boss Defeated!", color: "purple" });
            if (this.questionTimer) clearTimeout(this.questionTimer);
            if (this.bossTimer) clearTimeout(this.bossTimer);
        }
    }

    private scheduleNextAbility() {
        if (this.state.phase === "finished" || this.state.bossHp <= 0) return;

        let delayMs = 15000 + Math.random() * 10000; // 15-25s
        if (this.state.bossPhase === "enraged") delayMs *= 0.6; // Faster

        this.state.nextAbilityName = pick(BOSS_ABILITIES);
        this.state.nextAbilityAt = Date.now() + delayMs;

        this.bossTimer = setTimeout(() => this.fireAbility(), delayMs);
    }

    private fireAbility() {
        if (this.state.phase === "finished" || this.state.bossHp <= 0) return;

        const ability = this.state.nextAbilityName;
        const alive = Array.from(this.state.players.values()).filter((p) => p.isAlive);
        if (alive.length === 0) return;

        let eventMsg = "";
        
        switch (ability) {
            case "cleave": {
                const dmg = this.state.bossPhase === "enraged" ? 40 : 25;
                for (const p of alive) {
                    let actualDmg = dmg;
                    if (p.role === "tank") actualDmg = Math.floor(actualDmg * 0.5); // Tank mitigates
                    p.hp = Math.max(0, p.hp - actualDmg);
                    if (p.hp <= 0) p.isAlive = false;
                }
                eventMsg = `cleaved everyone for ${dmg} damage!`;
                break;
            }
            case "silence": {
                const target = pick(alive);
                target.silencedUntil = Date.now() + 10000;
                eventMsg = `silenced ${target.username} for 10s!`;
                break;
            }
            case "stun": {
                const target = pick(alive);
                target.stunnedUntil = Date.now() + 8000;
                eventMsg = `stunned ${target.username} for 8s!`;
                break;
            }
            case "doom": {
                const target = pick(alive);
                target.isDoomMarked = true;
                eventMsg = `marked ${target.username} for DOOM!`;
                setTimeout(() => {
                    if (target.isAlive && target.isDoomMarked) {
                        target.hp = Math.max(0, target.hp - 80);
                        target.isDoomMarked = false;
                        if (target.hp <= 0) target.isAlive = false;
                        this.broadcast("liveEvent", { username: "BOSS", type: "damage", message: `Doom hit ${target.username} for 80 damage!`, color: "red" });
                        this.checkAllDead();
                    }
                }, 10000);
                break;
            }
        }

        this.broadcast("liveEvent", { username: "BOSS", type: "ability", message: eventMsg, color: "purple" });
        this.state.activeAbilities.push(ability);
        
        this.checkAllDead();
        this.scheduleNextAbility();
    }
}
