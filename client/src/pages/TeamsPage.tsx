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
  accepted:            { label: "Accepted",         color: "text-emerald-400", icon: "✓" },
  wrong_answer:        { label: "Wrong Answer",      color: "text-red-400",     icon: "✗" },
  runtime_error:       { label: "Runtime Error",     color: "text-orange-400",  icon: "!" },
  time_limit_exceeded: { label: "Time Limit",        color: "text-amber-400",   icon: "⏱" },
  error:               { label: "Service Error",     color: "text-orange-400",  icon: "⚠" },
  already_accepted:    { label: "Already Solved",    color: "text-emerald-400", icon: "✓" },
  not_active:          { label: "Round Not Active",  color: "text-gray-400",    icon: "—" },
};

const DIFFICULTY_STYLE: Record<string, string> = {
  easy:   "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  hard:   "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function TeamsPage() {
  const navigate    = useNavigate();
  const teamsRoomId = useRoomStore((s) => s.teamsRoomId);
  const user        = useAuthStore((s) => s.user);
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

  const isUrgent = timeLeft <= 60 && timeLeft > 0;
  const timerPct = roundDuration > 0 ? (timeLeft / roundDuration) * 100 : 0;
  const alphaLeading = teamAlphaScore >= teamBetaScore;

  // ── Countdown ────────────────────────────────────────────────────────────
  if (phase === "countdown") {
    const secs = Math.max(0, Math.ceil((phaseStartsAt - Date.now()) / 1000));
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#010103]">
        <div className="absolute inset-0 bg-gradient-to-b from-teal-900/20 to-transparent pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-600/10 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 text-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-600 mx-auto mb-8 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.4)]">
            <span className="text-5xl">⚔️</span>
          </div>
          <h1 className="text-5xl font-black text-white mb-3 tracking-wider">TEAMS MODE</h1>
          <p className="text-gray-400 mb-10 font-medium">Alpha vs Beta — get ready!</p>
          <div className="text-[120px] font-black leading-none mb-10 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500">
            {secs > 0 ? secs : "GO!"}
          </div>
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <p className="text-emerald-400 font-black text-xl">{alphaPlayers.length}</p>
              <p className="text-xs text-gray-500">Team Alpha</p>
            </div>
            <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-center">
              <p className="text-orange-400 font-black text-xl">{betaPlayers.length}</p>
              <p className="text-xs text-gray-500">Team Beta</p>
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
      <div className="min-h-screen flex items-center justify-center bg-[#010103] px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 w-full max-w-xl">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">
              {winner === "tie" ? "🤝" : "🏆"}
            </div>
            <h1 className="text-4xl font-black text-white mb-2">
              {winner === "tie" ? "It's a Tie!" : winner === "alpha" ? "Team Alpha Wins!" : "Team Beta Wins!"}
            </h1>
            <p className="text-gray-400">Final Scores</p>
          </div>
          
          <div className="rounded-3xl border border-white/10 bg-[#12121a] p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: "TEAM ALPHA", score: finalResult.teamAlphaScore, color: "emerald", team: "alpha" },
                { label: "TEAM BETA",  score: finalResult.teamBetaScore,  color: "orange",  team: "beta" },
              ].map(({ label, score, color, team }) => (
                <div key={team} className={`p-5 rounded-2xl text-center border ${
                  winner === team
                    ? `border-${color}-500/60 bg-${color}-500/10 shadow-lg`
                    : "border-white/10 bg-white/5"
                }`}>
                  <p className={`text-xs font-black text-${color}-400 mb-2 uppercase tracking-widest`}>{label}</p>
                  <p className={`text-4xl font-black text-${color}-400`}>{score.toLocaleString()}</p>
                  {winner === team && <p className="text-xs mt-2 text-amber-400 font-bold">👑 Winner</p>}
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {finalResult.leaderboard?.slice(0, 8).map((entry: any, i: number) => (
                <div key={entry.id} className={`flex items-center gap-3 p-3 rounded-xl border ${
                  entry.team === "alpha" ? "border-emerald-500/20 bg-emerald-500/5" : "border-orange-500/20 bg-orange-500/5"
                }`}>
                  <span className="text-sm text-gray-500 w-5 text-center">{i + 1}</span>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${entry.team === "alpha" ? "bg-emerald-400" : "bg-orange-400"}`} />
                  <span className="flex-1 font-semibold text-white text-sm truncate">{entry.username}</span>
                  <span className="text-xs text-gray-500">{entry.solved} solved</span>
                  <span className="font-black text-white">{entry.score}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={leaveRoom}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base shadow-lg transition-all active:scale-[0.98]"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ── Main Game ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-[#010103] overflow-hidden" style={{ height: "100vh" }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-[#010103]/90 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
            <span className="text-base">⚔️</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">TEAMS MODE</p>
            <p className="text-emerald-400 text-xs font-semibold">Round {roundNumber} / {totalRounds}</p>
          </div>
        </div>

        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-black text-xl ${
          isUrgent ? "border-red-500/50 bg-red-500/10 text-red-400 animate-pulse"
          : timeLeft <= 300 ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
          : "border-cyan-500/30 bg-cyan-500/5 text-cyan-400"
        }`}>
          <span className="text-xs font-bold tracking-widest">ENDS IN</span>
          <span className="tabular-nums text-2xl">{formatTime(timeLeft)}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-xs font-medium ${connected ? "text-emerald-400" : "text-red-400"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
            {connected ? "Live" : "Offline"}
          </div>
          <button
            onClick={leaveRoom}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-colors"
          >
            Leave
          </button>
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
      <div className="flex items-stretch border-b border-white/5 bg-[#0d0d14] shrink-0">
        <div className={`flex-1 flex items-center justify-center gap-3 py-3 transition-colors ${alphaLeading ? "bg-emerald-500/10" : ""}`}>
          <div className="text-center">
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">TEAM ALPHA</p>
            <p className="text-3xl font-black text-emerald-400">{teamAlphaScore.toLocaleString()}</p>
          </div>
          {alphaLeading && teamAlphaScore > teamBetaScore && (
            <span className="text-amber-400 text-lg">👑</span>
          )}
        </div>
        <div className="flex items-center px-8 border-x border-white/5">
          <span className="text-3xl font-black text-gray-700">VS</span>
        </div>
        <div className={`flex-1 flex items-center justify-center gap-3 py-3 transition-colors ${!alphaLeading ? "bg-orange-500/10" : ""}`}>
          {!alphaLeading && teamBetaScore > teamAlphaScore && (
            <span className="text-amber-400 text-lg">👑</span>
          )}
          <div className="text-center">
            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">TEAM BETA</p>
            <p className="text-3xl font-black text-orange-400">{teamBetaScore.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* LEFT: Players + Activity */}
        <aside className="w-56 xl:w-64 shrink-0 flex flex-col border-r border-white/5 bg-[#0d0d14] overflow-y-auto">
          
          {/* Alpha */}
          <div className="p-4 border-b border-white/5">
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3">👥 Team Alpha</p>
            <div className="space-y-1">
              {alphaPlayers.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2 py-1">
                  <span className="text-[10px] text-gray-600 w-3 text-right">{i + 1}</span>
                  <span className="flex-1 text-xs font-medium truncate text-white">
                    {p.username}{p.username === user?.username && <span className="text-emerald-400 ml-1">(You)</span>}
                  </span>
                  <span className="text-xs font-bold text-gray-400">{p.score}</span>
                  <span className={`text-[10px] w-4 text-center ${
                    p.submissionStatus === "accepted" ? "text-emerald-400" :
                    p.submissionStatus && p.submissionStatus !== "" ? "text-red-400" : "text-gray-600"
                  }`}>
                    {p.submissionStatus === "accepted" ? "✓" : p.submissionStatus && p.submissionStatus !== "" ? "✗" : "●"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Beta */}
          <div className="p-4 border-b border-white/5">
            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-3">👥 Team Beta</p>
            <div className="space-y-1">
              {betaPlayers.map((p, i) => (
                <div key={p.id} className="flex items-center gap-2 py-1">
                  <span className="text-[10px] text-gray-600 w-3 text-right">{i + 1}</span>
                  <span className="flex-1 text-xs font-medium truncate text-white">
                    {p.username}{p.username === user?.username && <span className="text-orange-400 ml-1">(You)</span>}
                  </span>
                  <span className="text-xs font-bold text-gray-400">{p.score}</span>
                  <span className={`text-[10px] w-4 text-center ${
                    p.submissionStatus === "accepted" ? "text-emerald-400" :
                    p.submissionStatus && p.submissionStatus !== "" ? "text-red-400" : "text-gray-600"
                  }`}>
                    {p.submissionStatus === "accepted" ? "✓" : p.submissionStatus && p.submissionStatus !== "" ? "✗" : "●"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Events */}
          <div className="p-4 flex-1 overflow-y-auto">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Live Activity</p>
            {liveEvents.length === 0 ? (
              <p className="text-[11px] text-gray-600 italic">Waiting…</p>
            ) : (
              <div className="space-y-2">
                {liveEvents.map((e) => (
                  <div key={e.id} className="text-[11px] leading-snug">
                    <span className={`font-bold ${e.team === "alpha" ? "text-emerald-400" : e.team === "beta" ? "text-orange-400" : "text-cyan-400"}`}>
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
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 bg-[#010103]">
          <div className="flex border-b border-white/5 bg-[#0d0d14] shrink-0">
            {(["problem", "submissions"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {activeTab === "problem" && problem ? (
              <>
                <div className="flex items-start gap-3 mb-5 flex-wrap">
                  <h2 className="text-xl font-black text-white flex-1">{problem.title}</h2>
                  <div className="flex gap-2">
                    <span className={`px-2.5 py-0.5 rounded-lg border text-xs font-bold capitalize ${DIFFICULTY_STYLE[problem.difficulty] ?? ""}`}>{problem.difficulty}</span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold">{problem.points} pts</span>
                  </div>
                </div>
                {/* Tags & Companies */}
                <div className="flex flex-wrap gap-1.5 mb-5 mt-2">
                  {problem.tags?.map((tag: string) => (
                    <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-gray-500 border border-white/5">{tag}</span>
                  ))}
                  {problem.companies?.map((company: string) => (
                    <span key={company} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500/70 border border-amber-500/20">{company}</span>
                  ))}
                </div>

                <p className="text-gray-300 text-sm leading-relaxed mb-6 whitespace-pre-wrap">{problem.description}</p>
                
                {problem.examples.map((ex: any, i: number) => (
                  <div key={i} className="mb-4 rounded-2xl border border-white/5 bg-[#0d0d14] p-4">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Example {i + 1}</p>
                    <div className="space-y-2 text-sm font-mono text-gray-500">
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

                {/* Constraints & Complexity */}
                <div className="space-y-3 mb-5 mt-4">
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
                  <div className="space-y-2 mb-4">
                    <p className="text-xs font-bold text-gray-500 mb-2">Hints</p>
                    {problem.hints.map((hint: string, i: number) => (
                      <div key={i} className="rounded-xl border border-white/5 bg-[#0d0d14] p-3 text-xs text-gray-400">
                        <span className="font-bold text-gray-500 mr-2">#{i + 1}</span> {hint}
                      </div>
                    ))}
                  </div>
                )}
                {problem.hiddenCount > 0 && (
                  <p className="text-xs text-gray-600 italic">+ {problem.hiddenCount} hidden test cases</p>
                )}
              </>
            ) : activeTab === "submissions" ? (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Submission History</p>
                {submissionHistory.length === 0 ? (
                  <p className="text-sm text-gray-600 italic">No submissions yet</p>
                ) : (
                  <div className="space-y-2">
                    {submissionHistory.map((s: any, i: number) => {
                      const v = VERDICT_STYLE[s.verdict] ?? { label: s.verdict, color: "text-gray-500", icon: "?" };
                      return (
                        <div key={i} className="flex items-center justify-between px-4 py-3 rounded-2xl border border-white/5 bg-[#0d0d14]">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${v.color}`}>{v.icon}</span>
                            <span className={`font-semibold text-sm ${v.color}`}>{v.label}</span>
                          </div>
                          <div className="flex gap-3 text-xs text-gray-500">
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
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
              </div>
            )}
          </div>

          {/* Run Results */}
          {runResults.length > 0 && (
            <div className="shrink-0 border-t border-white/5 p-4 bg-[#0d0d14] max-h-48 overflow-y-auto">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Run Results</p>
              <div className="space-y-2">
                {runResults.map((r: any, i: number) => (
                  <div key={i} className={`rounded-2xl border p-3 text-xs font-mono ${r.passed ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5"}`}>
                    <span className={`font-bold ${r.passed ? "text-emerald-400" : "text-red-400"}`}>
                      {r.passed ? "✓ Passed" : "✗ Failed"} — Case {i + 1}
                    </span>
                    <p className="mt-1 text-gray-500">Input: <span className="text-white">{r.input}</span></p>
                    <p className="text-gray-500">Expected: <span className="text-emerald-400">{r.expectedOutput}</span></p>
                    <p className="text-gray-500">Got: <span className={r.passed ? "text-white" : "text-red-400"}>{r.actualOutput || "(empty)"}</span></p>
                    {r.stderr && <p className="text-orange-400 mt-1 whitespace-pre-wrap">{r.stderr.slice(0, 200)}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Editor + Your Status */}
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
            />
          </div>

          {/* Your Status */}
          <div className="shrink-0 border-t border-white/5 p-4 bg-[#0d0d14]">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Your Status</p>
            <div className="flex items-center gap-4 flex-wrap">
              <div className={`px-3 py-1.5 rounded-xl font-black text-sm shrink-0 border ${
                myPlayer?.team === "alpha"
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  : "bg-orange-500/20 text-orange-400 border-orange-500/30"
              }`}>
                {myPlayer?.team?.toUpperCase() ?? "—"}
              </div>

              {[
                { label: "Score",  value: `${myPlayer?.score ?? 0}` },
                { label: "Solved", value: `${myPlayer?.solved ?? 0} / ${totalRounds}` },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-white font-black text-xl">{stat.value}</p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">{stat.label}</p>
                </div>
              ))}

              {lastVerdict && (
                <div className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl border ${
                  lastVerdict === "accepted"
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : "bg-red-500/20 text-red-400 border-red-500/30"
                }`}>
                  {VERDICT_STYLE[lastVerdict]?.icon} {VERDICT_STYLE[lastVerdict]?.label ?? lastVerdict}
                  {lastVerdict === "accepted" && lastEarned > 0 && (
                    <span className="ml-1 text-emerald-300">+{lastEarned}</span>
                  )}
                </div>
              )}
            </div>
            {lastVerdict && lastVerdict !== "accepted" && lastVerdictDetails && (
              <div className="mt-3 px-3 py-2 bg-red-500/5 border border-red-500/20 rounded-xl">
                <p className="text-[11px] font-mono text-red-300 whitespace-pre-wrap">{lastVerdictDetails.slice(0, 300)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
