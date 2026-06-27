import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuizTeams } from "../hooks/useQuizTeams";
import { useRoomStore } from "../store/room.store";
import { useAuthStore } from "../store/auth.store";

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

export default function QuizTeamsPage() {
  const navigate       = useNavigate();
  const quizTeamsRoomId = useRoomStore((s) => s.quizTeamsRoomId);
  const user           = useAuthStore((s) => s.user);

  const {
    questions, questionIndex, selectedOption, phase,
    roundEndsAt, roundDuration, phaseStartsAt,
    teamAlphaScore, teamBetaScore, players, activityFeed,
    connected, submitAnswer, leaveRoom,
  } = useQuizTeams();

  // Redirect if navigated to page without a room
  useEffect(() => { if (!quizTeamsRoomId) navigate("/home", { replace: true }); }, [quizTeamsRoomId]);

  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    if (phase !== "playing") return;
    const tick = () => setTimeLeft(Math.max(0, Math.ceil((roundEndsAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [phase, roundEndsAt]);

  const alphaPlayers = useMemo(() => Object.values(players).filter((p) => p.team === "alpha").sort((a, b) => b.score - a.score), [players]);
  const betaPlayers  = useMemo(() => Object.values(players).filter((p) => p.team === "beta").sort((a, b) => b.score - a.score),  [players]);
  // myPlayer keyed by session ID — use first entry that matches our username since we don't store sessionId in client
  const myPlayer = useMemo(() => Object.values(players).find((p) => p.username === user?.username), [players, user]);

  const isUrgent = timeLeft <= 5 && timeLeft > 0 && phase === "playing";
  const timerPct = roundDuration > 0 ? (timeLeft / roundDuration) * 100 : 0;

  // Force re-render every 250ms during countdown so the countdown number animates
  const [, setTick] = useState(0);
  useEffect(() => {
    if (phase !== "countdown") return;
    const id = setInterval(() => setTick((n) => n + 1), 250);
    return () => clearInterval(id);
  }, [phase]);

  const currentQuestion = questions[questionIndex];
  const hasAnswered      = selectedOption !== -1;

  // ── Countdown ─────────────────────────────────────────────────────────────
  if (phase === "countdown") {
    const secs = Math.max(0, Math.ceil((phaseStartsAt - Date.now()) / 1000));
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <div className="glass-card-solid p-12 text-center max-w-md w-full mx-4 animate-slide-up">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 mx-auto mb-6 flex items-center justify-center">
            <span className="text-4xl">🧠⚔️</span>
          </div>
          <h1 className="text-3xl font-extrabold text-text-primary mb-2">Quiz Teams</h1>
          <p className="text-text-secondary mb-8">Alpha vs Beta — answer fast!</p>
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
  if (phase === "finished") {
    const winner = teamAlphaScore > teamBetaScore ? "alpha" : teamBetaScore > teamAlphaScore ? "beta" : "tie";
    const allPlayers = [...alphaPlayers, ...betaPlayers].sort((a, b) => b.score - a.score);
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
              { label: "TEAM ALPHA", score: teamAlphaScore, color: "emerald", team: "alpha" },
              { label: "TEAM BETA",  score: teamBetaScore,  color: "orange",  team: "beta" },
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

          {/* Player leaderboard */}
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Player Scores</p>
          <div className="space-y-2 mb-6">
            {allPlayers.map((p, i) => (
              <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border ${
                p.team === "alpha" ? "border-emerald-500/20 bg-emerald-500/5" : "border-orange-500/20 bg-orange-500/5"
              }`}>
                <span className="text-sm text-text-muted w-5 text-center">{i + 1}</span>
                <span className={`w-2 h-2 rounded-full shrink-0 ${p.team === "alpha" ? "bg-emerald-400" : "bg-orange-400"}`} />
                <span className="flex-1 font-semibold text-text-primary text-sm truncate">{p.username}</span>
                <span className="text-xs text-text-muted">streak {p.streak}🔥</span>
                <span className="font-bold text-text-primary">{p.score}</span>
              </div>
            ))}
          </div>
          <button onClick={leaveRoom} className="btn-primary w-full">Back to Home</button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  // ── Main Game ─────────────────────────────────────────────────────────────
  const labels = ["A", "B", "C", "D"];

  return (
    <div className="min-h-screen flex flex-col bg-bg-base overflow-hidden" style={{ height: "100vh" }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-4 py-2.5 border-b border-white/8 bg-bg-surface/80 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-lg">🧠⚔️</span>
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest leading-none">QUIZ TEAMS</p>
            <p className="text-text-secondary text-xs font-medium">Question {questionIndex + 1} / {questions.length}</p>
          </div>
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-black text-xl ${
          isUrgent ? "border-red-500/50 bg-red-500/10 text-red-400 animate-pulse"
          : timeLeft <= 10 ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
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

      {/* 3-column layout — mirrors TeamsPage exactly */}
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
                    p.answered ? (p.lastAnswerCorrect ? "text-emerald-400" : "text-red-400") : "text-text-muted"
                  }`}>
                    {p.answered ? (p.lastAnswerCorrect ? "✓" : "✗") : "●"}
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
                    p.answered ? (p.lastAnswerCorrect ? "text-emerald-400" : "text-red-400") : "text-text-muted"
                  }`}>
                    {p.answered ? (p.lastAnswerCorrect ? "✓" : "✗") : "●"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Events */}
          <div className="p-3 flex-1 overflow-y-auto">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Live Activity</p>
            {activityFeed.length === 0 ? (
              <p className="text-[11px] text-text-muted italic">Waiting…</p>
            ) : (
              <div className="space-y-1.5">
                {activityFeed.map((e) => (
                  <div key={e.id} className="text-[11px] leading-tight">
                    <span className="font-bold text-text-primary">{e.username}</span>{" "}
                    <span className={e.correct ? "text-emerald-400" : "text-red-400"}>
                      {e.correct ? "✓" : "✗"} {e.correct ? `+${e.points} pts` : "missed"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* CENTER: Question + Explanation — mirrors "Problem" panel */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Tab bar to match TeamsPage */}
          <div className="flex border-b border-white/8 bg-bg-surface/20 shrink-0">
            <div className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-text-primary border-b-2 border-primary bg-bg-surface/40">
              Question
            </div>
            <div className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-text-muted">
              {questionIndex + 1} / {questions.length}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* Question header */}
            <div className="flex items-start gap-3 mb-4 flex-wrap">
              <h2 className="text-xl font-bold text-text-primary flex-1 leading-relaxed">{currentQuestion.text}</h2>
              <div className="flex gap-2 flex-wrap shrink-0">
                <span className={`badge border text-xs px-2.5 py-1 capitalize ${DIFFICULTY_STYLE[currentQuestion.difficulty] ?? ""}`}>
                  {currentQuestion.difficulty}
                </span>
                <span className="badge bg-primary/15 text-primary border-primary/30 text-xs px-2.5 py-1">
                  {currentQuestion.points} pts
                </span>
                <span className="badge border border-white/10 text-text-muted text-xs px-2.5 py-1">
                  {currentQuestion.category}
                </span>
              </div>
            </div>

            {/* Explanation after answering */}
            {hasAnswered && currentQuestion.explanation && (
              <div className="mt-6 glass-card p-4 rounded-xl border-accent/20 animate-fade-in">
                <p className="text-xs font-bold text-accent uppercase tracking-wider mb-2">Explanation</p>
                <p className="text-sm text-text-secondary leading-relaxed">{currentQuestion.explanation}</p>
              </div>
            )}

            {/* Waiting message when answered */}
            {hasAnswered && (
              <div className="mt-4 text-center py-6 text-text-muted text-sm">
                Waiting for other players to answer…
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: MCQ Options + Your Status — mirrors Editor panel */}
        <div className="flex-1 flex flex-col border-l border-white/8 overflow-hidden min-w-0">
          {/* Options header */}
          <div className="flex border-b border-white/8 bg-bg-surface/20 shrink-0 items-center px-4 py-2 gap-3">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Select Answer</p>
            {hasAnswered && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
                currentQuestion.correctIndex === selectedOption
                  ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                  : "border-red-500/40 text-red-400 bg-red-500/10"
              }`}>
                {currentQuestion.correctIndex === selectedOption ? "✓ Correct!" : "✗ Wrong"}
              </span>
            )}
          </div>

          {/* Option buttons */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {currentQuestion.options.map((opt, i) => {
              const isSelected   = selectedOption === i;
              const isCorrect    = i === currentQuestion.correctIndex;
              const showCorrect  = hasAnswered && isCorrect;
              const showWrong    = hasAnswered && isSelected && !isCorrect;

              let borderClass = "border-white/10 bg-bg-surface/40 text-text-secondary hover:border-white/30 hover:bg-white/5 cursor-pointer";
              if (showCorrect) borderClass = "border-emerald-500 bg-emerald-500/20 text-emerald-400 cursor-default";
              else if (showWrong) borderClass = "border-red-500 bg-red-500/20 text-red-400 cursor-default";
              else if (isSelected) borderClass = "border-accent bg-accent/20 text-accent cursor-default";
              else if (hasAnswered) borderClass = "border-white/5 bg-bg-surface/20 text-text-muted opacity-40 grayscale cursor-default";

              return (
                <button
                  key={i}
                  onClick={() => !hasAnswered && submitAnswer(i)}
                  disabled={hasAnswered}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex items-center gap-3 group ${borderClass}`}
                >
                  <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-sm font-black border transition-colors ${
                    showCorrect ? "bg-emerald-500/30 border-emerald-500/50 text-emerald-400"
                    : showWrong ? "bg-red-500/30 border-red-500/50 text-red-400"
                    : isSelected ? "bg-accent/30 border-accent/50 text-accent"
                    : "bg-white/5 border-white/10 group-hover:bg-white/10"
                  }`}>
                    {labels[i]}
                  </div>
                  <span className="flex-1 text-sm font-medium leading-snug">{opt}</span>
                  {showCorrect && (
                    <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {showWrong && (
                    <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          {/* Your Status — mirrors the status bar in TeamsPage */}
          <div className="shrink-0 border-t border-white/8 p-3 bg-bg-surface/40">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Your Status</p>
            <div className="flex items-center gap-3 flex-wrap">
              <div className={`px-3 py-1.5 rounded-lg font-black text-sm shrink-0 border ${
                myPlayer?.team === "alpha" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-orange-500/20 text-orange-400 border-orange-500/30"
              }`}>
                {myPlayer?.team?.toUpperCase() ?? "—"}
              </div>
              {[
                { label: "Score",  value: `${myPlayer?.score ?? 0} pts`  },
                { label: "Streak", value: `${myPlayer?.streak ?? 0}🔥`   },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-text-primary font-black text-base">{stat.value}</p>
                  <p className="text-[10px] text-text-muted uppercase">{stat.label}</p>
                </div>
              ))}
              {hasAnswered && (
                <div className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg border animate-fade-in ${
                  currentQuestion.correctIndex === selectedOption
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : "bg-red-500/20 text-red-400 border-red-500/30"
                }`}>
                  {currentQuestion.correctIndex === selectedOption ? "✓ Correct" : "✗ Wrong"}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
