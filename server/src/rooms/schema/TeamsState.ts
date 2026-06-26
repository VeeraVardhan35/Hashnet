import { Schema, type, MapSchema } from "@colyseus/schema";

export class TeamsPlayer extends Schema {
    @type("string") id = "";
    @type("string") username = "";
    @type("string") team: "alpha" | "beta" | "" = "";
    @type("number") score = 0;
    @type("number") solved = 0;
    @type("string") submissionStatus = "";
    @type("number") submissions = 0;
    @type("boolean") isHost = false;
}

export class TeamsState extends Schema {
    @type("string")  roomCode = "";
    /** "countdown" | "coding" | "results" | "finished" */
    @type("string")  phase = "countdown";
    @type("number")  roundNumber = 1;
    @type("number")  totalRounds = 5;
    @type("number")  roundEndsAt = 0;
    @type("number")  roundDuration = 600; // seconds
    @type("number")  phaseStartsAt = 0;
    @type("number")  teamAlphaScore = 0;
    @type("number")  teamBetaScore = 0;
    @type({ map: TeamsPlayer }) players = new MapSchema<TeamsPlayer>();
}
