import { create } from "zustand";
import type { QuizQuestion, LeaderboardEntry, ActivityEntry } from "../types";

interface QuizState {
  /** Live Colyseus QuizRoom instance */
  quizRoom: any | null;
  /** All questions (received once on join, includes correct answers for instant feedback) */
  questions: QuizQuestion[];
  /** Current question index */
  questionIndex: number;
  /** Which option the local player selected (-1 = none) */
  selectedOption: number;
  /** Game phase from server schema */
  phase: "waiting" | "countdown" | "question" | "reveal" | "finished";
  /** Sorted leaderboard synced from server schema */
  leaderboard: LeaderboardEntry[];
  /** Recent activity events (last 8) */
  activityFeed: ActivityEntry[];
  /** Unix ms timestamp when the current question timer expires */
  roundEndsAt: number;
  /** Unix ms timestamp for the next phase start (countdown) */
  phaseStartsAt: number;
  /** Question duration in seconds */
  roundDuration: number;
  /** Whether we're connected to the quiz room */
  connected: boolean;
  /** Final leaderboard after game over */
  finalLeaderboard: { id: string; username: string; score: number; streak: number }[];

  setQuizRoom: (room: any) => void;
  setQuestions: (questions: QuizQuestion[]) => void;
  setQuestionIndex: (index: number) => void;
  setSelectedOption: (option: number) => void;
  setPhase: (phase: QuizState["phase"]) => void;
  setLeaderboard: (entries: LeaderboardEntry[]) => void;
  addActivity: (entry: Omit<ActivityEntry, "id" | "timestamp">) => void;
  setRoundEndsAt: (ts: number) => void;
  setPhaseStartsAt: (ts: number) => void;
  setRoundDuration: (secs: number) => void;
  setConnected: (c: boolean) => void;
  setFinalLeaderboard: (lb: QuizState["finalLeaderboard"]) => void;
  reset: () => void;
}

let activityCounter = 0;

const initialState = {
  quizRoom: null,
  questions: [],
  questionIndex: 0,
  selectedOption: -1,
  phase: "waiting" as const,
  leaderboard: [],
  activityFeed: [],
  roundEndsAt: 0,
  phaseStartsAt: 0,
  roundDuration: 30,
  connected: false,
  finalLeaderboard: [],
};

export const useQuizStore = create<QuizState>((set) => ({
  ...initialState,

  setQuizRoom: (quizRoom) => set({ quizRoom }),
  setQuestions: (questions) => set({ questions }),
  setQuestionIndex: (questionIndex) =>
    set((prev) => ({
      questionIndex,
      // Only clear the selected answer when the QUESTION changes,
      // not on every server state delta (e.g. player.answered updates)
      selectedOption:
        prev.questionIndex !== questionIndex ? -1 : prev.selectedOption,
    })),
  setSelectedOption: (selectedOption) => set({ selectedOption }),
  setPhase: (phase) => set({ phase }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),
  addActivity: (entry) =>
    set((s) => ({
      activityFeed: [
        {
          ...entry,
          id: String(++activityCounter),
          timestamp: Date.now(),
        },
        ...s.activityFeed,
      ].slice(0, 8),
    })),
  setRoundEndsAt: (roundEndsAt) => set({ roundEndsAt }),
  setPhaseStartsAt: (phaseStartsAt) => set({ phaseStartsAt }),
  setRoundDuration: (roundDuration) => set({ roundDuration }),
  setConnected: (connected) => set({ connected }),
  setFinalLeaderboard: (finalLeaderboard) => set({ finalLeaderboard }),
  reset: () => set(initialState),
}));
