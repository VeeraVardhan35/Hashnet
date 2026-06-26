// ── Shared TypeScript interfaces for the Hashet client ─────────────

export interface User {
  id: string;
  username: string;
  email: string;
}

export interface Player {
  id: string;
  username: string;
  ready: boolean;
  isHost: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RoomError {
  message: string;
}

// ── Quiz interfaces ──────────────────────────────────────────────────

export interface QuizQuestion {
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  points: number;
  category: string;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  score: number;
  answered: boolean;
  lastAnswerCorrect: boolean;
  streak: number;
  isHost: boolean;
}

export interface ActivityEntry {
  id: string; // unique key
  username: string;
  correct: boolean;
  points: number;
  timestamp: number;
}

// ── Battle types ────────────────────────────────────────────────────

export interface BattleProblem {
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  points: number;
  examples: { input: string; output: string; explanation: string }[];
  hiddenCount: number;
  templates: { python: string; javascript: string; cpp: string };
  tags: string[];
}

export interface BattlePlayerEntry {
  id: string;
  username: string;
  score: number;
  isAlive: boolean;
  solved: number;
  submissionStatus: string;
  isHost: boolean;
  submissions: number;
}

export interface BattleLiveEvent {
  id: string;
  username: string;
  type: "accepted" | "eliminated";
  message: string;
  color: "green" | "red";
  timestamp: number;
}

export interface RunCodeTestResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  verdict: string;
  stderr: string;
}
