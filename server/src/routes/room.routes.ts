import { Router } from "express";
import { matchMaker } from "@colyseus/core";

const router = Router();

/**
 * GET /api/rooms/find/:code
 * Returns the roomId for a lobby room whose metadata.roomCode matches :code.
 * Used by the client to resolve a human-readable code → Colyseus roomId.
 */
router.get("/find/:code", async (req, res) => {
    const code = req.params.code?.toUpperCase();

    if (!code || code.length !== 6) {
        res.status(400).json({ error: "Invalid room code" });
        return;
    }

    try {
        const rooms = await matchMaker.query({ name: "lobby" });

        const match = rooms.find(
            (r) => r.metadata?.roomCode === code
        );

        if (!match) {
            res.status(404).json({ error: "Room not found" });
            return;
        }

        res.json({ roomId: match.roomId });
    } catch (err) {
        console.error("[room.routes] Error querying rooms:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
