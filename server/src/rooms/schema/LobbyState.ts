import {
    Schema,
    type,
    MapSchema,
} from "@colyseus/schema";

export class Player extends Schema {
    @type("string")
    id = "";

    @type("string")
    username = "";

    @type("boolean")
    ready = false;

    @type("boolean")
    isHost = false;

    /** "alpha" | "beta" | "" — set by player in lobby for team modes */
    @type("string")
    preferredTeam = "";
}

export class LobbyState extends Schema {
    @type("string")
    roomCode = "";

    @type("boolean")
    gameStarted = false;

    /** "quiz" | "battle" — chosen by the host when creating the lobby */
    @type("string")
    gameMode = "quiz";

    @type({
        map: Player,
    })
    players = new MapSchema<Player>();
}