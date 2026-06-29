import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useBattle } from "../hooks/useBattle";
import { useRoomStore } from "../store/room.store";
import { useBattleStore } from "../store/battle.store";
import CodeEditor from "../components/CodeEditor";

// ── Helpers ────────────────────────────────────────────────────────────────

function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const DIFFICULTY_STYLE: Record<string, string> = {
  easy:   "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  hard:   "bg-red-500/20 text-red-400 border-red-500/30",
};

const VERDICT_STYLE: Record<string, { label: string; color: string; icon: string }> = {
  accepted:            { label: "Accepted",           color: "text-emerald-400", icon: "✓" },
  wrong_answer:        { label: "Wrong Answer",        color: "text-red-400",     icon: "✗" },
  runtime_error:       { label: "Runtime Error",       color: "text-orange-400",  icon: "!" },
  time_limit_exceeded: { label: "Time Limit Exceeded", color: "text-amber-400",   icon: "⏱" },
  eliminated:          { label: "Eliminated",          color: "text-red-400",     icon: "💀" },
  pending:             { label: "Judging…",            color: "text-gray-400",    icon: "…" },
  error:               { label: "Service Error",       color: "text-orange-400",  icon: "⚠" },
  already_accepted:    { label: "Already Solved!",     color: "text-emerald-400", icon: "✓" },
  not_active:          { label: "Round Not Active",    color: "text-gray-400",    icon: "—" },
};

// ── Main Page ──────────────────────────────────────────────────────────────

export default function BattlePage() {
  const navigate = useNavigate();
  const battleRoomId = useRoomStore((s) => s.battleRoomId);

  const {
    problem, roundNumber, totalRounds, phase, roundEndsAt, roundDuration,
    phaseStartsAt, leaderboard, liveEvents, runResults, isRunning, isSubmitting,
    lastVerdict, lastVerdictDetails, lastEarned, connected, finalLeaderboard,
    submissionHistory, activeTab, myEntry, runCode, submitCode, leaveRoom,
  } = useBattle();

  const { setActiveTab, language, body, fullTemplate, setBody, setLanguage, setLastVerdict, setRunResults } = useBattleStore();

  // Reset editor + verdict whenever a new problem arrives (round change)
  const prevRoundRef = useRef(roundNumber);
  useEffect(() => {
    if (roundNumber !== prevRoundRef.current) {
      prevRoundRef.current = roundNumber;
      setLastVerdict("", "");
      setRunResults([]);
      // body already reset by setProblem in the store when "problem" message fires
    }
  }, [roundNumber, setLastVerdict, setRunResults]);

  useEffect(() => {
    if (!battleRoomId) navigate("/home", { replace: true });
  }, [battleRoomId, navigate]);

  const [timeLeft, setTimeLeft] = useState(0);
  const [countdownLeft, setCountdownLeft] = useState(0);

  useEffect(() => {
    if (phase !== "coding") return;
    const tick = () => setTimeLeft(Math.max(0, Math.ceil((roundEndsAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [phase, roundEndsAt]);

  useEffect(() => {
    if (phase !== "countdown") return;
    const tick = () => setCountdownLeft(Math.max(0, Math.ceil((phaseStartsAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [phase, phaseStartsAt]);

  const aliveCount = useMemo(() => leaderboard.filter((p) => p.isAlive).length, [leaderboard]);
  const elimCount  = useMemo(() => leaderboard.filter((p) => !p.isAlive).length, [leaderboard]);

  const timerPct = roundDuration > 0 ? (timeLeft / roundDuration) * 100 : 0;
  const isUrgent = timeLeft <= 60 && timeLeft > 0;

  // ── Countdown Screen ───────────────────────────────────────────────
  if (phase === "countdown") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#010103]">
        <div className="absolute inset-0 bg-gradient-to-b from-red-900/20 to-transparent pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 text-center max-w-md w-full mx-4">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-red-600 to-pink-600 mx-auto mb-8 flex items-center justify-center shadow-[0_0_50px_rgba(239,68,68,0.4)]">
            <span className="text-4xl">⚡</span>
          </div>
          <h1 className="text-5xl font-black text-white mb-2 tracking-wider">BATTLE ROYALE</h1>
          <p className="text-gray-400 mb-10 font-medium">Get ready to code! Starting in…</p>
          <div className="text-[120px] font-black leading-none mb-10 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-500">
            {countdownLeft > 0 ? countdownLeft : "GO!"}
          </div>
          <p className="text-gray-500 text-sm">
            {leaderboard.length} player{leaderboard.length !== 1 ? "s" : ""} ready
          </p>
          {problem && (
            <div className="mt-6 p-4 rounded-2xl border border-white/10 bg-white/5 text-sm text-gray-400">
              First problem: <span className="font-bold text-white">{problem.title}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Results interstitial (between rounds)
  if (phase === "results") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#010103]">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/15 to-transparent pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-600/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="relative z-10 text-center max-w-md w-full mx-4">
          <div className="text-6xl mb-4">⚔️</div>
          <h2 className="text-3xl font-black text-white mb-2">Round {roundNumber} Complete!</h2>
          <p className="text-gray-400 mb-8">Next round loading…</p>
          {/* Leaderboard snapshot */}
          <div className="rounded-2xl border border-white/10 bg-[#12121a] p-4 space-y-2 mb-6">
            {leaderboard.map((p, i) => (
              <div key={p.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${
                !p.isAlive ? "opacity-40" : "bg-white/5"
              }`}>
                <span className="text-sm text-gray-500 w-4">{i + 1}</span>
                <span className={`flex-1 text-sm font-semibold text-left ${
                  p.isAlive ? "text-white" : "text-red-400 line-through"
                }`}>{p.username}</span>
                <span className="text-xs text-gray-500">{p.solved} solved</span>
                <span className={`font-black text-base ${
                  p.isAlive ? "text-cyan-400" : "text-gray-600"
                }`}>{p.score}</span>
                {!p.isAlive && <span className="text-red-400 text-xs">☠ Elim</span>}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-1">
            {[0,1,2].map(i => (
              <span key={i} className="w-2 h-2 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Game Over ──────────────────────────────────────────────────────
  if (phase === "finished") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#010103] px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🏆</div>
            <h1 className="text-4xl font-black text-white mb-2">Battle Over!</h1>
            <p className="text-gray-400">Final Rankings</p>
          </div>
          
          <div className="rounded-3xl border border-white/10 bg-[#12121a] p-6 space-y-3 mb-6">
            {(finalLeaderboard.length > 0 ? finalLeaderboard : leaderboard).map((entry, i) => {
              const medals = ["🥇", "🥈", "🥉"];
              const isWinner = entry.isAlive && i === 0;
              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                    isWinner
                      ? "border-amber-500/50 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                      : entry.isAlive
                      ? "border-white/10 bg-white/5"
                      : "border-red-500/15 bg-red-500/5 opacity-60"
                  }`}
                >
                  <span className="text-2xl w-8 text-center shrink-0">
                    {entry.isAlive ? (i < 3 ? medals[i] : `#${i + 1}`) : "☠"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold truncate ${entry.isAlive ? "text-white" : "text-gray-500 line-through"}`}>
                      {entry.username}
                    </p>
                    {!entry.isAlive && (entry as any).eliminatedRound > 0 && (
                      <p className="text-xs text-red-400/70">Eliminated in Round {(entry as any).eliminatedRound}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">{entry.solved} solved</span>
                  <span className={`font-black text-xl shrink-0 ${isWinner ? "text-amber-400" : entry.isAlive ? "text-cyan-400" : "text-gray-500"}`}>
                    {entry.score}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            id="battle-home-btn"
            onClick={leaveRoom}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-black text-base shadow-lg shadow-red-500/25 transition-transform active:scale-[0.98]"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#010103] overflow-hidden" style={{ height: "100vh" }}>

      {/* ── Nav ───────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-[#010103]/90 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-pink-600 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(239,68,68,0.4)]">
            <span className="text-base">⚡</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">BATTLE ROYALE</p>
            <p className="text-red-400 text-xs font-semibold">Round {roundNumber} / {totalRounds}</p>
          </div>
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border font-mono font-black text-xl ${
          isUrgent ? "border-red-500/50 bg-red-500/10 text-red-400 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          : timeLeft <= 300 ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
          : "border-cyan-500/30 bg-cyan-500/5 text-cyan-400"}`}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-bold tracking-widest">ROUND ENDS IN</span>
          <span className="tabular-nums text-2xl">{formatTime(timeLeft)}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-gray-500 text-xs font-medium">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
            {leaderboard.length} Players
          </div>
          <div className={`hidden sm:flex items-center gap-1.5 text-xs font-medium ${connected ? "text-emerald-400" : "text-red-400"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
            {connected ? "Live" : "Offline"}
          </div>
          <button
            id="leave-battle-btn"
            onClick={leaveRoom}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </nav>

      {/* Timer progress bar */}
      <div className="h-0.5 bg-white/5 shrink-0">
        <div
          className="h-full transition-all duration-1000"
          style={{
            width: `${timerPct}%`,
            background: isUrgent
              ? "linear-gradient(90deg, #ef4444, #f87171)"
              : timeLeft <= 300
              ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
              : "linear-gradient(90deg, #06b6d4, #22d3ee)",
          }}
        />
      </div>

      {/* ── 3-col main layout ─────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── LEFT: Battle Status + Players + Live Events ─────── */}
        <aside className="w-52 xl:w-60 shrink-0 flex flex-col border-r border-white/5 bg-[#0d0d14] overflow-y-auto">

          {/* Battle Status */}
          <div className="p-4 border-b border-white/5">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Battle Status</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-2.5 text-center">
                <p className="text-emerald-400 font-black text-2xl">{aliveCount}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase">Alive</p>
              </div>
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-2.5 text-center">
                <p className="text-red-400 font-black text-2xl">{elimCount}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase">Elim</p>
              </div>
            </div>
          </div>

          {/* Players list */}
          <div className="p-4 border-b border-white/5 flex-shrink-0">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
              Players ({leaderboard.length})
            </p>
            <div className="space-y-1">
              {leaderboard.map((p, i) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 py-1.5 px-1 rounded-lg transition-colors ${!p.isAlive ? "opacity-50" : ""}`}
                >
                  <span className="text-[10px] text-gray-600 w-4 text-right shrink-0">{i + 1}</span>
                  <span className={`flex-1 text-xs font-medium truncate ${p.isAlive ? "text-white" : "text-gray-500 line-through"}`}>
                    {p.username}
                    {i === 0 && p.isAlive && <span className="ml-1">👑</span>}
                  </span>
                  <span className={`text-xs font-bold shrink-0 ${p.isAlive ? "text-gray-400" : "text-gray-600"}`}>{p.score}</span>
                  {p.isAlive ? (
                    <span className={`text-[10px] font-bold shrink-0 w-4 text-center ${
                      p.submissionStatus === "accepted" ? "text-emerald-400"
                      : p.submissionStatus && p.submissionStatus !== "" ? "text-red-400"
                      : "text-gray-600"
                    }`}>
                      {p.submissionStatus === "accepted" ? "✓" : p.submissionStatus && p.submissionStatus !== "" ? "✗" : "●"}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-red-400 shrink-0 w-4 text-center">☠</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Live Events */}
          <div className="p-4 flex-1 overflow-y-auto">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Live Events</p>
            {liveEvents.length === 0 ? (
              <p className="text-[11px] text-gray-600 italic">Waiting for events…</p>
            ) : (
              <div className="space-y-2">
                {liveEvents.map((e) => (
                  <div key={e.id} className="flex items-start gap-1.5 text-[11px]">
                    <span className="text-gray-600 tabular-nums shrink-0 mt-px">
                      {new Date(e.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                    <span className={`leading-tight ${
                      e.type === "accepted" ? "text-emerald-400"
                      : e.type === "system" ? "text-amber-400"
                      : "text-red-400"
                    }`}>
                      <span className="font-bold text-white">{e.username}</span>{" "}
                      {e.type === "accepted" ? "✓" : e.type === "eliminated" ? "☠" : e.type === "system" ? "⚡" : "✗"}{" "}
                      {e.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ── CENTER: Problem + Submissions ─────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[#010103]">

          {/* Tabs */}
          <div className="flex border-b border-white/5 bg-[#0d0d14] shrink-0">
            {(["problem", "submissions"] as const).map((tab) => (
              <button
                key={tab}
                id={`tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors capitalize ${
                  activeTab === tab ? "border-cyan-500 text-cyan-400 bg-cyan-500/5" : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                {tab}
                {tab === "submissions" && submissionHistory.length > 0 && (
                  <span className="ml-2 text-[10px] bg-white/10 rounded-full px-1.5 py-0.5">{submissionHistory.length}</span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5">
            {activeTab === "problem" ? (
              problem ? (
                <div>
                  {/* Problem header */}
                  <div className="flex flex-wrap items-center gap-2 mb-5">
                    <h1 className="text-xl font-black text-white">{problem.title}</h1>
                    <span className={`px-2 py-0.5 rounded-lg border text-xs font-bold capitalize ${DIFFICULTY_STYLE[problem.difficulty]}`}>
                      {problem.difficulty}
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold">
                      {problem.points} pts
                    </span>
                  </div>

                  {/* Tags & Companies */}
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {problem.tags?.map((tag) => (
                      <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-gray-500 border border-white/5">{tag}</span>
                    ))}
                    {problem.companies?.map((company) => (
                      <span key={company} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500/70 border border-amber-500/20">{company}</span>
                    ))}
                  </div>

                  {/* Description */}
                  <div className="rounded-2xl border border-white/5 bg-[#0d0d14] p-5 mb-5 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {problem.description}
                  </div>

                  {/* Examples */}
                  <div className="space-y-3 mb-5">
                    {problem.examples.map((ex, i) => (
                      <div key={i} className="rounded-2xl border border-white/5 bg-[#0d0d14] p-4">
                        <p className="text-xs font-bold text-gray-500 mb-3">Example {i + 1}</p>
                        <div className="space-y-2 text-xs font-mono">
                          <div><span className="text-gray-500">Input: </span><br/><span className="text-white whitespace-pre-wrap">{ex.input.replace(/\\n/g, '\n')}</span></div>
                          <div><span className="text-gray-500">Output: </span><br/><span className="text-emerald-400 font-semibold whitespace-pre-wrap">{ex.output.replace(/\\n/g, '\n')}</span></div>
                          {ex.explanation && (
                            <div className="text-gray-400 mt-2 font-sans leading-relaxed whitespace-pre-wrap">
                              <span className="font-semibold">Explanation:</span><br/>{ex.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Constraints & Complexity */}
                  <div className="space-y-3 mb-5">
                    {problem.constraints && (
                      <div className="rounded-2xl border border-white/5 bg-[#0d0d14] p-4">
                        <p className="text-xs font-bold text-gray-500 mb-2">Constraints</p>
                        <p className="text-sm text-gray-300 font-mono whitespace-pre-wrap">{problem.constraints}</p>
                      </div>
                    )}
                    {problem.expectedComplexity && (
                      <div className="rounded-2xl border border-white/5 bg-[#0d0d14] p-4">
                        <p className="text-xs font-bold text-gray-500 mb-2">Expected Complexity</p>
                        <p className="text-sm text-gray-300 font-mono">{problem.expectedComplexity}</p>
                      </div>
                    )}
                  </div>

                  {/* Hints */}
                  {problem.hints && problem.hints.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-500 mb-2">Hints</p>
                      {problem.hints.map((hint, i) => (
                        <div key={i} className="rounded-xl border border-white/5 bg-[#0d0d14] p-3 text-xs text-gray-400">
                          <span className="font-bold text-gray-500 mr-2">#{i + 1}</span> {hint}
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="mt-4 text-[11px] text-gray-600 italic">+ {problem.hiddenCount} hidden test case{problem.hiddenCount !== 1 ? "s" : ""}</p>

                  {/* Run Code Results */}
                  {runResults.length > 0 && (
                    <div className="mt-6">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Run Results</p>
                      <div className="space-y-2">
                        {runResults.map((r, i) => (
                          <div key={i} className={`rounded-2xl border p-4 text-xs font-mono ${r.passed ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`font-bold ${r.passed ? "text-emerald-400" : "text-red-400"}`}>
                                {r.passed ? "✓ Passed" : "✗ Failed"} — Case {i + 1}
                              </span>
                            </div>
                            <p className="text-gray-500">Input: <span className="text-white">{r.input}</span></p>
                            <p className="text-gray-500">Expected: <span className="text-emerald-400">{r.expectedOutput}</span></p>
                            <p className="text-gray-500">Got: <span className={r.passed ? "text-white" : "text-red-400"}>{r.actualOutput || "(empty)"}</span></p>
                            {r.stderr && <p className="text-orange-400 mt-1 whitespace-pre-wrap">{r.stderr.slice(0, 200)}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-40">
                  <div className="text-center text-gray-500">
                    <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-3" />
                    <p className="text-sm">Loading problem…</p>
                  </div>
                </div>
              )
            ) : (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Submission History</p>
                {submissionHistory.length === 0 ? (
                  <p className="text-sm text-gray-600 italic">No submissions yet</p>
                ) : (
                  <div className="space-y-2">
                    {submissionHistory.map((s, i) => {
                      const v = VERDICT_STYLE[s.verdict] ?? { label: s.verdict, color: "text-gray-500", icon: "?" };
                      return (
                        <div key={i} className="flex items-center justify-between px-4 py-3 rounded-2xl border border-white/5 bg-[#0d0d14]">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${v.color}`}>{v.icon}</span>
                            <span className={`font-semibold text-sm ${v.color}`}>{v.label}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/5">{s.language}</span>
                            <span>{new Date(s.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Editor + Your Status ──────────────────── */}
        <div className="flex-1 flex flex-col border-l border-white/5 overflow-hidden min-w-0">

          <div className="flex-1 overflow-hidden min-h-0">
            <CodeEditor
              fullTemplate={fullTemplate}
              language={language}
              body={body}
              onBodyChange={setBody}
              onLanguageChange={setLanguage}
              onRun={runCode}
              onSubmit={submitCode}
              isRunning={isRunning}
              isSubmitting={isSubmitting}
              isEliminated={myEntry?.isAlive === false}
            />
          </div>

          {/* Your Status */}
          <div className="shrink-0 border-t border-white/5 p-4 bg-[#0d0d14]">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Your Status</p>
            <div className="flex items-center gap-4">
              <div className={`px-3 py-1.5 rounded-xl font-black text-sm shrink-0 border ${
                myEntry?.isAlive !== false
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  : "bg-red-500/20 text-red-400 border-red-500/30"
              }`}>
                {myEntry?.isAlive !== false ? "ALIVE" : "ELIMINATED"}
              </div>

              <div className="flex gap-6 text-center flex-1">
                {[
                  { label: "Rank",   value: myEntry ? leaderboard.indexOf(myEntry) + 1 : "—" },
                  { label: "Score",  value: myEntry ? `${myEntry.score}` : "0" },
                  { label: "Solved", value: `${myEntry?.solved ?? 0}/${totalRounds}` },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-white font-black text-lg">{stat.value}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">{stat.label}</p>
                  </div>
                ))}
              </div>

              {lastVerdict && (
                <div className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl border ${
                  lastVerdict === "accepted"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : "bg-red-500/20 text-red-400 border-red-500/30"
                }`}>
                  {VERDICT_STYLE[lastVerdict]?.icon ?? "?"}{" "}
                  {VERDICT_STYLE[lastVerdict]?.label ?? lastVerdict}
                  {lastVerdict === "accepted" && lastEarned > 0 && (
                    <span className="ml-1 text-emerald-300">+{lastEarned}</span>
                  )}
                </div>
              )}
            </div>

            {lastVerdict && lastVerdict !== "accepted" && lastVerdict !== "eliminated" && lastVerdictDetails && (
              <div className="mt-3 px-3 py-2 bg-red-500/5 border border-red-500/20 rounded-xl">
                <p className="text-[11px] font-mono text-red-300 whitespace-pre-wrap leading-relaxed">
                  {lastVerdictDetails.slice(0, 300)}
                </p>
              </div>
            )}
            {lastVerdict && lastVerdict !== "accepted" && lastVerdict !== "eliminated" && myEntry?.isAlive && (
              <p className="mt-1.5 text-[10px] text-gray-600">
                ✦ You can fix your code and try again — elimination happens at round end based on score.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
