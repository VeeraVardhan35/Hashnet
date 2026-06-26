import { useEffect, useMemo, useState } from "react";
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
  easy: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  hard: "bg-red-500/20 text-red-400 border-red-500/30",
};

const VERDICT_STYLE: Record<string, { label: string; color: string; icon: string }> = {
  accepted: { label: "Accepted", color: "text-emerald-400", icon: "✓" },
  wrong_answer: { label: "Wrong Answer", color: "text-red-400", icon: "✗" },
  runtime_error: { label: "Runtime Error", color: "text-orange-400", icon: "!" },
  time_limit_exceeded: { label: "Time Limit Exceeded", color: "text-amber-400", icon: "⏱" },
  eliminated: { label: "Eliminated", color: "text-red-400", icon: "💀" },
  pending: { label: "Judging…", color: "text-text-muted", icon: "…" },
  error: { label: "Service Error", color: "text-orange-400", icon: "⚠" },
  already_accepted: { label: "Already Solved!", color: "text-emerald-400", icon: "✓" },
  not_active: { label: "Round Not Active", color: "text-text-muted", icon: "—" },
};

// ── Main Page ──────────────────────────────────────────────────────────────

export default function BattlePage() {
  const navigate = useNavigate();
  const battleRoomId = useRoomStore((s) => s.battleRoomId);

  const {
    problem,
    roundNumber,
    totalRounds,
    phase,
    roundEndsAt,
    roundDuration,
    phaseStartsAt,
    leaderboard,
    liveEvents,
    runResults,
    isRunning,
    isSubmitting,
    lastVerdict,
    lastVerdictDetails,
    lastEarned,
    connected,
    finalLeaderboard,
    submissionHistory,
    activeTab,
    myEntry,
    runCode,
    submitCode,
    leaveRoom,
  } = useBattle();

  const { setActiveTab, language, body, fullTemplate, setBody, setLanguage } = useBattleStore();

  // Redirect if no battle room
  useEffect(() => {
    if (!battleRoomId) navigate("/home", { replace: true });
  }, [battleRoomId, navigate]);

  // ── Local countdown timers ─────────────────────────────────────────
  const [timeLeft, setTimeLeft] = useState(0);
  const [countdownLeft, setCountdownLeft] = useState(0);

  useEffect(() => {
    if (phase !== "coding") return;
    const tick = () =>
      setTimeLeft(Math.max(0, Math.ceil((roundEndsAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [phase, roundEndsAt]);

  useEffect(() => {
    if (phase !== "countdown") return;
    const tick = () =>
      setCountdownLeft(Math.max(0, Math.ceil((phaseStartsAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [phase, phaseStartsAt]);

  // ── Leaderboard stats ──────────────────────────────────────────────
  const aliveCount = useMemo(() => leaderboard.filter((p) => p.isAlive).length, [leaderboard]);
  const elimCount = useMemo(() => leaderboard.filter((p) => !p.isAlive).length, [leaderboard]);

  const timerPct = roundDuration > 0 ? (timeLeft / roundDuration) * 100 : 0;
  const isUrgent = timeLeft <= 60 && timeLeft > 0;

  // ── Countdown Screen ───────────────────────────────────────────────
  if (phase === "countdown") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg-base">
        <div className="glass-card-solid p-12 text-center max-w-md w-full mx-4 animate-slide-up">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-red-600 to-primary mx-auto mb-6 flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-text-primary mb-1">Battle Royale</h1>
          <p className="text-text-secondary mb-8">Get ready to code! Starting in…</p>
          <div className="text-7xl font-black text-gradient mb-8">
            {countdownLeft > 0 ? countdownLeft : "Go!"}
          </div>
          <p className="text-text-muted text-sm">
            {leaderboard.length} player{leaderboard.length !== 1 ? "s" : ""} joined
          </p>
          {problem && (
            <div className="mt-4 p-3 glass-card rounded-xl text-sm text-text-secondary">
              First problem: <span className="font-bold text-text-primary">{problem.title}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Game Over ──────────────────────────────────────────────────────
  if (phase === "finished") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg-base px-4">
        <div className="glass-card-solid p-8 max-w-lg w-full animate-slide-up">
          <h1 className="text-3xl font-extrabold text-center text-gradient mb-2">
            Battle Over! ⚔️
          </h1>
          <p className="text-text-secondary text-center mb-8">Final Leaderboard</p>
          <div className="space-y-2.5 mb-8">
            {(finalLeaderboard.length > 0 ? finalLeaderboard : leaderboard).map((entry, i) => {
              const medals = ["🥇", "🥈", "🥉"];
              const isWinner = entry.isAlive && i === 0;
              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-4 p-3.5 rounded-xl border transition-all ${
                    isWinner
                      ? "border-amber-500/50 bg-amber-500/15 shadow-[0_0_16px_rgba(245,158,11,0.15)]"
                      : entry.isAlive
                      ? "border-white/10 bg-white/[0.03]"
                      : "border-red-500/15 bg-red-500/5 opacity-60"
                  }`}
                >
                  <span className="text-xl w-8 text-center shrink-0">
                    {entry.isAlive
                      ? i < 3 ? medals[i] : `#${i + 1}`
                      : "☠"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${
                      entry.isAlive ? "text-text-primary" : "text-text-muted line-through"
                    }`}>{entry.username}</p>
                    {!entry.isAlive && (entry as any).eliminatedRound > 0 && (
                      <p className="text-[10px] text-red-400/70">Eliminated in Round {(entry as any).eliminatedRound}</p>
                    )}
                  </div>
                  <span className="text-xs text-text-muted shrink-0">{entry.solved} solved</span>
                  <span className={`font-bold text-lg shrink-0 ${
                    isWinner ? "text-amber-400" : entry.isAlive ? "text-primary" : "text-text-muted"
                  }`}>{entry.score}</span>
                </div>
              );
            })}
          </div>
          <button id="battle-home-btn" onClick={leaveRoom} className="btn-primary w-full">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-base overflow-hidden" style={{ height: "100vh" }}>

      {/* ── Nav ───────────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-4 py-2.5 border-b border-white/8 bg-bg-surface/80 backdrop-blur shrink-0">
        {/* Logo + round info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-primary flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-none">
              BATTLE ROYALE
            </p>
            <p className="text-text-secondary text-xs font-medium">
              Round {roundNumber} / {totalRounds}
            </p>
          </div>
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-black text-xl
          ${isUrgent ? "border-red-500/50 bg-red-500/10 text-red-400 animate-pulse"
            : timeLeft <= 300 ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
            : "border-accent/40 bg-accent/10 text-accent"}`}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>ROUND ENDS IN</span>
          <span className="tabular-nums text-2xl">{formatTime(timeLeft)}</span>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-text-muted text-xs">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            {leaderboard.length} Players
          </div>
          <div className={`hidden sm:flex items-center gap-1.5 text-xs ${connected ? "text-success" : "text-danger"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-success" : "bg-danger"}`} />
            {connected ? "Live" : "Offline"}
          </div>
          <button id="leave-battle-btn" onClick={leaveRoom} className="btn-danger text-xs px-3 py-2">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Leave Room</span>
          </button>
        </div>
      </nav>

      {/* Timer progress bar */}
      <div className="h-0.5 bg-white/5 shrink-0">
        <div
          className="h-full transition-all duration-1000 linear"
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

      {/* ── 3-column main layout ────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── LEFT: Battle Status + Players + Live Events ─────────── */}
        <aside className="w-52 xl:w-60 shrink-0 flex flex-col border-r border-white/8 bg-bg-surface/40 overflow-y-auto">

          {/* Battle Status */}
          <div className="p-3 border-b border-white/8">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
              Battle Status
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="glass-card p-2 rounded-lg text-center">
                <p className="text-emerald-400 font-black text-xl">{aliveCount}</p>
                <p className="text-[10px] text-text-muted font-semibold uppercase">Alive</p>
              </div>
              <div className="glass-card p-2 rounded-lg text-center">
                <p className="text-red-400 font-black text-xl">{elimCount}</p>
                <p className="text-[10px] text-text-muted font-semibold uppercase">Eliminated</p>
              </div>
            </div>
          </div>

          {/* Players list — alive first, then eliminated */}
          <div className="p-3 border-b border-white/8 flex-shrink-0">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
              Players ({leaderboard.length})
            </p>
            <div className="space-y-1">
              {leaderboard.map((p, i) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-2 py-1 rounded-lg transition-colors ${
                    !p.isAlive ? "opacity-50" : ""
                  }`}
                >
                  <span className="text-[10px] text-text-muted w-3.5 text-right shrink-0">{i + 1}</span>
                  <span
                    className={`flex-1 text-xs font-medium truncate ${
                      p.isAlive ? "text-text-primary" : "text-text-muted line-through"
                    }`}
                  >
                    {p.username}
                    {i === 0 && p.isAlive && <span className="ml-1">👑</span>}
                  </span>
                  <span className={`text-xs font-bold shrink-0 ${
                    p.isAlive ? "text-text-secondary" : "text-text-muted"
                  }`}>
                    {p.score}
                  </span>
                  {p.isAlive ? (
                    <span className={`text-[10px] font-bold shrink-0 w-4 text-center ${
                      p.submissionStatus === "accepted"
                        ? "text-emerald-400"
                        : p.submissionStatus && p.submissionStatus !== ""
                        ? "text-red-400"
                        : "text-text-muted"
                    }`}>
                      {p.submissionStatus === "accepted" ? "✓"
                        : p.submissionStatus && p.submissionStatus !== "" ? "✗"
                        : "●"}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-red-400 shrink-0 w-4 text-center">☠</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Live Events */}
          <div className="p-3 flex-1 overflow-y-auto">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
              Live Events
            </p>
            {liveEvents.length === 0 ? (
              <p className="text-[11px] text-text-muted italic">Waiting for events…</p>
            ) : (
              <div className="space-y-1.5">
                {liveEvents.map((e) => (
                  <div key={e.id} className="flex items-start gap-1.5 text-[11px]">
                    <span className="text-text-muted tabular-nums shrink-0 mt-px">
                      {new Date(e.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                    <span
                      className={`leading-tight ${
                        e.type === "accepted"
                          ? "text-emerald-400"
                          : e.type === "system"
                          ? "text-amber-400"
                          : "text-red-400"
                      }`}
                    >
                      <span className="font-bold text-text-primary">{e.username}</span>{" "}
                      {e.type === "accepted" ? "✓"
                        : e.type === "eliminated" ? "☠"
                        : e.type === "system" ? "⚡"
                        : "✗"}{" "}
                      {e.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ── CENTER: Problem + Submissions ──────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Tabs */}
          <div className="flex border-b border-white/8 bg-bg-surface/20 shrink-0">
            {(["problem", "submissions"] as const).map((tab) => (
              <button
                key={tab}
                id={`tab-${tab}`}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-semibold border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? "border-accent text-accent"
                    : "border-transparent text-text-muted hover:text-text-secondary"
                }`}
              >
                {tab}
                {tab === "submissions" && submissionHistory.length > 0 && (
                  <span className="ml-1.5 text-[10px] bg-white/10 rounded-full px-1.5 py-0.5">
                    {submissionHistory.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === "problem" ? (
              problem ? (
                <div>
                  {/* Problem header */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <h1 className="text-lg font-extrabold text-text-primary">{problem.title}</h1>
                    <span className={`badge border text-xs font-bold capitalize ${DIFFICULTY_STYLE[problem.difficulty]}`}>
                      {problem.difficulty}
                    </span>
                    <span className="badge bg-primary/20 text-primary border border-primary/30 text-xs font-bold">
                      {problem.points} points
                    </span>
                  </div>

                  {/* Tags */}
                  {problem.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {problem.tags.map((tag) => (
                        <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-text-muted border border-white/8">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Description */}
                  <div className="glass-card p-4 rounded-xl mb-5 text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                    {problem.description}
                  </div>

                  {/* Examples */}
                  <div className="space-y-3">
                    {problem.examples.map((ex, i) => (
                      <div key={i} className="glass-card rounded-xl p-4 border border-white/8">
                        <p className="text-xs font-bold text-text-muted mb-2">Example {i + 1}:</p>
                        <div className="space-y-1 text-xs font-mono">
                          <p>
                            <span className="text-text-muted">Input:&nbsp;</span>
                            <span className="text-text-primary">{ex.input}</span>
                          </p>
                          <p>
                            <span className="text-text-muted">Output:&nbsp;</span>
                            <span className="text-emerald-400 font-semibold">{ex.output}</span>
                          </p>
                          {ex.explanation && (
                            <p className="text-text-muted mt-1 font-sans">
                              <span className="font-semibold">Explanation:</span> {ex.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="mt-3 text-[11px] text-text-muted italic">
                    + {problem.hiddenCount} hidden test case{problem.hiddenCount !== 1 ? "s" : ""}
                  </p>

                  {/* Run Code Results */}
                  {runResults.length > 0 && (
                    <div className="mt-5">
                      <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-2">
                        Run Results
                      </p>
                      <div className="space-y-2">
                        {runResults.map((r, i) => (
                          <div
                            key={i}
                            className={`glass-card p-3 rounded-xl border text-xs font-mono ${
                              r.passed ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className={`font-bold ${r.passed ? "text-emerald-400" : "text-red-400"}`}>
                                {r.passed ? "✓ Passed" : "✗ Failed"} — Case {i + 1}
                              </span>
                            </div>
                            <p className="text-text-muted">Input: <span className="text-text-primary">{r.input}</span></p>
                            <p className="text-text-muted">Expected: <span className="text-emerald-400">{r.expectedOutput}</span></p>
                            <p className="text-text-muted">Got: <span className={r.passed ? "text-text-primary" : "text-red-400"}>{r.actualOutput || "(empty)"}</span></p>
                            {r.stderr && <p className="text-orange-400 mt-1 whitespace-pre-wrap">{r.stderr.slice(0, 200)}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-40">
                  <div className="text-center text-text-muted">
                    <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-3" />
                    <p className="text-sm">Loading problem…</p>
                  </div>
                </div>
              )
            ) : (
              /* Submissions tab */
              <div>
                <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">
                  Submission History
                </p>
                {submissionHistory.length === 0 ? (
                  <p className="text-sm text-text-muted italic">No submissions yet</p>
                ) : (
                  <div className="space-y-2">
                    {submissionHistory.map((s, i) => {
                      const v = VERDICT_STYLE[s.verdict] ?? { label: s.verdict, color: "text-text-muted", icon: "?" };
                      return (
                        <div key={i} className="flex items-center justify-between px-4 py-3 glass-card rounded-xl border border-white/8">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-sm ${v.color}`}>{v.icon}</span>
                            <span className={`font-semibold text-sm ${v.color}`}>{v.label}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-text-muted">
                            <span className="badge bg-white/5 border-white/8">{s.language}</span>
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

        {/* ── RIGHT: Editor + Your Status ────────────────────────── */}
        <div className="flex-1 flex flex-col border-l border-white/8 overflow-hidden min-w-0">

          {/* Editor (takes most of the space) */}
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

          {/* ── Your Status ─────────────────────────────────────── */}
          <div className="shrink-0 border-t border-white/8 p-3 bg-bg-surface/40">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
              Your Status
            </p>
            <div className="flex items-center gap-3">
              {/* Alive/Elim badge */}
              <div
                className={`px-3 py-1.5 rounded-lg font-black text-sm shrink-0 ${
                  myEntry?.isAlive !== false
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}
              >
                {myEntry?.isAlive !== false ? "ALIVE" : "ELIMINATED"}
              </div>

              {/* Stats */}
              <div className="flex gap-4 text-center flex-1">
                {[
                  { label: "Rank", value: myEntry ? leaderboard.indexOf(myEntry) + 1 : "—" },
                  { label: "Score", value: myEntry ? `${myEntry.score} pts` : "0 pts" },
                  { label: "Solved", value: `${myEntry?.solved ?? 0} / ${totalRounds}` },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-text-primary font-black text-base">{stat.value}</p>
                    <p className="text-[10px] text-text-muted font-semibold uppercase">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Last verdict pill */}
              {lastVerdict && (
                <div className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg border animate-fade-in ${
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

            {/* Verdict details + retry hint */}
            {lastVerdict && lastVerdict !== "accepted" && lastVerdict !== "eliminated" && lastVerdictDetails && (
              <div className="mt-2 px-3 py-2 bg-red-500/5 border border-red-500/20 rounded-lg">
                <p className="text-[11px] font-mono text-red-300 whitespace-pre-wrap leading-relaxed">
                  {lastVerdictDetails.slice(0, 300)}
                </p>
              </div>
            )}
            {lastVerdict && lastVerdict !== "accepted" && lastVerdict !== "eliminated" && myEntry?.isAlive && (
              <p className="mt-1.5 text-[10px] text-text-muted">
                ✦ You can fix your code and try again — elimination happens at round end based on score.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
