import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { gameClient } from "../colyseus/client";
import { useRoomStore } from "../store/room.store";
import { useAuthStore } from "../store/auth.store";
import toast from "react-hot-toast";

export default function Reconnector({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isHydrated } = useAuthStore();
  const roomStore = useRoomStore();
  const attemptedRef = useRef(false);

  useEffect(() => {
    // Only attempt once per session load, and only when auth is hydrated
    if (attemptedRef.current || !isHydrated || !user) return;
    
    const token = localStorage.getItem("hashnet_reconnect_token");
    if (!token) {
        attemptedRef.current = true;
        return;
    }

    // Clear it so we don't infinitely retry a bad token
    localStorage.removeItem("hashnet_reconnect_token");
    attemptedRef.current = true;

    (async () => {
      try {
        console.log("[Reconnector] Attempting to reconnect using stored token...");
        const room = await gameClient.reconnect(token);
        console.log(`[Reconnector] Reconnected successfully to ${room.name}!`);
        
        // Write it back since we are actively connected now
        localStorage.setItem("hashnet_reconnect_token", room.reconnectionToken);
        
        // Setup room store based on the room type
        roomStore.setConnected(true);
        roomStore.setRoomCode(room.id); // fallback
        
        if (room.name === "lobby") {
            // Note: The lobby logic usually expects `roomStore.room` to be set.
            // But if we're jumping straight into the lobby, we might need a small workaround or let useRoom handle it.
            navigate("/lobby");
        } else if (room.name === "battle") {
            roomStore.setBattleRoomId(room.id);
            navigate("/battle");
        } else if (room.name === "teams") {
            roomStore.setTeamsRoomId(room.id);
            navigate("/teams");
        } else if (room.name === "boss_raid") {
            roomStore.setBossRaidRoomId(room.id);
            navigate("/boss-raid");
        } else if (room.name === "quiz") {
            roomStore.setQuizRoomId(room.id);
            navigate("/quiz");
        } else if (room.name === "quiz_teams") {
            roomStore.setQuizTeamsRoomId(room.id);
            navigate("/quiz-teams");
        } else if (room.name === "quiz_boss_raid") {
            roomStore.setQuizBossRaidRoomId(room.id);
            navigate("/quiz-boss-raid");
        }
        
        toast.success("Session recovered successfully!");
      } catch (err) {
        console.warn("[Reconnector] Failed to reconnect. Session expired.", err);
        const protectedPaths = ["/lobby", "/battle", "/teams", "/boss-raid", "/quiz", "/quiz-teams", "/quiz-boss-raid"];
        if (protectedPaths.includes(location.pathname)) {
            navigate("/home");
            toast.error("Session expired.");
        }
      }
    })();
  }, [user, isHydrated, navigate, location.pathname, roomStore]);

  return <>{children}</>;
}
