import { Room } from "@colyseus/core";
import type { Client } from "@colyseus/core";
import { BossRaidState, RaidPlayer } from "./schema/BossRaidState.js";
import { generateRoomCode } from "../utils/roomCode.js";
import ProblemModel from "../models/Problem.js";
import { evaluateTestCase } from "../services/piston.js";

// ── Constants ────────────────────────────────────────────────────────────────

const WAVE_DURATION_SECS  = 600;           // 10 min per wave
const START_COUNTDOWN_MS  = 5_000;
const WAVE_END_PAUSE_MS   = 6_000;

// How much HP the boss has (scales with player count)
const BOSS_BASE_HP        = 30_000;
const BOSS_HP_PER_PLAYER  = 5_000;

// Role HP caps
const ROLE_MAX_HP: Record<string, number> = { dps: 100, tank: 150, support: 100 };
// DPS deals 1.5x damage to boss
const ROLE_DMG_MULTI: Record<string, number> = { dps: 1.5, tank: 1.0, support: 1.0 };

// Boss attack damage ranges [min, max] per level band
const BOSS_DMG_EASY   = [10, 20] as const;
const BOSS_DMG_MEDIUM = [15, 30] as const;
const BOSS_DMG_HARD   = [20, 45] as const;

// Boss attack intervals (ms) per level band
const ATTACK_INTERVAL_EASY   = 35_000;
const ATTACK_INTERVAL_MEDIUM = 22_000;
const ATTACK_INTERVAL_HARD   = 12_000;

// Abilities pool
const ALL_ABILITIES = ["timer_reduced", "silence", "stun", "shadow_strike", "rage", "doom"] as const;
type AbilityName = typeof ALL_ABILITIES[number];

interface ProblemData {
    title: string; description: string; difficulty: string; points: number;
    timeLimit: number;
    examples: { input: string; output: string; explanation: string }[];
    hiddenTestCases: { input: string; expectedOutput: string }[];
    templates: { python: string; javascript: string; cpp: string };
    tags: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function randInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

// ── Room ─────────────────────────────────────────────────────────────────────

export class BossRaidRoom extends Room<BossRaidState> {
    maxClients = 20;

    private problems: ProblemData[] = [];
    private currentProblemIndex = 0;
    private waveTimer: ReturnType<typeof setTimeout> | null = null;
    private attackTimer: ReturnType<typeof setTimeout> | null = null;
    private abilityTimer: ReturnType<typeof setTimeout> | null = null;
    private rageActive = false;

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    async onCreate(options: { lobbyRoomCode?: string; bossLevel?: number }) {
        this.setState(new BossRaidState());

        const bossLevel = Math.max(1, Math.min(10, options?.bossLevel ?? 5));
        this.state.roomCode      = options?.lobbyRoomCode ?? generateRoomCode();
        this.state.bossLevel     = bossLevel;
        this.state.bossName      = this.pickBossName(bossLevel);
        this.state.phase         = "countdown";
        this.state.phaseStartsAt = Date.now() + START_COUNTDOWN_MS;

        await this.setMetadata({ roomCode: this.state.roomCode });

        const docs = await ProblemModel.find({}).sort({ order: 1 }).lean();
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
        }));
        this.state.totalWaves = Math.min(3, this.problems.length || 1);

        // Boss HP scales with player count — set dynamically at wave start
        const baseHp = BOSS_BASE_HP;
        this.state.bossHp    = baseHp;
        this.state.bossMaxHp = baseHp;

        // ── "ready" handshake ─────────────────────────────────────────────────
        this.onMessage("ready", (client: Client) => {
            const player = this.state.players.get(client.sessionId);
            if (!player) return;
            client.send("problem", this.buildProblemPayload(this.currentProblemIndex));
            client.send("phaseSync", this.buildPhaseSync());
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
                console.error("[BossRaidRoom] runCode error:", err);
                client.send("runCodeResult", { error: "Execution service error" });
            }
        });

        // ── Submit Code ───────────────────────────────────────────────────────
        this.onMessage("submitCode", async (client: Client, data: { code: string; language: string }) => {
            try {
                const player = this.state.players.get(client.sessionId);
                if (!player) { client.send("submitResult", { verdict: "error", details: "Unknown player" }); return; }
                if (!player.isAlive) { client.send("submitResult", { verdict: "eliminated", details: "You are dead" }); return; }
                if (this.state.phase !== "wave") { client.send("submitResult", { verdict: "not_active", details: "No active wave" }); return; }

                const now = Date.now();
                if (player.silencedUntil > now) {
                    client.send("submitResult", { verdict: "silenced", details: "You are silenced by the boss!" });
                    return;
                }
                if (player.stunnedUntil > now) {
                    client.send("submitResult", { verdict: "stunned", details: "You are stunned by the boss!" });
                    return;
                }
                if (player.submissionStatus === "accepted") {
                    client.send("submitResult", { verdict: "already_accepted", details: "" });
                    return;
                }

                const problem = this.problems[this.currentProblemIndex];
                if (!problem) { client.send("submitResult", { verdict: "error", details: "No problem loaded" }); return; }

                player.submissions      += 1;
                player.submissionStatus  = "pending";

                const results = await Promise.all(
                    problem.hiddenTestCases.map((tc) =>
                        evaluateTestCase(data.language, data.code, tc.input, tc.expectedOutput, problem.timeLimit)
                    )
                );

                const allPassed  = results.every((r) => r.passed);
                const failedRes  = results.find((r) => !r.passed);
                const verdict    = allPassed ? "accepted" : (failedRes?.verdict ?? "wrong_answer");
                const details    = failedRes?.verdict === "wrong_answer"
                    ? `Expected: ${failedRes.expectedOutput}\nGot: ${failedRes.actualOutput}`
                    : failedRes?.stderr?.slice(0, 300) ?? "";
                player.submissionStatus = verdict;

                if (verdict === "accepted") {
                    const timeLeft  = Math.max(0, (this.state.roundEndsAt - Date.now()) / 1000);
                    const timeBonus = Math.floor((timeLeft / WAVE_DURATION_SECS) * 30);
                    const baseDmg   = problem.points + timeBonus;
                    const dmgMult   = ROLE_DMG_MULTI[player.role] ?? 1.0;
                    const damage    = Math.floor(baseDmg * dmgMult);

                    player.score       += baseDmg;
                    player.solved      += 1;
                    player.damageDealt += damage;

                    // Deal damage to boss
                    this.damageBoss(damage);

                    // Support: heal a random alive ally by 10 HP
                    if (player.role === "support") {
                        const allies = Array.from(this.state.players.values())
                            .filter((p) => p.isAlive && p.id !== player.id);
                        if (allies.length > 0) {
                            const target = pick(allies);
                            target.hp = Math.min(target.maxHp, target.hp + 10);
                            this.broadcast("liveEvent", {
                                username: player.username,
                                type: "heal",
                                message: `healed ${target.username} for 10 HP!`,
                                color: "cyan",
                            });
                        }
                    }

                    this.broadcast("liveEvent", {
                        username: player.username,
                        type: "damage",
                        message: `dealt ${damage} damage to boss!`,
                        color: "green",
                    });
                    client.send("submitResult", { verdict, details: "", score: player.score, damage });
                } else {
                    this.broadcast("liveEvent", {
                        username: player.username,
                        type: "wrong",
                        message: verdict.replace(/_/g, " "),
                        color: "red",
                    });
                    client.send("submitResult", { verdict, details, canRetry: true });
                }
            } catch (err) {
                console.error("[BossRaidRoom] submitCode error:", err);
                client.send("submitResult", { verdict: "error", details: "Execution service unavailable" });
            }
        });

        this.clock.setTimeout(() => this.startWave(0), START_COUNTDOWN_MS);
        console.log("[BossRaidRoom] Created, code:", this.state.roomCode, "| boss level:", bossLevel);
    }

    onJoin(client: Client, options: { username?: string }) {
        const player        = new RaidPlayer();
        player.id           = client.sessionId;
        player.username     = options.username?.trim() || "Guest";
        player.isHost       = this.state.players.size === 0;
        player.role         = pick(["dps", "tank", "support"] as const);
        player.maxHp        = ROLE_MAX_HP[player.role] ?? 100;
        player.hp           = player.maxHp;
        player.isAlive      = true;
        this.state.players.set(client.sessionId, player);
        console.log(`[BossRaidRoom] ${player.username} joined (role: ${player.role})`);
    }

    onLeave(client: Client) {
        this.state.players.delete(client.sessionId);
    }

    onDispose() {
        if (this.waveTimer)   clearTimeout(this.waveTimer);
        if (this.attackTimer) clearTimeout(this.attackTimer);
        if (this.abilityTimer) clearTimeout(this.abilityTimer);
        console.log("[BossRaidRoom] Disposed:", this.state.roomCode);
    }

    // ── Wave Flow ─────────────────────────────────────────────────────────────

    private startWave(index: number) {
        this.currentProblemIndex = index;
        this.state.waveNumber    = index + 1;
        this.state.phase         = "wave";

        // Scale boss HP with player count on first wave
        if (index === 0) {
            const total = this.state.players.size;
            const hp = BOSS_BASE_HP + total * BOSS_HP_PER_PLAYER;
            this.state.bossHp    = hp;
            this.state.bossMaxHp = hp;
        }

        // Harder waves → shorter timer + enrage if low HP
        const durationSecs = this.waveDuration();
        this.state.roundEndsAt   = Date.now() + durationSecs * 1000;
        this.state.phaseStartsAt = Date.now();
        this.state.roundDuration = durationSecs;
        this.rageActive          = false;

        // Reset submission state
        this.state.players.forEach((p) => {
            if (p.isAlive) { p.submissionStatus = ""; p.submissions = 0; }
        });

        this.broadcast("problem", this.buildProblemPayload(index));
        this.broadcast("phaseSync", this.buildPhaseSync());
        this.broadcast("liveEvent", {
            username: "System",
            type: "system",
            message: `Wave ${this.state.waveNumber} begins! Boss HP: ${this.state.bossHp.toLocaleString()}`,
            color: "yellow",
        });

        // Schedule boss attack loop
        this.scheduleBossAttack();

        // Schedule boss ability for this wave
        this.scheduleAbility();

        // Wave timer
        this.waveTimer = setTimeout(() => {
            this.waveTimer = null;
            this.endWave();
        }, durationSecs * 1000);
    }

    private endWave() {
        this.clearTimers(false); // keep attackTimer cleared within
        this.state.phase = "wave_end";

        const bossAlive   = this.state.bossHp > 0;
        const allDead     = Array.from(this.state.players.values()).every((p) => !p.isAlive);
        const lastWave    = this.state.waveNumber >= this.state.totalWaves;

        if (!bossAlive) {
            // Players won!
            setTimeout(() => this.finishGame(true), WAVE_END_PAUSE_MS);
        } else if (allDead || lastWave) {
            // Boss wins
            setTimeout(() => this.finishGame(false), WAVE_END_PAUSE_MS);
        } else {
            // Next wave
            this.broadcast("liveEvent", {
                username: "System",
                type: "system",
                message: `Wave ${this.state.waveNumber} over — prepare for Wave ${this.state.waveNumber + 1}!`,
                color: "yellow",
            });
            setTimeout(() => this.startWave(this.state.waveNumber), WAVE_END_PAUSE_MS);
        }
    }

    private finishGame(playersWon: boolean) {
        this.state.phase      = "finished";
        this.state.playersWon = playersWon;

        const leaderboard = Array.from(this.state.players.values())
            .map((p) => ({
                id: p.id, username: p.username, role: p.role,
                damageDealt: p.damageDealt, score: p.score,
                solved: p.solved, isAlive: p.isAlive, hp: p.hp, maxHp: p.maxHp,
            }))
            .sort((a, b) => b.damageDealt - a.damageDealt);

        this.broadcast("gameOver", { playersWon, leaderboard, bossHpRemaining: this.state.bossHp });
        console.log("[BossRaidRoom] Game over — players won:", playersWon);
    }

    // ── Boss AI ───────────────────────────────────────────────────────────────

    private scheduleBossAttack() {
        if (this.attackTimer) { clearTimeout(this.attackTimer); this.attackTimer = null; }
        if (this.state.phase !== "wave") return;

        const interval = this.attackInterval();

        this.attackTimer = setTimeout(() => {
            this.attackTimer = null;
            if (this.state.phase !== "wave") return;

            this.executeBossAttack();
            this.scheduleBossAttack(); // reschedule
        }, interval);
    }

    private executeBossAttack() {
        const alive = Array.from(this.state.players.values()).filter((p) => p.isAlive);
        if (alive.length === 0) return;

        const level = this.state.bossLevel;
        let target: RaidPlayer;

        if (level >= 8) {
            // Hard — greedy: attack lowest HP player
            target = alive.reduce((a, b) => a.hp < b.hp ? a : b);
        } else if (level >= 4) {
            // Medium — 60% random, 40% lowest HP
            if (Math.random() < 0.4) {
                target = alive.reduce((a, b) => a.hp < b.hp ? a : b);
            } else {
                target = pick(alive);
            }
        } else {
            // Easy — fully random
            target = pick(alive);
        }

        const [min, max] = this.damageBand();
        let dmg = randInt(min, max);

        // Enraged phase: +50% damage
        if (this.state.bossPhase === "enraged") dmg = Math.ceil(dmg * 1.5);
        // Rage ability: ×1.5 damage
        if (this.rageActive) dmg = Math.ceil(dmg * 1.5);

        target.hp = Math.max(0, target.hp - dmg);

        const wasAlive = target.isAlive;
        if (target.hp <= 0 && wasAlive) {
            target.isAlive = false;
            this.broadcast("liveEvent", {
                username: target.username,
                type: "eliminated",
                message: `was slain by the boss!`,
                color: "red",
            });

            // Check if all players dead → boss wins
            const allDead = Array.from(this.state.players.values()).every((p) => !p.isAlive);
            if (allDead) {
                if (this.waveTimer) { clearTimeout(this.waveTimer); this.waveTimer = null; }
                this.endWave();
                return;
            }
        } else {
            this.broadcast("liveEvent", {
                username: "Boss",
                type: "boss_attack",
                message: `attacked ${target.username} for ${dmg} HP!`,
                color: "orange",
            });
        }
    }

    private damageBoss(damage: number) {
        this.state.bossHp = Math.max(0, this.state.bossHp - damage);

        // Check enrage threshold (< 30% HP)
        const ratio = this.state.bossHp / this.state.bossMaxHp;
        if (ratio < 0.3 && this.state.bossPhase === "normal") {
            this.state.bossPhase = "enraged";
            this.broadcast("liveEvent", {
                username: "System",
                type: "system",
                message: "Boss is ENRAGED! Damage +50%, attack speed increased!",
                color: "red",
            });
        }

        // Boss killed?
        if (this.state.bossHp <= 0) {
            if (this.waveTimer) { clearTimeout(this.waveTimer); this.waveTimer = null; }
            if (this.attackTimer) { clearTimeout(this.attackTimer); this.attackTimer = null; }
            this.endWave();
        }
    }

    // ── Abilities ─────────────────────────────────────────────────────────────

    private scheduleAbility() {
        if (this.abilityTimer) { clearTimeout(this.abilityTimer); this.abilityTimer = null; }
        if (this.state.phase !== "wave") return;

        const ability    = pick(ALL_ABILITIES);
        const delayMs    = randInt(30_000, 90_000); // ability fires 30–90s into wave

        this.state.nextAbilityName = this.abilityLabel(ability);
        this.state.nextAbilityAt   = Date.now() + delayMs;
        this.broadcast("abilityWarning", {
            name: this.state.nextAbilityName,
            firesInMs: delayMs,
        });

        this.abilityTimer = setTimeout(() => {
            this.abilityTimer = null;
            if (this.state.phase !== "wave") return;
            this.fireAbility(ability);
            // Schedule next ability
            this.scheduleAbility();
        }, delayMs);
    }

    private fireAbility(ability: AbilityName) {
        const alive = Array.from(this.state.players.values()).filter((p) => p.isAlive);
        if (alive.length === 0) return;

        // Add to active abilities list
        const active: string[] = JSON.parse(this.state.activeAbilitiesJson || "[]");
        active.push(this.abilityLabel(ability));
        this.state.activeAbilitiesJson = JSON.stringify(active);

        switch (ability) {
            case "silence": {
                // Silence 1–2 random alive players for 20s
                const count = Math.min(alive.length, randInt(1, 2));
                const targets = alive.sort(() => Math.random() - 0.5).slice(0, count);
                const until   = Date.now() + 20_000;
                targets.forEach((p) => {
                    p.silencedUntil = until;
                    this.broadcast("liveEvent", {
                        username: "Boss",
                        type: "ability",
                        message: `used SILENCE on ${p.username}! Can't submit for 20s.`,
                        color: "purple",
                    });
                });
                break;
            }
            case "stun": {
                const target = pick(alive);
                target.stunnedUntil = Date.now() + 10_000;
                this.broadcast("liveEvent", {
                    username: "Boss",
                    type: "ability",
                    message: `STUNNED ${target.username} for 10s!`,
                    color: "purple",
                });
                break;
            }
            case "shadow_strike": {
                // Next attack hits a single target for 2× damage (simulated immediately)
                const target = alive.reduce((a, b) => a.hp < b.hp ? a : b);
                const [min, max] = this.damageBand();
                const dmg = Math.ceil(randInt(min, max) * 2);
                target.hp = Math.max(0, target.hp - dmg);
                if (target.hp <= 0) target.isAlive = false;
                this.broadcast("liveEvent", {
                    username: "Boss",
                    type: "ability",
                    message: `used SHADOW STRIKE on ${target.username} for ${dmg} HP!`,
                    color: "red",
                });
                break;
            }
            case "timer_reduced": {
                // Reduce remaining wave time by 20% (minimum 60s left)
                const remaining = Math.max(60_000, this.state.roundEndsAt - Date.now());
                const newEnd    = Date.now() + Math.floor(remaining * 0.8);
                this.state.roundEndsAt = newEnd;

                if (this.waveTimer) {
                    clearTimeout(this.waveTimer);
                    this.waveTimer = setTimeout(() => { this.waveTimer = null; this.endWave(); },
                        Math.max(0, newEnd - Date.now()));
                }
                this.broadcast("liveEvent", {
                    username: "Boss",
                    type: "ability",
                    message: "used TIMER REDUCED! 20% less time remaining!",
                    color: "orange",
                });
                break;
            }
            case "rage": {
                this.rageActive = true;
                this.broadcast("liveEvent", {
                    username: "Boss",
                    type: "ability",
                    message: "is in RAGE! Attack damage ×1.5 for 20s!",
                    color: "red",
                });
                setTimeout(() => { this.rageActive = false; }, 20_000);
                break;
            }
            case "doom": {
                const target = pick(alive);
                target.isDoomMarked = true;
                this.broadcast("liveEvent", {
                    username: "Boss",
                    type: "ability",
                    message: `marked ${target.username} with DOOM! Solve in 30s or lose 40 HP!`,
                    color: "red",
                });
                setTimeout(() => {
                    if (!target.isAlive || target.submissionStatus === "accepted") {
                        target.isDoomMarked = false;
                        return;
                    }
                    target.hp = Math.max(0, target.hp - 40);
                    if (target.hp <= 0) target.isAlive = false;
                    target.isDoomMarked = false;
                    this.broadcast("liveEvent", {
                        username: "Boss",
                        type: "ability",
                        message: `Doom triggered on ${target.username}!`,
                        color: "red",
                    });
                }, 30_000);
                break;
            }
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private attackInterval(): number {
        const base = this.state.bossLevel >= 8 ? ATTACK_INTERVAL_HARD
            : this.state.bossLevel >= 4 ? ATTACK_INTERVAL_MEDIUM
            : ATTACK_INTERVAL_EASY;
        return this.state.bossPhase === "enraged" ? Math.floor(base * 0.6) : base;
    }

    private damageBand() {
        return this.state.bossLevel >= 8 ? BOSS_DMG_HARD
            : this.state.bossLevel >= 4 ? BOSS_DMG_MEDIUM
            : BOSS_DMG_EASY;
    }

    private waveDuration(): number {
        // Hard boss (wave 3) gets a shorter timer
        const base = WAVE_DURATION_SECS;
        const reduction = this.state.bossPhase === "enraged" ? 0.8 : 1.0;
        const waveReduction = 1 - (this.state.waveNumber - 1) * 0.05;
        return Math.floor(base * reduction * waveReduction);
    }

    private clearTimers(all = true) {
        if (this.attackTimer)  { clearTimeout(this.attackTimer);  this.attackTimer  = null; }
        if (this.abilityTimer) { clearTimeout(this.abilityTimer); this.abilityTimer = null; }
        if (all && this.waveTimer) { clearTimeout(this.waveTimer); this.waveTimer = null; }
    }

    private pickBossName(level: number): string {
        if (level <= 3) return "Syntax Serpent";
        if (level <= 6) return "Logic Lich";
        return "Algorithm Overlord";
    }

    private abilityLabel(name: AbilityName): string {
        const labels: Record<AbilityName, string> = {
            timer_reduced: "Timer Reduced",
            silence: "Silence",
            stun: "Stun",
            shadow_strike: "Shadow Strike",
            rage: "Rage",
            doom: "Doom",
        };
        return labels[name];
    }

    private buildPhaseSync() {
        return {
            phase: this.state.phase,
            waveNumber: this.state.waveNumber,
            totalWaves: this.state.totalWaves,
            roundEndsAt: this.state.roundEndsAt,
            phaseStartsAt: this.state.phaseStartsAt,
            bossHp: this.state.bossHp,
            bossMaxHp: this.state.bossMaxHp,
            bossPhase: this.state.bossPhase,
            bossName: this.state.bossName,
            bossLevel: this.state.bossLevel,
        };
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
