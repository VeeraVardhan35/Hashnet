import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

export class RaidPlayer extends Schema {
    @type("string") id = "";
    @type("string") username = "";
    /** DPS gets 1.5x damage multiplier, Tank gets extra HP, Support heals ally on solve */
    @type("string") role: "dps" | "tank" | "support" = "dps";
    @type("number") hp = 100;
    @type("number") maxHp = 100;
    @type("number") score = 0;
    @type("number") solved = 0;
    @type("number") damageDealt = 0;
    @type("boolean") isAlive = true;
    @type("boolean") isHost = false;
    @type("string")  submissionStatus = "";
    @type("number")  submissions = 0;
    /** Unix-ms timestamp until which this player is silenced (can't submit) */
    @type("number")  silencedUntil = 0;
    /** Unix-ms timestamp until which this player is stunned (can't act) */
    @type("number")  stunnedUntil = 0;
    /** Whether this player is marked by Doom ability */
    @type("boolean") isDoomMarked = false;
}

export class BossRaidState extends Schema {
    @type("string") roomCode = "";
    /** "countdown" | "wave" | "wave_end" | "finished" */
    @type("string") phase = "countdown";
    @type("number") waveNumber = 1;
    @type("number") totalWaves = 3;
    @type("number") roundEndsAt = 0;
    @type("number") roundDuration = 600;
    @type("number") phaseStartsAt = 0;

    // Boss
    @type("string") bossName = "Algorithm Overlord";
    @type("number") bossLevel = 5;        // 1-10; determines difficulty
    @type("number") bossHp = 50_000;
    @type("number") bossMaxHp = 50_000;
    /** "normal" | "enraged" (HP < 30% → enraged: +50% damage, shorter timer) */
    @type("string") bossPhase = "normal";

    // Next ability announcement
    @type("string") nextAbilityName = "";
    @type("number") nextAbilityAt = 0;    // Unix ms when ability fires
    /** Serialised as JSON string — list of active ability names */
    @type("string") activeAbilitiesJson = "[]";

    @type("boolean") playersWon = false;

    @type({ map: RaidPlayer }) players = new MapSchema<RaidPlayer>();
}
