import { create } from "zustand";
import type { Player } from "../types";

interface RoomState {
  /** The live Colyseus Room instance */
  room: any | null;
  /** Human-readable 6-char room code */
  roomCode: string;
  /** Current list of players in the lobby */
  players: Player[];
  /** Whether we have an active Colyseus connection */
  connected: boolean;
  /** Whether the game has started */
  gameStarted: boolean;
  /** The Colyseus room ID for the QuizRoom */
  quizRoomId: string;
  /** The Colyseus room ID for the BattleRoom */
  battleRoomId: string;
  /** The Colyseus room ID for the TeamsRoom */
  teamsRoomId: string;
  /** The Colyseus room ID for the BossRaidRoom */
  bossRaidRoomId: string;
  /** Game mode of the current lobby */
  gameMode: string;

  setRoom: (room: any) => void;
  setPlayers: (players: Player[]) => void;
  setRoomCode: (code: string) => void;
  setConnected: (connected: boolean) => void;
  setGameStarted: (started: boolean) => void;
  setQuizRoomId: (id: string) => void;
  setBattleRoomId: (id: string) => void;
  setTeamsRoomId: (id: string) => void;
  setBossRaidRoomId: (id: string) => void;
  setGameMode: (mode: string) => void;
  /** Reset all room state (called on leave) */
  reset: () => void;
}

const initialState = {
  room: null,
  roomCode: "",
  players: [],
  connected: false,
  gameStarted: false,
  quizRoomId: "",
  battleRoomId: "",
  teamsRoomId: "",
  bossRaidRoomId: "",
  gameMode: "quiz",
};

export const useRoomStore = create<RoomState>((set) => ({
  ...initialState,

  setRoom: (room) => set({ room }),

  setPlayers: (players) => set({ players }),

  setRoomCode: (roomCode) => set({ roomCode }),

  setConnected: (connected) => set({ connected }),

  setGameStarted: (gameStarted) => set({ gameStarted }),

  setQuizRoomId: (quizRoomId) => set({ quizRoomId }),

  setBattleRoomId: (battleRoomId) => set({ battleRoomId }),

  setTeamsRoomId: (teamsRoomId) => set({ teamsRoomId }),

  setBossRaidRoomId: (bossRaidRoomId) => set({ bossRaidRoomId }),

  setGameMode: (gameMode) => set({ gameMode }),

  reset: () => set(initialState),
}));