import { create } from "zustand";
import type { QuizQuestion, ActivityEntry } from "../types";

export interface QuizRaidPlayerEntry {
  id: string;
  username: string;
  role: "dps" | "tank" | "support";
  hp: number;
  maxHp: number;
  score: number;
  damageDealt: number;
  isAlive: boolean;
  isHost: boolean;
  answered: boolean;
  lastAnswerCorrect: boolean;
  streak: number;
  silencedUntil: number;
  stunnedUntil: number;
  isDoomMarked: boolean;
}

interface QuizBossRaidState {
  questions: QuizQuestion[];
  questionIndex: number;
  selectedOption: number;
  
  phase: "waiting" | "countdown" | "playing" | "finished";
  roundEndsAt: number;
  roundDuration: number;
  phaseStartsAt: number;

  bossName: string;
  bossLevel: number;
  bossHp: number;
  bossMaxHp: number;
  bossPhase: "normal" | "enraged";
  nextAbilityName: string;
  nextAbilityAt: number;
  activeAbilities: string[];
  
  players: Record<string, QuizRaidPlayerEntry>;
  liveEvents: { id: string; timestamp: number; username: string; type: string; message: string }[];
  
  connected: boolean;
  finalResult: { victory: boolean; damageDealt: number; survived: number } | null;

  setQuestions: (q: QuizQuestion[]) => void;
  setQuestionIndex: (i: number) => void;
  setSelectedOption: (o: number) => void;
  
  setPhase: (p: QuizBossRaidState["phase"]) => void;
  setRoundEndsAt: (ts: number) => void;
  setRoundDuration: (secs: number) => void;
  setPhaseStartsAt: (ts: number) => void;
  
  setBossState: (bossData: Partial<Pick<QuizBossRaidState, "bossName" | "bossLevel" | "bossHp" | "bossMaxHp" | "bossPhase" | "nextAbilityName" | "nextAbilityAt" | "activeAbilities">>) => void;
  
  updatePlayer: (id: string, updates: Partial<QuizRaidPlayerEntry>) => void;
  removePlayer: (id: string) => void;
  setPlayers: (players: Record<string, QuizRaidPlayerEntry>) => void;
  
  addLiveEvent: (e: Omit<QuizBossRaidState["liveEvents"][0], "id" | "timestamp">) => void;
  
  setConnected: (c: boolean) => void;
  setFinalResult: (result: QuizBossRaidState["finalResult"]) => void;
  reset: () => void;
}

let eventCounter = 0;

const initialState = {
  questions: [],
  questionIndex: 0,
  selectedOption: -1,
  phase: "waiting" as const,
  roundEndsAt: 0,
  roundDuration: 30,
  phaseStartsAt: 0,
  
  bossName: "",
  bossLevel: 1,
  bossHp: 0,
  bossMaxHp: 0,
  bossPhase: "normal" as const,
  nextAbilityName: "",
  nextAbilityAt: 0,
  activeAbilities: [],

  players: {},
  liveEvents: [],
  connected: false,
  finalResult: null,
};

export const useQuizBossRaidStore = create<QuizBossRaidState>((set) => ({
  ...initialState,
  
  setQuestions: (questions) => set({ questions }),
  setQuestionIndex: (questionIndex) => set({ questionIndex, selectedOption: -1 }),
  setSelectedOption: (selectedOption) => set({ selectedOption }),
  
  setPhase: (phase) => set({ phase }),
  setRoundEndsAt: (roundEndsAt) => set({ roundEndsAt }),
  setRoundDuration: (roundDuration) => set({ roundDuration }),
  setPhaseStartsAt: (phaseStartsAt) => set({ phaseStartsAt }),
  
  setBossState: (bossData) => set(bossData),
  
  updatePlayer: (id, updates) =>
    set((state) => ({
      players: {
        ...state.players,
        [id]: { ...state.players[id], ...updates } as QuizRaidPlayerEntry,
      },
    })),
  removePlayer: (id) =>
    set((state) => {
      const next = { ...state.players };
      delete next[id];
      return { players: next };
    }),
  setPlayers: (players) => set({ players }),
  
  addLiveEvent: (event) =>
    set((state) => ({
      liveEvents: [
        { ...event, id: `evt_${eventCounter++}`, timestamp: Date.now() },
        ...state.liveEvents,
      ].slice(0, 15),
    })),
    
  setConnected: (connected) => set({ connected }),
  setFinalResult: (finalResult) => set({ finalResult }),
  reset: () => set(initialState),
}));
