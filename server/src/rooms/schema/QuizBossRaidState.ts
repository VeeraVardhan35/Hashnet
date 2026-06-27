import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

export class QuizRaidPlayer extends Schema {
    @type("string") id = "";
    @type("string") username = "";
    @type("string") role: "dps" | "tank" | "support" = "dps";
    @type("number") hp = 100;
    @type("number") maxHp = 100;
    @type("number") score = 0;
    @type("number") damageDealt = 0;
    @type("boolean") isAlive = true;
    @type("boolean") isHost = false;
    @type("boolean") answered = false;
    @type("boolean") lastAnswerCorrect = false;
    @type("number") streak = 0;
    @type("number") silencedUntil = 0;
    @type("number") stunnedUntil = 0;
    @type("boolean") isDoomMarked = false;
}

export class QuizBossRaidState extends Schema {
    @type("string") roomCode = "";
    @type("string") phase = "countdown";
    @type("number") questionIndex = 0;
    @type("number") totalQuestions = 0;
    @type("number") roundEndsAt = 0;
    @type("number") roundDuration = 30;
    @type("number") phaseStartsAt = 0;

    // Boss
    @type("string") bossName = "Algorithm Overlord";
    @type("number") bossLevel = 5;
    @type("number") bossHp = 0;
    @type("number") bossMaxHp = 0;
    @type("string") bossPhase = "normal";

    // Next ability announcement
    @type("string") nextAbilityName = "";
    @type("number") nextAbilityAt = 0;
    @type(["string"]) activeAbilities = new ArraySchema<string>();

    @type({ map: QuizRaidPlayer }) players = new MapSchema<QuizRaidPlayer>();
}
