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
  quizRoomId: string | null;
  /** The Colyseus room ID for the BattleRoom */
  battleRoomId: string | null;
  /** The Colyseus room ID for the TeamsRoom */
  teamsRoomId: string | null;
  /** The Colyseus room ID for the BossRaidRoom */
  bossRaidRoomId: string | null;
  quizTeamsRoomId: string | null;
  quizBossRaidRoomId: string | null;
  /** Game mode of the current lobby */
  gameMode: string;
  /** Boss level (1-10) for Boss Raid modes */
  bossLevel: number;

  setRoom: (room: any) => void;
  setPlayers: (players: Player[]) => void;
  setRoomCode: (code: string) => void;
  setConnected: (connected: boolean) => void;
  setGameStarted: (started: boolean) => void;
  setQuizRoomId: (id: string | null) => void;
  setBattleRoomId: (id: string | null) => void;
  setTeamsRoomId: (id: string | null) => void;
  setBossRaidRoomId: (id: string | null) => void;
  setQuizTeamsRoomId: (id: string | null) => void;
  setQuizBossRaidRoomId: (id: string | null) => void;
  setGameMode: (mode: string) => void;
  setBossLevel: (level: number) => void;
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
  bossLevel: 5,
};

export const useRoomStore = create<RoomState>((set) => ({
  ...initialState,
  bossRaidRoomId: null,
  quizTeamsRoomId: null,
  quizBossRaidRoomId: null,

  setRoom: (room) => set({ room }),

  setPlayers: (players) => set({ players }),

  setRoomCode: (roomCode) => set({ roomCode }),

  setConnected: (connected) => set({ connected }),

  setGameStarted: (gameStarted) => set({ gameStarted }),

  setQuizRoomId: (quizRoomId) => set({ quizRoomId }),
  setBattleRoomId: (battleRoomId) => set({ battleRoomId }),
  setTeamsRoomId: (teamsRoomId) => set({ teamsRoomId }),
  setBossRaidRoomId: (bossRaidRoomId) => set({ bossRaidRoomId }),
  setQuizTeamsRoomId: (quizTeamsRoomId) => set({ quizTeamsRoomId }),
  setQuizBossRaidRoomId: (quizBossRaidRoomId) => set({ quizBossRaidRoomId }),

  setGameMode: (gameMode) => set({ gameMode }),
  setBossLevel: (bossLevel) => set({ bossLevel }),

  reset: () => set(initialState),
}));