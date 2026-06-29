import { create } from "zustand";
import { api } from "../api/auth";

interface CompetitiveSettings {
  minRating: number;
  maxRating: number;
  tags: string[];
  numberOfProblems: number;
  timerPerProblem: number;
  infiniteMode: boolean;
  excludeSolved: boolean;
}

interface CompetitiveRun {
  _id: string;
  isActive: boolean;
  settings: CompetitiveSettings;
  problems: { id: string, name: string, rating: number, tags: string[] }[];
  currentProblemIndex: number;
  runStats: {
    solved: number;
    wrong: number;
    skipped: number;
    xpEarned: number;
    coinsEarned: number;
  };
}

interface CompetitiveProfile {
  codeforcesHandle: string;
  xp: number;
  coins: number;
  problemsSolved: number;
  wrongAttempts: number;
  skipped: number;
  currentStreak: number;
  longestStreak: number;
}

interface CompetitiveState {
  profile: CompetitiveProfile | null;
  activeRun: CompetitiveRun | null;
  loading: boolean;
  error: string | null;

  fetchProfile: () => Promise<void>;
  updateProfile: (handle: string, password?: string) => Promise<void>;
  startRun: (settings: CompetitiveSettings) => Promise<void>;
  fetchActiveRun: () => Promise<void>;
  submitSolution: (problemCode: string) => Promise<any>;
  nextProblem: () => Promise<void>;
  skipProblem: () => Promise<void>;
  quitRun: () => Promise<void>;
  getProblemHtml: (problemCode: string) => Promise<string>;
  executeCode: (sourceCode: string, languageId: string, stdin: string) => Promise<any>;
}

export const useCompetitive = create<CompetitiveState>((set, get) => ({
  profile: null,
  activeRun: null,
  loading: false,
  error: null,

  fetchProfile: async () => {
    set({ loading: true });
    try {
      const res = await api.get("/competitive/profile");
      set({ profile: res.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || "Failed to load profile", loading: false });
    }
  },

  updateProfile: async (codeforcesHandle, codeforcesPassword) => {
    set({ loading: true });
    try {
      const res = await api.post("/competitive/profile", { codeforcesHandle, codeforcesPassword });
      set({ profile: res.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || "Failed to update profile", loading: false });
    }
  },

  startRun: async (settings) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post("/competitive/run", { settings });
      set({ activeRun: res.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || "Failed to start run", loading: false });
    }
  },

  fetchActiveRun: async () => {
    set({ loading: true });
    try {
      const res = await api.get("/competitive/run/active");
      set({ activeRun: res.data || null, loading: false });
    } catch (err: any) {
      set({ activeRun: null, loading: false });
    }
  },

  submitSolution: async (problemCode) => {
    try {
      const res = await api.post("/competitive/run/submit", { problemCode });
      
      const { activeRun } = get();
      if (activeRun && res.data.success) {
        // If success (even if Wrong Answer, it was found and verified), update stats
        if (res.data.verdict === "Accepted") {
          set({ activeRun: { 
            ...activeRun, 
            runStats: { ...activeRun.runStats, solved: activeRun.runStats.solved + 1, xpEarned: activeRun.runStats.xpEarned + 100 }
          }});
        } else {
          set({ activeRun: { 
            ...activeRun, 
            runStats: { ...activeRun.runStats, wrong: activeRun.runStats.wrong + 1 }
          }});
        }
      }
      return res.data; // Return the full data to the component
    } catch (err: any) {
      console.error(err);
      throw err.response?.data?.message || "Verification failed";
    }
  },

  nextProblem: async () => {
    try {
      const res = await api.post("/competitive/run/next");
      set({ activeRun: res.data });
    } catch (err) {
      console.error(err);
    }
  },

  skipProblem: async () => {
    try {
      const res = await api.post("/competitive/run/skip");
      set({ activeRun: res.data });
      await get().fetchProfile();
    } catch (err) {
      console.error(err);
    }
  },

  quitRun: async () => {
    try {
      await api.post("/competitive/run/quit");
      set({ activeRun: null });
    } catch (err) {
      console.error(err);
    }
  },

  getProblemHtml: async (problemCode) => {
    try {
      const res = await api.get(`/competitive/run/problem/${problemCode}`);
      return res.data;
    } catch (err) {
      console.error(err);
      return "<div class='text-red-400'>Failed to load problem statement.</div>";
    }
  },

  executeCode: async (sourceCode, languageId, stdin) => {
    try {
      const res = await api.post("/competitive/run/execute", { sourceCode, languageId, stdin });
      return res.data;
    } catch (err: any) {
      console.error(err);
      return { 
        stdout: "", 
        stderr: err.response?.data?.message || "Execution failed.", 
        exitCode: 1, 
        timedOut: false, 
        runtimeError: true, 
        compileError: false 
      };
    }
  }
}));
