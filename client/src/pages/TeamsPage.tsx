import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTeams } from "../hooks/useTeams";
import { useRoomStore } from "../store/room.store";
import { useTeamsStore } from "../store/teams.store";
import { useAuthStore } from "../store/auth.store";
import CodeEditor from "../components/CodeEditor";

function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const VERDICT_STYLE: Record<string, { label: string; color: string; icon: string }> = {
  accepted: { label: "Accepted", color: "text-emerald-400", icon: "✓" },
  wrong_answer: { label: "Wrong Answer", color: "text-red-400", icon: "✗" },
  runtime_error: { label: "Runtime Error", color: "text-orange-400", icon: "!" },
  time_limit_exceeded: { label: "Time Limit", color: "text-amber-400", icon: "⏱" },
  error: { label: "Service Error", color: "text-orange-400", icon: "⚠" },
  already_accepted: { label: "Already Solved", color: "text-emerald-400", icon: "✓" },
  not_active: { label: "Round Not Active", color: "text-text-muted", icon: "—" },
};

const DIFFICULTY_STYLE: Record<string, string> = {
  easy: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  hard: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function TeamsPage() {
  const navigate        = useNavigate();
  const teamsRoomId     = useRoomStore((s) => s.teamsRoomId);
  const user            = useAuthStore((s) => s.user);
  const { setActiveTab, setBody, setLanguage } = useTeamsStore();

  const {
    problem, phase, roundNumber, totalRounds, roundEndsAt, roundDuration, phaseStartsAt,
    teamAlphaScore, teamBetaScore, players, liveEvents,
    runResults, isRunning, isSubmitting, lastVerdict, lastVerdictDetails, lastEarned,
    connected, finalResult, submissionHistory, language, body, fullTemplate, activeTab,
    runCode, submitCode, leaveRoom,
  } = useTeams();

  useEffect(() => { if (!teamsRoomId) navigate("/home", { replace: true }); }, [teamsRoomId]);

  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    if (phase !== "coding") return;
    const tick = () => setTimeLeft(Math.max(0, Math.ceil((roundEndsAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [phase, roundEndsAt]);

  const alphaPlayers = useMemo(() => players.filter((p) => p.team === "alpha"), [players]);
  const betaPlayers  = useMemo(() => players.filter((p) => p.team === "beta"),  [players]);
  const myPlayer     = useMemo(() => players.find((p) => p.username === user?.username), [players, user]);

  const isUrgent     = timeLeft <= 60 && timeLeft > 0;
  const timerPct     = roundDuration > 0 ? (timeLeft / roundDuration) * 100 : 0;

  // ── Countdown ─────────────────────────────────────────────────────────────
  if (phase === "countdown") {
    const secs = Math.max(0, Math.ceil((phaseStartsAt - Date.now()) / 1000));
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <div className="glass-card-solid p-12 text-center max-w-md w-full mx-4 animate-slide-up">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-cyan-600 mx-auto mb-6 flex items-center justify-center">
            <span className="text-4xl">⚔️</span>
          </div>
          <h1 className="text-3xl font-extrabold text-text-primary mb-2">Teams Mode</h1>
          <p className="text-text-secondary mb-8">Alpha vs Beta — get ready!</p>
          <div className="text-7xl font-black text-gradient mb-6">{secs > 0 ? secs : "Go!"}</div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <p className="text-emerald-400 font-black text-lg">{alphaPlayers.length}</p>
              <p className="text-xs text-text-muted">Team Alpha</p>
            </div>
            <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/30 text-center">
              <p className="text-orange-400 font-black text-lg">{betaPlayers.length}</p>
              <p className="text-xs text-text-muted">Team Beta</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Game Over ─────────────────────────────────────────────────────────────
  if (phase === "finished" && finalResult) {
    const winner = finalResult.winner;
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base px-4">
        <div className="glass-card-solid p-8 max-w-xl w-full animate-slide-up">
          <h1 className="text-3xl font-extrabold text-center mb-1">
            {winner === "tie" ? "🤝 It's a Tie!" : winner === "alpha" ? "🏆 Team Alpha Wins!" : "🏆 Team Beta Wins!"}
          </h1>
          <p className="text-center text-text-secondary mb-6">Final Scores</p>

          {/* Team score cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {[
              { label: "TEAM ALPHA", score: finalResult.teamAlphaScore, color: "emerald", team: "alpha" },
              { label: "TEAM BETA",  score: finalResult.teamBetaScore,  color: "orange",  team: "beta"  },
            ].map(({ label, score, color, team }) => (
              <div key={team} className={`p-4 rounded-xl text-center border ${
                winner === team
                  ? `border-${color}-500/60 bg-${color}-500/15 shadow-lg`
                  : "border-white/10 bg-white/[0.02]"
              }`}>
                <p className={`text-xs font-bold text-${color}-400 mb-1`}>{label}</p>
                <p className="text-3xl font-black text-text-primary">{score.toLocaleString()}</p>
                {winner === team && <p className="text-xs mt-1">👑 Winner</p>}
              </div>
            ))}
          </div>

          {/* Top scorers */}
          <div className="space-y-2 mb-6">
            {finalResult.leaderboard?.slice(0, 8).map((entry: any, i: number) => (
              <div key={entry.id} className={`flex items-center gap-3 p-3 rounded-xl border ${
                entry.team === "alpha" ? "border-emerald-500/20 bg-emerald-500/5" : "border-orange-500/20 bg-orange-500/5"
              }`}>
                <span className="text-sm text-text-muted w-5 text-center">{i + 1}</span>
                <span className={`w-2 h-2 rounded-full shrink-0 ${entry.team === "alpha" ? "bg-emerald-400" : "bg-orange-400"}`} />
                <span className="flex-1 font-semibold text-text-primary text-sm truncate">{entry.username}</span>
                <span className="text-xs text-text-muted">{entry.solved} solved</span>
                <span className="font-bold text-text-primary">{entry.score}</span>
              </div>
            ))}
          </div>
          <button onClick={leaveRoom} className="btn-primary w-full">Back to Home</button>
        </div>
      </div>
    );
  }

  // ── Main Game ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-bg-base overflow-hidden" style={{ height: "100vh" }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-4 py-2.5 border-b border-white/8 bg-bg-surface/80 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-lg">⚔️</span>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-none">TEAMS MODE</p>
            <p className="text-text-secondary text-xs font-medium">Round {roundNumber} / {totalRounds}</p>
          </div>
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-black text-xl ${
          isUrgent ? "border-red-500/50 bg-red-500/10 text-red-400 animate-pulse"
          : timeLeft <= 300 ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
          : "border-accent/40 bg-accent/10 text-accent"
        }`}>
          <span className="text-sm">ENDS IN</span>
          <span className="tabular-nums text-2xl">{formatTime(timeLeft)}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-xs ${connected ? "text-success" : "text-danger"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-success" : "bg-danger"}`} />
            {connected ? "Live" : "Offline"}
          </div>
          <button onClick={leaveRoom} className="btn-danger text-xs px-3 py-2">Leave</button>
        </div>
      </nav>

      {/* Timer bar */}
      <div className="h-0.5 bg-white/5 shrink-0">
        <div className="h-full transition-all duration-1000" style={{
          width: `${timerPct}%`,
          background: isUrgent ? "linear-gradient(90deg,#ef4444,#f87171)" : "linear-gradient(90deg,#10b981,#06b6d4)",
        }} />
      </div>

      {/* Team Score Banner */}
      <div className="flex items-stretch border-b border-white/8 bg-bg-surface/30 shrink-0">
        <div className={`flex-1 flex items-center justify-center gap-3 py-3 ${teamAlphaScore > teamBetaScore ? "bg-emerald-500/10" : ""}`}>
          <div className="text-center">
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">TEAM ALPHA</p>
            <p className="text-2xl font-black text-emerald-400">{teamAlphaScore.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center px-6 border-x border-white/8">
          <span className="text-2xl font-black text-text-muted">VS</span>
        </div>
        <div className={`flex-1 flex items-center justify-center gap-3 py-3 ${teamBetaScore > teamAlphaScore ? "bg-orange-500/10" : ""}`}>
          <div className="text-center">
            <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">TEAM BETA</p>
            <p className="text-2xl font-black text-orange-400">{teamBetaScore.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* LEFT: Scoreboards */}
        <aside className="w-56 xl:w-64 shrink-0 flex flex-col border-r border-white/8 bg-bg-surface/30 overflow-y-auto">
          {/* Alpha */}
          <div className="p-3 border-b border-white/8">
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">👥 Team Alpha</p>
            <div className="space-y-1">
              {alphaPlayers.map((p, i) => (
                <div key={p.id} className="flex items-center gap-1.5 py-0.5">
                  <span className="text-[10px] text-text-muted w-3 text-right">{i + 1}</span>
                  <span className="flex-1 text-xs font-medium truncate text-text-primary">
                    {p.username}{p.username === user?.username && <span className="text-emerald-400 ml-1">(You)</span>}
                  </span>
                  <span className="text-xs font-bold text-text-secondary">{p.score}</span>
                  <span className={`text-[10px] w-4 text-center ${
                    p.submissionStatus === "accepted" ? "text-emerald-400" :
                    p.submissionStatus && p.submissionStatus !== "" ? "text-red-400" : "text-text-muted"
                  }`}>
                    {p.submissionStatus === "accepted" ? "✓" : p.submissionStatus && p.submissionStatus !== "" ? "✗" : "●"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Beta */}
          <div className="p-3 border-b border-white/8">
            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">👥 Team Beta</p>
            <div className="space-y-1">
              {betaPlayers.map((p, i) => (
                <div key={p.id} className="flex items-center gap-1.5 py-0.5">
                  <span className="text-[10px] text-text-muted w-3 text-right">{i + 1}</span>
                  <span className="flex-1 text-xs font-medium truncate text-text-primary">
                    {p.username}{p.username === user?.username && <span className="text-orange-400 ml-1">(You)</span>}
                  </span>
                  <span className="text-xs font-bold text-text-secondary">{p.score}</span>
                  <span className={`text-[10px] w-4 text-center ${
                    p.submissionStatus === "accepted" ? "text-emerald-400" :
                    p.submissionStatus && p.submissionStatus !== "" ? "text-red-400" : "text-text-muted"
                  }`}>
                    {p.submissionStatus === "accepted" ? "✓" : p.submissionStatus && p.submissionStatus !== "" ? "✗" : "●"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Events */}
          <div className="p-3 flex-1 overflow-y-auto">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Live Activity</p>
            {liveEvents.length === 0 ? (
              <p className="text-[11px] text-text-muted italic">Waiting…</p>
            ) : (
              <div className="space-y-1.5">
                {liveEvents.map((e) => (
                  <div key={e.id} className="text-[11px] leading-tight">
                    <span className={`font-bold ${e.team === "alpha" ? "text-emerald-400" : e.team === "beta" ? "text-orange-400" : "text-accent"}`}>
                      {e.username}
                    </span>{" "}
                    <span className={e.type === "accepted" ? "text-emerald-400" : e.type === "system" ? "text-amber-400" : "text-red-400"}>
                      {e.type === "accepted" ? "✓" : e.type === "system" ? "⚡" : "✗"} {e.message}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* CENTER: Problem */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex border-b border-white/8 bg-bg-surface/20 shrink-0">
            {(["problem", "submissions"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                activeTab === tab
                  ? "text-text-primary border-b-2 border-primary bg-bg-surface/40"
                  : "text-text-muted hover:text-text-secondary"
              }`}>
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "problem" && problem ? (
              <>
                <div className="flex items-start gap-3 mb-4 flex-wrap">
                  <h2 className="text-xl font-bold text-text-primary flex-1">{problem.title}</h2>
                  <div className="flex gap-2">
                    <span className={`badge border text-xs px-2.5 py-1 capitalize ${DIFFICULTY_STYLE[problem.difficulty] ?? ""}`}>{problem.difficulty}</span>
                    <span className="badge bg-primary/15 text-primary border-primary/30 text-xs px-2.5 py-1">{problem.points} pts</span>
                  </div>
                </div>
                <p className="text-text-secondary text-sm leading-relaxed mb-6 whitespace-pre-wrap">{problem.description}</p>
                {problem.examples.map((ex, i) => (
                  <div key={i} className="mb-4 glass-card p-4 rounded-xl">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Example {i + 1}</p>
                    <p className="text-sm text-text-muted">Input: <span className="font-mono text-text-primary">{ex.input}</span></p>
                    <p className="text-sm text-text-muted">Output: <span className="font-mono text-text-primary">{ex.output}</span></p>
                    {ex.explanation && <p className="text-sm text-text-muted mt-1">Explanation: {ex.explanation}</p>}
                  </div>
                ))}
                {problem.hiddenCount > 0 && (
                  <div className="glass-card p-4 rounded-xl border-amber-500/20">
                    <p className="text-xs font-bold text-amber-400">+ {problem.hiddenCount} hidden test cases</p>
                  </div>
                )}
              </>
            ) : activeTab === "submissions" ? (
              <div>
                <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Submission History</p>
                {submissionHistory.length === 0 ? (
                  <p className="text-sm text-text-muted italic">No submissions yet</p>
                ) : (
                  <div className="space-y-2">
                    {submissionHistory.map((s, i) => {
                      const v = VERDICT_STYLE[s.verdict] ?? { label: s.verdict, color: "text-text-muted", icon: "?" };
                      return (
                        <div key={i} className="flex items-center justify-between px-4 py-3 glass-card rounded-xl">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${v.color}`}>{v.icon}</span>
                            <span className={`font-semibold text-sm ${v.color}`}>{v.label}</span>
                          </div>
                          <div className="flex gap-3 text-xs text-text-muted">
                            <span>{s.language}</span>
                            <span>{new Date(s.timestamp).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-text-muted italic text-sm">Loading problem…</p>
            )}
          </div>

          {/* Run Results */}
          {runResults.length > 0 && (
            <div className="shrink-0 border-t border-white/8 p-4 bg-bg-surface/20 max-h-48 overflow-y-auto">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Run Results</p>
              <div className="space-y-2">
                {runResults.map((r, i) => (
                  <div key={i} className={`glass-card p-3 rounded-xl border text-xs font-mono ${r.passed ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}>
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

        {/* RIGHT: Editor + Your Status */}
        <div className="flex-1 flex flex-col border-l border-white/8 overflow-hidden min-w-0">
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
            />
          </div>

          {/* Your Status */}
          <div className="shrink-0 border-t border-white/8 p-3 bg-bg-surface/40">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Your Status</p>
            <div className="flex items-center gap-3 flex-wrap">
              <div className={`px-3 py-1.5 rounded-lg font-black text-sm shrink-0 border ${
                myPlayer?.team === "alpha" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-orange-500/20 text-orange-400 border-orange-500/30"
              }`}>
                {myPlayer?.team?.toUpperCase() ?? "—"}
              </div>
              {[
                { label: "Score", value: `${myPlayer?.score ?? 0} pts` },
                { label: "Solved", value: `${myPlayer?.solved ?? 0} / ${totalRounds}` },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-text-primary font-black text-base">{stat.value}</p>
                  <p className="text-[10px] text-text-muted uppercase">{stat.label}</p>
                </div>
              ))}
              {lastVerdict && (
                <div className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg border animate-fade-in ${
                  lastVerdict === "accepted" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"
                }`}>
                  {VERDICT_STYLE[lastVerdict]?.icon} {VERDICT_STYLE[lastVerdict]?.label ?? lastVerdict}
                  {lastVerdict === "accepted" && lastEarned > 0 && <span className="ml-1 text-emerald-300">+{lastEarned}</span>}
                </div>
              )}
            </div>
            {lastVerdict && lastVerdict !== "accepted" && lastVerdictDetails && (
              <div className="mt-2 px-3 py-2 bg-red-500/5 border border-red-500/20 rounded-lg">
                <p className="text-[11px] font-mono text-red-300 whitespace-pre-wrap">{lastVerdictDetails.slice(0, 300)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
