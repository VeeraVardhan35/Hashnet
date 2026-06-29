import { Room, matchMaker } from "@colyseus/core";
import type { Client } from "@colyseus/core";
import { LobbyState, Player } from "./schema/LobbyState.js";
import { generateRoomCode } from "../utils/roomCode.js";

export class MyRoom extends Room<LobbyState> {
    maxClients = 8;

    async onCreate(options: any) {
        try {
            console.log("[MyRoom] Creating room...");

            this.setState(new LobbyState());
            this.state.roomCode = generateRoomCode();
            const validModes = ["quiz", "battle", "teams", "boss_raid", "quiz_teams", "quiz_boss_raid"];
            this.state.gameMode = validModes.includes(options?.gameMode ?? "")
                ? (options!.gameMode as string)
                : "quiz";

            this.state.category = options?.category ?? "All Categories";
            this.state.difficulty = options?.difficulty ?? "Mixed";
            this.state.questionsCount = options?.questionsCount ?? 10;
            this.state.timePerQuestion = options?.timePerQuestion ?? 30;

            // Expose roomCode in metadata so guests can discover rooms by code
            await this.setMetadata({ roomCode: this.state.roomCode });

            console.log("[MyRoom] Room code:", this.state.roomCode, "| mode:", this.state.gameMode);

            // ── Toggle Ready ───────────────────────────────────────────────
            this.onMessage("toggleReady", (client: Client) => {
                const player = this.state.players.get(client.sessionId);
                if (!player) return;

                player.ready = !player.ready;

                console.log(
                    `[MyRoom] ${player.username} ready: ${player.ready}`
                );
            });

            // ── Pick Team (quiz_teams mode) ────────────────────────────────
            this.onMessage("pickTeam", (client: Client, data: { team: "alpha" | "beta" }) => {
                const player = this.state.players.get(client.sessionId);
                if (!player) return;
                if (data.team === "alpha" || data.team === "beta") {
                    player.preferredTeam = data.team;
                }
            });

            // ── Set Boss Level (boss_raid modes) ───────────────────────────
            this.onMessage("setBossLevel", (client: Client, data: { level: number }) => {
                const player = this.state.players.get(client.sessionId);
                if (!player?.isHost) return;
                const level = Math.max(1, Math.min(10, data.level));
                this.state.bossLevel = level;
            });

            // ── Start Game ─────────────────────────────────────────────────
            this.onMessage("startGame", async (client: Client) => {
                const player = this.state.players.get(client.sessionId);

                if (!player?.isHost) {
                    client.send("error", { message: "Only the host can start the game" });
                    return;
                }

                if (this.state.players.size < 2) {
                    client.send("error", { message: "Need at least 2 players to start" });
                    return;
                }

                const allReady = Array.from(this.state.players.values()).every(
                    (p) => p.ready
                );

                if (!allReady) {
                    client.send("error", { message: "All players must be ready to start" });
                    return;
                }

                // Create the appropriate game room via matchMaker
                const gameMode = this.state.gameMode;
                const roomName = gameMode === "battle" ? "battle"
                    : gameMode === "teams" ? "teams"
                    : gameMode === "boss_raid" ? "boss_raid"
                    : gameMode === "quiz_teams" ? "quiz_teams"
                    : gameMode === "quiz_boss_raid" ? "quiz_boss_raid"
                    : "quiz";

                const seat = await matchMaker.createRoom(roomName, {
                    lobbyRoomCode: this.state.roomCode,
                    bossLevel: this.state.bossLevel,
                    category: this.state.category,
                    difficulty: this.state.difficulty,
                    questionsCount: this.state.questionsCount,
                    timePerQuestion: this.state.timePerQuestion,
                });

                this.state.gameStarted = true;

                if (gameMode === "battle") {
                    console.log("[MyRoom] Battle started! BattleRoom:", seat.roomId);
                    this.broadcast("gameStarted", { battleRoomId: seat.roomId });
                } else if (gameMode === "teams") {
                    console.log("[MyRoom] Teams started! TeamsRoom:", seat.roomId);
                    this.broadcast("gameStarted", { teamsRoomId: seat.roomId });
                } else if (gameMode === "boss_raid") {
                    console.log("[MyRoom] Boss Raid started! BossRaidRoom:", seat.roomId);
                    this.broadcast("gameStarted", { bossRaidRoomId: seat.roomId });
                } else if (gameMode === "quiz_teams") {
                    console.log("[MyRoom] Quiz Teams started! QuizTeamsRoom:", seat.roomId);
                    this.broadcast("gameStarted", { quizTeamsRoomId: seat.roomId });
                } else if (gameMode === "quiz_boss_raid") {
                    console.log("[MyRoom] Quiz Boss Raid started! QuizBossRaidRoom:", seat.roomId);
                    this.broadcast("gameStarted", { quizBossRaidRoomId: seat.roomId });
                } else {
                    console.log("[MyRoom] Quiz started! QuizRoom:", seat.roomId);
                    this.broadcast("gameStarted", { quizRoomId: seat.roomId });
                }
            });

            // ── Leave Room ─────────────────────────────────────────────────
            this.onMessage("leaveRoom", (client: Client) => {
                console.log("[MyRoom] Player requested leave:", client.sessionId);
                client.leave();
            });

        } catch (error) {
            console.error("[MyRoom] Error during onCreate:", error);
        }
    }

    onJoin(client: Client, options: { username?: string }) {
        const player = new Player();

        player.id = client.sessionId;
        player.username = options.username?.trim() || "Guest";
        player.ready = false;
        player.isHost = this.state.players.size === 0;

        this.state.players.set(client.sessionId, player);

        console.log(
            `[MyRoom] ${player.username} joined (host: ${player.isHost}). Total: ${this.state.players.size}`
        );
    }

    async onLeave(client: Client, consented: boolean) {
        const player = this.state.players.get(client.sessionId);

        if (!player) return;

        console.log(`[MyRoom] ${player.username} disconnected. Waiting for reconnection...`);

        try {
            if (consented) throw new Error("consented");
            // Allow 20 seconds for the client to reconnect
            await this.allowReconnection(client, 20);
            console.log(`[MyRoom] ${player.username} reconnected!`);
        } catch (e) {
            // Reconnection expired
            const wasHost = player.isHost;

            this.state.players.delete(client.sessionId);

            console.log(
                `[MyRoom] ${player.username} left for good. Remaining: ${this.state.players.size}`
            );

            if (wasHost && this.state.players.size > 0) {
                const nextHost = Array.from(this.state.players.values())[0];
                nextHost.isHost = true;
                console.log(`[MyRoom] Host migrated to ${nextHost.username}`);
            }
        }
    }

    onDispose() {
        console.log("[MyRoom] Room disposed:", this.state.roomCode);
    }
}