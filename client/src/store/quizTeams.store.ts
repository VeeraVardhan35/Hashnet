import { create } from "zustand";
import type { QuizQuestion, ActivityEntry } from "../types";

export interface QuizTeamsPlayerEntry {
  id: string;
  username: string;
  team: "alpha" | "beta" | "";
  score: number;
  answered: boolean;
  lastAnswerCorrect: boolean;
  streak: number;
  isHost: boolean;
}

interface QuizTeamsState {
  questions: QuizQuestion[];
  questionIndex: number;
  selectedOption: number;
  
  phase: "waiting" | "countdown" | "playing" | "finished";
  roundEndsAt: number;
  roundDuration: number;
  phaseStartsAt: number;
  
  teamAlphaScore: number;
  teamBetaScore: number;
  
  players: Record<string, QuizTeamsPlayerEntry>;
  activityFeed: ActivityEntry[];
  
  connected: boolean;
  finalResult: { winner: "alpha" | "beta" | "tie"; alphaScore: number; betaScore: number } | null;

  setQuestions: (q: QuizQuestion[]) => void;
  setQuestionIndex: (i: number) => void;
  setSelectedOption: (o: number) => void;
  
  setPhase: (p: QuizTeamsState["phase"]) => void;
  setRoundEndsAt: (ts: number) => void;
  setRoundDuration: (secs: number) => void;
  setPhaseStartsAt: (ts: number) => void;
  
  setTeamAlphaScore: (score: number) => void;
  setTeamBetaScore: (score: number) => void;
  
  updatePlayer: (id: string, updates: Partial<QuizTeamsPlayerEntry>) => void;
  removePlayer: (id: string) => void;
  setPlayers: (players: Record<string, QuizTeamsPlayerEntry>) => void;
  
  addActivity: (entry: Omit<ActivityEntry, "id" | "timestamp">) => void;
  
  setConnected: (c: boolean) => void;
  setFinalResult: (result: QuizTeamsState["finalResult"]) => void;
  reset: () => void;
}

let activityCounter = 0;

const initialState = {
  questions: [],
  questionIndex: 0,
  selectedOption: -1,
  phase: "waiting" as const,
  roundEndsAt: 0,
  roundDuration: 30,
  phaseStartsAt: 0,
  teamAlphaScore: 0,
  teamBetaScore: 0,
  players: {},
  activityFeed: [],
  connected: false,
  finalResult: null,
};

export const useQuizTeamsStore = create<QuizTeamsState>((set) => ({
  ...initialState,
  
  setQuestions: (questions) => set({ questions }),
  setQuestionIndex: (questionIndex) => set({ questionIndex, selectedOption: -1 }),
  setSelectedOption: (selectedOption) => set({ selectedOption }),
  
  setPhase: (phase) => set({ phase }),
  setRoundEndsAt: (roundEndsAt) => set({ roundEndsAt }),
  setRoundDuration: (roundDuration) => set({ roundDuration }),
  setPhaseStartsAt: (phaseStartsAt) => set({ phaseStartsAt }),
  
  setTeamAlphaScore: (teamAlphaScore) => set({ teamAlphaScore }),
  setTeamBetaScore: (teamBetaScore) => set({ teamBetaScore }),
  
  updatePlayer: (id, updates) =>
    set((state) => ({
      players: {
        ...state.players,
        [id]: { ...state.players[id], ...updates } as QuizTeamsPlayerEntry,
      },
    })),
  removePlayer: (id) =>
    set((state) => {
      const next = { ...state.players };
      delete next[id];
      return { players: next };
    }),
  setPlayers: (players) => set({ players }),
  
  addActivity: (entry) =>
    set((state) => ({
      activityFeed: [
        { ...entry, id: `act_${activityCounter++}`, timestamp: Date.now() },
        ...state.activityFeed,
      ].slice(0, 8),
    })),
    
  setConnected: (connected) => set({ connected }),
  setFinalResult: (finalResult) => set({ finalResult }),
  reset: () => set(initialState),
}));
