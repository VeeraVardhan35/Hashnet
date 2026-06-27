import { Schema, type, MapSchema } from "@colyseus/schema";

export class QuizTeamsPlayer extends Schema {
    @type("string") id = "";
    @type("string") username = "";
    @type("string") team: "alpha" | "beta" | "" = "";
    @type("number") score = 0;
    @type("boolean") answered = false;
    @type("boolean") lastAnswerCorrect = false;
    @type("number") streak = 0;
    @type("boolean") isHost = false;
}

export class QuizTeamsState extends Schema {
    @type("string") roomCode = "";
    /** "countdown" | "playing" | "reveal" | "finished" */
    @type("string") phase = "countdown";
    
    @type("number") questionIndex = 0;
    @type("number") totalQuestions = 0;
    
    @type("number") roundEndsAt = 0;
    @type("number") roundDuration = 30; // seconds
    @type("number") phaseStartsAt = 0;
    
    @type("number") teamAlphaScore = 0;
    @type("number") teamBetaScore = 0;
    
    @type({ map: QuizTeamsPlayer }) players = new MapSchema<QuizTeamsPlayer>();
}
