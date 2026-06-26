import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { createApp } from "./app.config.js";

dotenv.config();

const PORT = Number(process.env.PORT) || 2567;

(async () => {
    await connectDB();

    const { httpServer } = createApp();

    // httpServer already has the Colyseus WebSocket transport attached.
    // Bind the port once — do NOT call gameServer.listen() separately.
    httpServer.listen(PORT, () => {
        console.log(`[Hashet] Server running on http://localhost:${PORT}`);
        console.log(`[Hashet] Colyseus monitor: http://localhost:${PORT}/monitor`);
    });
})();