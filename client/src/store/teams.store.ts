import { create } from "zustand";
import type { BattleProblem } from "../types";
import { splitTemplate, assembleCode } from "../utils/templateSplit";

export interface TeamsPlayerEntry {
  id: string; username: string; team: "alpha" | "beta" | ""; score: number;
  solved: number; submissionStatus: string; submissions: number; isHost: boolean;
}

export interface TeamsLiveEvent {
  id: string; username: string; team: "alpha" | "beta" | "";
  type: "accepted" | "wrong" | "system"; message: string; color: string; timestamp: number;
}

interface TeamsStore {
  problem: BattleProblem | null;
  phase: string;
  roundNumber: number;
  totalRounds: number;
  roundEndsAt: number;
  roundDuration: number;
  phaseStartsAt: number;
  teamAlphaScore: number;
  teamBetaScore: number;
  players: TeamsPlayerEntry[];
  liveEvents: TeamsLiveEvent[];
  runResults: any[];
  isRunning: boolean;
  isSubmitting: boolean;
  lastVerdict: string;
  lastVerdictDetails: string;
  lastEarned: number;
  connected: boolean;
  finalResult: { winner: "alpha" | "beta" | "tie"; teamAlphaScore: number; teamBetaScore: number; leaderboard: any[] } | null;
  submissionHistory: { verdict: string; language: string; timestamp: number }[];
  language: "python" | "javascript" | "cpp";
  fullTemplate: string;
  body: string;
  activeTab: "problem" | "submissions";

  setProblem: (p: BattleProblem) => void;
  setPhase: (ph: string) => void;
  setRoundNumber: (n: number) => void;
  setTotalRounds: (n: number) => void;
  setRoundEndsAt: (t: number) => void;
  setRoundDuration: (n: number) => void;
  setPhaseStartsAt: (t: number) => void;
  setTeamAlphaScore: (n: number) => void;
  setTeamBetaScore: (n: number) => void;
  setPlayers: (p: TeamsPlayerEntry[]) => void;
  addLiveEvent: (e: Omit<TeamsLiveEvent, "id" | "timestamp">) => void;
  setRunResults: (r: any[]) => void;
  setIsRunning: (b: boolean) => void;
  setIsSubmitting: (b: boolean) => void;
  setLastVerdict: (v: string, details: string) => void;
  setLastEarned: (n: number) => void;
  setConnected: (b: boolean) => void;
  setFinalResult: (r: any) => void;
  addSubmission: (v: string, lang: string) => void;
  setLanguage: (l: "python" | "javascript" | "cpp") => void;
  setBody: (c: string) => void;
  setActiveTab: (t: "problem" | "submissions") => void;
  getFullCode: () => string;
  reset: () => void;
}

const initial = {
  problem: null, phase: "countdown", roundNumber: 1, totalRounds: 5,
  roundEndsAt: 0, roundDuration: 600, phaseStartsAt: 0,
  teamAlphaScore: 0, teamBetaScore: 0, players: [], liveEvents: [],
  runResults: [], isRunning: false, isSubmitting: false,
  lastVerdict: "", lastVerdictDetails: "", lastEarned: 0,
  connected: false, finalResult: null, submissionHistory: [],
  language: "python" as const, fullTemplate: "", body: "", activeTab: "problem" as const,
};

export const useTeamsStore = create<TeamsStore>((set) => ({
  ...initial,
  setProblem: (problem) => {
    const template = problem.templates?.python ?? "";
    const { body } = splitTemplate(template, "python");
    set({ problem, language: "python", fullTemplate: template, body });
  },
  setPhase: (phase) => set({ phase }),
  setRoundNumber: (roundNumber) => set({ roundNumber }),
  setTotalRounds: (totalRounds) => set({ totalRounds }),
  setRoundEndsAt: (roundEndsAt) => set({ roundEndsAt }),
  setRoundDuration: (roundDuration) => set({ roundDuration }),
  setPhaseStartsAt: (phaseStartsAt) => set({ phaseStartsAt }),
  setTeamAlphaScore: (teamAlphaScore) => set({ teamAlphaScore }),
  setTeamBetaScore: (teamBetaScore) => set({ teamBetaScore }),
  setPlayers: (players) => set({ players }),
  addLiveEvent: (e) => set((s) => ({
    liveEvents: [{ ...e, id: Math.random().toString(36).slice(2), timestamp: Date.now() }, ...s.liveEvents].slice(0, 60),
  })),
  setRunResults: (runResults) => set({ runResults }),
  setIsRunning: (isRunning) => set({ isRunning }),
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  setLastVerdict: (lastVerdict, lastVerdictDetails) => set({ lastVerdict, lastVerdictDetails }),
  setLastEarned: (lastEarned) => set({ lastEarned }),
  setConnected: (connected) => set({ connected }),
  setFinalResult: (finalResult) => set({ finalResult }),
  addSubmission: (verdict, language) => set((s) => ({
    submissionHistory: [{ verdict, language, timestamp: Date.now() }, ...s.submissionHistory],
  })),
  setLanguage: (language) => set((s) => {
    const template = (s.problem as any)?.templates?.[language] ?? "";
    const { body } = splitTemplate(template, language);
    return { language, fullTemplate: template, body };
  }),
  setBody: (body) => set({ body }),
  setActiveTab: (activeTab) => set({ activeTab }),
  getFullCode: () => {
    const s = useTeamsStore.getState();
    const sp = splitTemplate(s.fullTemplate, s.language);
    return assembleCode(sp.prefix, s.body, sp.suffix, s.language);
  },
  reset: () => set(initial),
}));
