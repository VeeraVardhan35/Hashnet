import { Client } from "colyseus.js";

export const gameClient =
    new Client(
        "ws://localhost:2567"
    );