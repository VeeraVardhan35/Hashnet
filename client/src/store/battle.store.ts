import { create } from "zustand";
import type {
  BattleProblem,
  BattlePlayerEntry,
  BattleLiveEvent,
  RunCodeTestResult,
} from "../types";
import { splitTemplate, assembleCode } from "../utils/templateSplit";

interface BattleState {
  /** Live Colyseus BattleRoom instance */
  battleRoom: any | null;
  /** Current DSA problem */
  problem: BattleProblem | null;
  /** Current round number (1-indexed) */
  roundNumber: number;
  totalRounds: number;
  /** Game phase from server schema */
  phase: "countdown" | "coding" | "results" | "finished";
  /** Unix ms — when the coding timer expires */
  roundEndsAt: number;
  /** Seconds per round */
  roundDuration: number;
  /** Unix ms — when the next phase starts (countdown) */
  phaseStartsAt: number;
  /** Sorted leaderboard from server schema */
  leaderboard: BattlePlayerEntry[];
  /** Live event feed (max 10) */
  liveEvents: BattleLiveEvent[];
  /** Results from the last Run Code call */
  runResults: RunCodeTestResult[];
  /** Is the Run Code request in flight? */
  isRunning: boolean;
  /** Is the Submit request in flight? */
  isSubmitting: boolean;
  /** Verdict of the last submit: "" | "accepted" | "wrong_answer" | "runtime_error" | "time_limit_exceeded" */
  lastVerdict: string;
  /** Details of the last submit (diff or error) */
  lastVerdictDetails: string;
  /** Points earned on last accept */
  lastEarned: number;
  /** Is the WebSocket connected? */
  connected: boolean;
  /** Final leaderboard after game over */
  finalLeaderboard: { id: string; username: string; score: number; solved: number; isAlive: boolean }[];
  /** Selected editor language */
  language: "python" | "javascript" | "cpp";
  /** Full template string from the server (prefix + markers + default body + suffix) */
  fullTemplate: string;
  /** Only the editable function body — what the user is typing */
  body: string;
  /** Which tab is active: "problem" | "submissions" */
  activeTab: "problem" | "submissions";
  /** Submission history for this session */
  submissionHistory: { verdict: string; timestamp: number; language: string }[];

  setBattleRoom: (room: any) => void;
  setProblem: (p: BattleProblem) => void;
  setRoundNumber: (n: number) => void;
  setTotalRounds: (n: number) => void;
  setPhase: (p: BattleState["phase"]) => void;
  setRoundEndsAt: (ts: number) => void;
  setRoundDuration: (secs: number) => void;
  setPhaseStartsAt: (ts: number) => void;
  setLeaderboard: (entries: BattlePlayerEntry[]) => void;
  addLiveEvent: (e: Omit<BattleLiveEvent, "id" | "timestamp">) => void;
  setRunResults: (results: RunCodeTestResult[]) => void;
  setIsRunning: (v: boolean) => void;
  setIsSubmitting: (v: boolean) => void;
  setLastVerdict: (v: string, details: string, earned?: number) => void;
  setConnected: (c: boolean) => void;
  setFinalLeaderboard: (lb: BattleState["finalLeaderboard"]) => void;
  setLanguage: (lang: BattleState["language"]) => void;
  setBody: (body: string) => void;
  setActiveTab: (tab: BattleState["activeTab"]) => void;
  addSubmissionToHistory: (verdict: string, language: string) => void;
  /** Returns the full assembled code to send to the server */
  getFullCode: () => string;
  reset: () => void;
}

let eventCounter = 0;

const initialState = {
  battleRoom: null,
  problem: null,
  roundNumber: 1,
  totalRounds: 3,
  phase: "countdown" as const,
  roundEndsAt: 0,
  roundDuration: 600,
  phaseStartsAt: 0,
  leaderboard: [],
  liveEvents: [],
  runResults: [],
  isRunning: false,
  isSubmitting: false,
  lastVerdict: "",
  lastVerdictDetails: "",
  lastEarned: 0,
  connected: false,
  finalLeaderboard: [],
  language: "python" as const,
  fullTemplate: "",
  body: "",
  activeTab: "problem" as const,
  submissionHistory: [],
};

export const useBattleStore = create<BattleState>((set, get) => ({
  ...initialState,

  setBattleRoom: (battleRoom) => set({ battleRoom }),
  setProblem: (problem) => {
    const template = problem.templates.python ?? "";
    const { body } = splitTemplate(template, "python");
    set({ problem, language: "python", fullTemplate: template, body });
  },
  setRoundNumber: (roundNumber) => set({ roundNumber }),
  setTotalRounds: (totalRounds) => set({ totalRounds }),
  setPhase: (phase) => set({ phase }),
  setRoundEndsAt: (roundEndsAt) => set({ roundEndsAt }),
  setRoundDuration: (roundDuration) => set({ roundDuration }),
  setPhaseStartsAt: (phaseStartsAt) => set({ phaseStartsAt }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),

  addLiveEvent: (entry) =>
    set((s) => ({
      liveEvents: [
        { ...entry, id: String(++eventCounter), timestamp: Date.now() },
        ...s.liveEvents,
      ].slice(0, 10),
    })),

  setRunResults: (runResults) => set({ runResults }),
  setIsRunning: (isRunning) => set({ isRunning }),
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  setLastVerdict: (lastVerdict, lastVerdictDetails, lastEarned = 0) =>
    set({ lastVerdict, lastVerdictDetails, lastEarned }),
  setConnected: (connected) => set({ connected }),
  setFinalLeaderboard: (finalLeaderboard) => set({ finalLeaderboard }),
  setLanguage: (language) => set((s) => {
    const template = s.problem?.templates[language] ?? "";
    const { body } = splitTemplate(template, language);
    return { language, fullTemplate: template, body };
  }),
  setBody: (body) => set({ body }),
  setActiveTab: (activeTab) => set({ activeTab }),

  addSubmissionToHistory: (verdict, language) =>
    set((s) => ({
      submissionHistory: [
        { verdict, language, timestamp: Date.now() },
        ...s.submissionHistory,
      ].slice(0, 20),
    })),

  getFullCode: () => {
    const s = get();
    const split = splitTemplate(s.fullTemplate, s.language);
    return assembleCode(split.prefix, s.body, split.suffix, s.language);
  },

  reset: () => set(initialState),
}));
