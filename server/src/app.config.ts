import express from "express";
import cors from "cors";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { monitor } from "@colyseus/monitor";
import { createServer } from "http";
import authRoutes from "./routes/auth.routes.js";
import roomRoutes from "./routes/room.routes.js";
import quizRoutes from "./routes/quiz.routes.js";
import problemRoutes from "./routes/problem.routes.js";
import competitiveRoutes from "./routes/competitive.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import ragRoutes from "./routes/rag.routes.js";
import { MyRoom } from "./rooms/MyRoom.js";
import { QuizRoom } from "./rooms/QuizRoom.js";
import { BattleRoom } from "./rooms/BattleRoom.js";
import { TeamsRoom } from "./rooms/TeamsRoom.js";
import { BossRaidRoom } from "./rooms/BossRaidRoom.js";
import { QuizTeamsRoom } from "./rooms/QuizTeamsRoom.js";
import { QuizBossRaidRoom } from "./rooms/QuizBossRaidRoom.js";

/**
 * Creates and configures the Colyseus + Express app for colyseus@0.16.
 * Returns the httpServer (Colyseus WS transport is already attached).
 */
export function createApp() {
    const app = express();

    app.use(express.json({ limit: "10mb" }));

    app.use(
        cors({
            origin: [
                "http://localhost:5173",
                "http://localhost:5174",
                "https://magnetic-crank-bucket.ngrok-free.dev",
                "http://10.17.16.106:5173",
                ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : [])
            ],
        })
    );

    app.use("/api/auth", authRoutes);
    app.use("/api/rooms", roomRoutes);
    app.use("/api/quiz", quizRoutes);
    app.use("/api/problems", problemRoutes);
    app.use("/api/competitive", competitiveRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/rag", ragRoutes);

    app.get("/hi", (_req, res) => {
        res.send("It's time to kick ass and chew bubblegum!");
    });

    // Colyseus monitor dashboard
    app.use("/monitor", monitor());

    const httpServer = createServer(app);

    // colyseus@0.16 requires an explicit transport layer
    const gameServer = new Server({
        transport: new WebSocketTransport({
            server: httpServer,
        }),
    });

    // Register game rooms
    gameServer.define("lobby", MyRoom);
    gameServer.define("quiz", QuizRoom);
    gameServer.define("battle", BattleRoom);
    gameServer.define("teams", TeamsRoom);
    gameServer.define("boss_raid", BossRaidRoom);
    gameServer.define("quiz_teams", QuizTeamsRoom);
    gameServer.define("quiz_boss_raid", QuizBossRaidRoom);

    return { httpServer, gameServer };
}