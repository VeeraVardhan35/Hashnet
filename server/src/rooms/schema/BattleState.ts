import { Schema, type, MapSchema } from "@colyseus/schema";

export class BattlePlayer extends Schema {
    @type("string")
    id = "";

    @type("string")
    username = "";

    @type("number")
    score = 0;

    @type("boolean")
    isAlive = true;

    @type("number")
    solved = 0; // problems solved this game

    /** "" | "pending" | "accepted" | "wrong_answer" | "runtime_error" | "time_limit_exceeded" */
    @type("string")
    submissionStatus = "";

    @type("boolean")
    isHost = false;

    @type("number")
    submissions = 0; // total submission attempts this round

    /** Round number in which this player was eliminated (-1 = still alive) */
    @type("number")
    eliminatedRound = -1;
}

export class BattleState extends Schema {
    @type("string")
    roomCode = "";

    /**
     * "countdown" — waiting 5 s for all lobby players to join
     * "coding"    — active round, timer running
     * "results"   — brief reveal between rounds
     * "finished"  — all rounds done
     */
    @type("string")
    phase = "countdown";

    @type("number")
    roundNumber = 1;

    @type("number")
    totalRounds = 3;

    /** Unix ms — when the coding timer for this round expires */
    @type("number")
    roundEndsAt = 0;

    /** Seconds per round */
    @type("number")
    roundDuration = 600;

    /** Unix ms — when the next phase (coding) begins (used for countdown display) */
    @type("number")
    phaseStartsAt = 0;

    @type({ map: BattlePlayer })
    players = new MapSchema<BattlePlayer>();
}
