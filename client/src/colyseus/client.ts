import { Client } from "colyseus.js";

export const gameClient =
    new Client(
        import.meta.env.VITE_WS_URL || "ws://localhost:2567"
    );