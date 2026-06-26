import { create } from "zustand";
import type { BattleProblem } from "../types";
import { splitTemplate, assembleCode } from "../utils/templateSplit";

export interface RaidPlayerEntry {
  id: string; username: string; role: "dps" | "tank" | "support";
  hp: number; maxHp: number; score: number; solved: number; damageDealt: number;
  isAlive: boolean; isHost: boolean; submissionStatus: string;
  silencedUntil: number; stunnedUntil: number; isDoomMarked: boolean;
}

export interface RaidLiveEvent {
  id: string; username: string;
  type: "damage" | "boss_attack" | "ability" | "eliminated" | "heal" | "system" | "wrong";
  message: string; color: string; timestamp: number;
}

interface BossRaidStore {
  problem: BattleProblem | null;
  phase: string;
  waveNumber: number;
  totalWaves: number;
  roundEndsAt: number;
  roundDuration: number;
  phaseStartsAt: number;
  bossName: string;
  bossLevel: number;
  bossHp: number;
  bossMaxHp: number;
  bossPhase: string;
  nextAbilityName: string;
  nextAbilityAt: number;
  activeAbilities: string[];
  playersWon: boolean;
  players: RaidPlayerEntry[];
  liveEvents: RaidLiveEvent[];
  runResults: any[];
  isRunning: boolean;
  isSubmitting: boolean;
  lastVerdict: string;
  lastVerdictDetails: string;
  lastDamage: number;
  connected: boolean;
  finalResult: any | null;
  submissionHistory: { verdict: string; language: string; timestamp: number }[];
  language: "python" | "javascript" | "cpp";
  fullTemplate: string;
  body: string;
  activeTab: "problem" | "submissions";
  myEntry: RaidPlayerEntry | null;

  setProblem: (p: BattleProblem) => void;
  setPhase: (ph: string) => void;
  setWaveNumber: (n: number) => void;
  setTotalWaves: (n: number) => void;
  setRoundEndsAt: (t: number) => void;
  setRoundDuration: (n: number) => void;
  setPhaseStartsAt: (t: number) => void;
  setBossStats: (stats: Partial<BossRaidStore>) => void;
  setPlayers: (p: RaidPlayerEntry[]) => void;
  setMyEntry: (e: RaidPlayerEntry | null) => void;
  addLiveEvent: (e: Omit<RaidLiveEvent, "id" | "timestamp">) => void;
  setRunResults: (r: any[]) => void;
  setIsRunning: (b: boolean) => void;
  setIsSubmitting: (b: boolean) => void;
  setLastVerdict: (v: string, details: string) => void;
  setLastDamage: (n: number) => void;
  setConnected: (b: boolean) => void;
  setFinalResult: (r: any) => void;
  addSubmission: (v: string, lang: string) => void;
  setLanguage: (l: "python" | "javascript" | "cpp") => void;
  setBody: (c: string) => void;
  setActiveTab: (t: "problem" | "submissions") => void;
  getFullCode: () => string;
  reset: () => void;
}

const initial: Partial<BossRaidStore> = {
  problem: null, phase: "countdown", waveNumber: 1, totalWaves: 3,
  roundEndsAt: 0, roundDuration: 600, phaseStartsAt: 0,
  bossName: "Algorithm Overlord", bossLevel: 5, bossHp: 50000, bossMaxHp: 50000,
  bossPhase: "normal", nextAbilityName: "", nextAbilityAt: 0,
  activeAbilities: [], playersWon: false,
  players: [], liveEvents: [], runResults: [],
  isRunning: false, isSubmitting: false,
  lastVerdict: "", lastVerdictDetails: "", lastDamage: 0,
  connected: false, finalResult: null, submissionHistory: [],
  language: "python", fullTemplate: "", body: "", activeTab: "problem", myEntry: null,
};

export const useBossRaidStore = create<BossRaidStore>((set) => ({
  ...(initial as BossRaidStore),
  setProblem: (problem) => set({ problem }),
  setPhase: (phase) => set({ phase }),
  setWaveNumber: (waveNumber) => set({ waveNumber }),
  setTotalWaves: (totalWaves) => set({ totalWaves }),
  setRoundEndsAt: (roundEndsAt) => set({ roundEndsAt }),
  setRoundDuration: (roundDuration) => set({ roundDuration }),
  setPhaseStartsAt: (phaseStartsAt) => set({ phaseStartsAt }),
  setBossStats: (stats) => set(stats as Partial<BossRaidStore>),
  setPlayers: (players) => set({ players }),
  setMyEntry: (myEntry) => set({ myEntry }),
  addLiveEvent: (e) => set((s) => ({
    liveEvents: [{ ...e, id: Math.random().toString(36).slice(2), timestamp: Date.now() }, ...s.liveEvents].slice(0, 80),
  })),
  setRunResults: (runResults) => set({ runResults }),
  setIsRunning: (isRunning) => set({ isRunning }),
  setIsSubmitting: (isSubmitting) => set({ isSubmitting }),
  setLastVerdict: (lastVerdict, lastVerdictDetails) => set({ lastVerdict, lastVerdictDetails }),
  setLastDamage: (lastDamage) => set({ lastDamage }),
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
    const s = useBossRaidStore.getState();
    const sp = splitTemplate(s.fullTemplate, s.language);
    return assembleCode(sp.prefix, s.body, sp.suffix, s.language);
  },
  reset: () => set(initial as BossRaidStore),
}));
