import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useRoomStore } from "../store/room.store";
import { useAuthStore } from "../store/auth.store";
import { gameClient } from "../colyseus/client";
import type { Player } from "../types";

/**
 * useRoom — centralises all Colyseus room lifecycle management.
 *
 * Handles:
 * - Creating a new room (host)
 * - Joining an existing room by room code (guest)
 * - Syncing server state → Zustand store on every state change
 * - Listening for the "gameStarted" broadcast
 * - Sending messages (toggleReady, startGame, leaveRoom)
 * - Cleanup on component unmount
 */
export function useRoom() {
  const navigate = useNavigate();

  const {
    room, roomCode, players, connected, gameStarted,
    setRoom, setPlayers, setRoomCode, setConnected, setGameStarted,
    setQuizRoomId, setBattleRoomId, setTeamsRoomId, setBossRaidRoomId,
    setQuizTeamsRoomId, setQuizBossRaidRoomId,
    setGameMode, reset,
  } = useRoomStore();

  const { user } = useAuthStore();

  // Ref so stale closures always have the latest room
  const roomRef = useRef<any>(room);
  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  // ── Sync server state to Zustand ───────────────────────────────
  const attachListeners = useCallback(
    (newRoom: any) => {
      newRoom.onStateChange((state: any) => {
        setRoomCode(state.roomCode);
        setGameStarted(state.gameStarted);
        if (state.gameMode) setGameMode(state.gameMode);

        const arr: Player[] = Array.from(
          state.players.values() as Iterable<any>
        ).map((p: any) => ({
          id: p.id,
          username: p.username,
          ready: p.ready,
          isHost: p.isHost,
          preferredTeam: p.preferredTeam ?? "",
        }));

        setPlayers(arr);
      });

      newRoom.onMessage(
        "gameStarted",
        (data: {
          quizRoomId?: string;
          battleRoomId?: string;
          teamsRoomId?: string;
          bossRaidRoomId?: string;
          quizTeamsRoomId?: string;
          quizBossRaidRoomId?: string;
        }) => {
          setGameStarted(true);

          if (data.battleRoomId) {
            setBattleRoomId(data.battleRoomId);
            setTimeout(() => navigate("/battle"), 300);
          } else if (data.teamsRoomId) {
            setTeamsRoomId(data.teamsRoomId);
            setTimeout(() => navigate("/teams"), 300);
          } else if (data.bossRaidRoomId) {
            setBossRaidRoomId(data.bossRaidRoomId);
            setTimeout(() => navigate("/boss-raid"), 300);
          } else if (data.quizTeamsRoomId) {
            setQuizTeamsRoomId(data.quizTeamsRoomId);
            setTimeout(() => navigate("/quiz-teams"), 300);
          } else if (data.quizBossRaidRoomId) {
            setQuizBossRaidRoomId(data.quizBossRaidRoomId);
            setTimeout(() => navigate("/quiz-boss-raid"), 300);
          } else if (data.quizRoomId) {
            setQuizRoomId(data.quizRoomId);
            setTimeout(() => navigate("/quiz"), 300);
          }
        }
      );

      newRoom.onMessage("error", (data: { message: string }) => {
        console.error("[useRoom] Server error:", data.message);
      });

      newRoom.onLeave(() => {
        setConnected(false);
        console.log("[useRoom] Disconnected from room");
      });

      setConnected(true);
    },
    [setConnected, setGameStarted, setPlayers, setRoomCode,
     setQuizRoomId, setBattleRoomId, setTeamsRoomId, setBossRaidRoomId, setGameMode, navigate]
  );

  // ── Create Room (host) ─────────────────────────────────────────
  const createRoom = useCallback(async () => {
    if (!user) throw new Error("Not authenticated");

    const newRoom = await gameClient.create("lobby", {
      username: user.username,
      gameMode: "quiz",
    });

    setRoom(newRoom);
    attachListeners(newRoom);
    navigate("/lobby");
  }, [attachListeners, navigate, setRoom, user]);

  // ── Create Battle Room (host) ──────────────────────────────────
  const createBattleRoom = useCallback(async () => {
    if (!user) throw new Error("Not authenticated");

    const newRoom = await gameClient.create("lobby", {
      username: user.username,
      gameMode: "battle",
    });

    setRoom(newRoom);
    attachListeners(newRoom);
    navigate("/lobby");
  }, [attachListeners, navigate, setRoom, user]);

  // ── Create Teams Room (host) ──────────────────────────────────────
  const createTeamsRoom = useCallback(async () => {
    if (!user) throw new Error("Not authenticated");
    const newRoom = await gameClient.create("lobby", { username: user.username, gameMode: "teams" });
    setRoom(newRoom); attachListeners(newRoom); navigate("/lobby");
  }, [attachListeners, navigate, setRoom, user]);

  // ── Create Boss Raid Room (host) ─────────────────────────────────
  const createBossRaidRoom = useCallback(async () => {
    if (!user) throw new Error("Not authenticated");
    const newRoom = await gameClient.create("lobby", { username: user.username, gameMode: "boss_raid" });
    setRoom(newRoom); attachListeners(newRoom); navigate("/lobby");
  }, [attachListeners, navigate, setRoom, user]);

  // ── Create Quiz Teams Room (host) ──────────────────────────────────
  const createQuizTeamsRoom = useCallback(async () => {
    if (!user) throw new Error("Not authenticated");
    const newRoom = await gameClient.create("lobby", { username: user.username, gameMode: "quiz_teams" });
    setRoom(newRoom); attachListeners(newRoom); navigate("/lobby");
  }, [attachListeners, navigate, setRoom, user]);

  // ── Create Quiz Boss Raid Room (host) ──────────────────────────────
  const createQuizBossRaidRoom = useCallback(async () => {
    if (!user) throw new Error("Not authenticated");
    const newRoom = await gameClient.create("lobby", { username: user.username, gameMode: "quiz_boss_raid" });
    setRoom(newRoom); attachListeners(newRoom); navigate("/lobby");
  }, [attachListeners, navigate, setRoom, user]);

  const joinRoom = useCallback(
    async (code: string) => {
      if (!user) throw new Error("Not authenticated");

      // Ask our server to resolve the human-readable code → Colyseus roomId
      const res = await fetch(
        `http://localhost:2567/api/rooms/find/${code.toUpperCase()}`
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as any)?.error || "Room not found. Please check the code and try again."
        );
      }

      const { roomId } = await res.json() as { roomId: string };

      const newRoom = await gameClient.joinById(roomId, {
        username: user.username,
      });

      setRoom(newRoom);
      attachListeners(newRoom);
      navigate("/lobby");
    },
    [attachListeners, navigate, setRoom, user]
  );

  // ── Messages ───────────────────────────────────────────────────
  const toggleReady = useCallback(() => {
    roomRef.current?.send("toggleReady");
  }, []);

  const pickTeam = useCallback((team: "alpha" | "beta") => {
    roomRef.current?.send("pickTeam", { team });
  }, []);

  const startGame = useCallback(() => {
    roomRef.current?.send("startGame");
  }, []);

  const leaveRoom = useCallback(() => {
    roomRef.current?.send("leaveRoom");
    roomRef.current?.leave();
    reset();
    navigate("/home");
  }, [navigate, reset]);

  return {
    room, roomCode, players, connected, gameStarted,
    createRoom,
    createBattleRoom,
    createTeamsRoom,
    createBossRaidRoom,
    createQuizTeamsRoom,
    createQuizBossRaidRoom,
    joinRoom, toggleReady, pickTeam, startGame, leaveRoom,
  };
}
