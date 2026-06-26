import { Schema, type, MapSchema } from "@colyseus/schema";

export class QuizPlayer extends Schema {
    @type("string")
    id = "";

    @type("string")
    username = "";

    @type("number")
    score = 0;

    @type("boolean")
    answered = false;

    @type("boolean")
    lastAnswerCorrect = false;

    @type("number")
    streak = 0;

    @type("boolean")
    isHost = false;
}

export class QuizState extends Schema {
    @type("string")
    roomCode = "";

    /**
     * "waiting"  — room created, waiting for players to join
     * "countdown" — all players joined, game starting in 3 s
     * "question"  — showing a question with live timer
     * "reveal"    — brief pause after question closes
     * "finished"  — all questions done, final leaderboard
     */
    @type("string")
    phase = "waiting";

    @type("number")
    questionIndex = 0;

    @type("number")
    totalQuestions = 6;

    /** Unix ms — when the current question's timer expires */
    @type("number")
    roundEndsAt = 0;

    /** Seconds allowed per question */
    @type("number")
    roundDuration = 30;

    /** Unix ms — when the next phase begins (used for countdowns) */
    @type("number")
    phaseStartsAt = 0;

    @type({ map: QuizPlayer })
    players = new MapSchema<QuizPlayer>();
}
