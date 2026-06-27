import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuiz } from "../hooks/useQuiz";
import { useRoomStore } from "../store/room.store";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(secs: number) {
  const m = Math.floor(secs / 60)
    .toString()
    .padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const OPTION_LETTERS = ["A", "B", "C", "D"];

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: "text-emerald-400",
  medium: "text-amber-400",
  hard: "text-red-400",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function OptionButton({
  letter,
  text,
  index,
  selectedOption,
  correctIndex,
  onSelect,
  disabled,
}: {
  letter: string;
  text: string;
  index: number;
  selectedOption: number;
  correctIndex: number;
  onSelect: (i: number) => void;
  disabled: boolean;
}) {
  const hasAnswered = selectedOption !== -1;
  const isSelected = selectedOption === index;
  const isCorrect = index === correctIndex;

  let containerClass =
    "group flex items-center gap-4 w-full p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer ";
  let letterClass =
    "w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 transition-colors ";

  if (!hasAnswered) {
    containerClass +=
      "border-white/10 bg-white/[0.03] hover:border-primary/50 hover:bg-primary/10";
    letterClass += "bg-white/10 text-text-secondary group-hover:bg-primary/30 group-hover:text-white";
  } else if (isSelected && isCorrect) {
    // Selected and correct
    containerClass += "border-emerald-500/60 bg-emerald-500/10";
    letterClass += "bg-emerald-500 text-white";
  } else if (isSelected && !isCorrect) {
    // Selected but wrong
    containerClass += "border-red-500/60 bg-red-500/10";
    letterClass += "bg-red-500 text-white";
  } else if (!isSelected && isCorrect && hasAnswered) {
    // The correct answer (user got it wrong)
    containerClass += "border-emerald-500/40 bg-emerald-500/5";
    letterClass += "bg-emerald-500/30 text-emerald-400";
  } else {
    // Other options after answering
    containerClass += "border-white/5 bg-white/[0.02] opacity-50";
    letterClass += "bg-white/5 text-text-muted";
  }

  return (
    <button
      onClick={() => !disabled && onSelect(index)}
      disabled={disabled || hasAnswered}
      className={containerClass}
      id={`option-${index}`}
    >
      <span className={letterClass}>{letter}</span>
      <span className="text-text-primary font-medium text-sm sm:text-base flex-1">{text}</span>
      {hasAnswered && isSelected && (
        <span className="shrink-0">
          {isCorrect ? (
            <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          )}
        </span>
      )}
      {hasAnswered && !isSelected && isCorrect && (
        <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
}

// ── Main QuizPage ─────────────────────────────────────────────────────────────

export default function QuizPage() {
  const navigate = useNavigate();
  const quizRoomId = useRoomStore((s) => s.quizRoomId);

  const {
    questions,
    questionIndex,
    selectedOption,
    phase,
    leaderboard,
    activityFeed,
    roundEndsAt,
    phaseStartsAt,
    roundDuration,
    connected,
    finalLeaderboard,
    myEntry,
    submitAnswer,
    resetSelectedOption,
    leaveQuiz,
  } = useQuiz();

  // Redirect to home if there's no quiz room to join
  useEffect(() => {
    if (!quizRoomId) {
      navigate("/home", { replace: true });
    }
  }, [quizRoomId, navigate]);

  // ── Local countdown timer ────────────────────────────────────────
  const [timeLeft, setTimeLeft] = useState(0);
  const [countdownLeft, setCountdownLeft] = useState(0);
  // Post-answer optimistic countdown and local index
  const [postCountdown, setPostCountdown] = useState(0);
  const [localIndex, setLocalIndex] = useState<number | null>(null);

  useEffect(() => {
    if (phase !== "question") return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((roundEndsAt - Date.now()) / 1000));
      setTimeLeft(remaining);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [phase, roundEndsAt]);

  useEffect(() => {
    if (phase !== "countdown") return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((phaseStartsAt - Date.now()) / 1000));
      setCountdownLeft(remaining);
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [phase, phaseStartsAt]);

  // Sync local optimistic index when server advances
  useEffect(() => {
    setLocalIndex(null);
  }, [questionIndex]);

  // Start a post-answer countdown to optimistically advance to next question
  useEffect(() => {
    if (selectedOption === -1) return;
    if (postCountdown > 0) return;

    let remaining = 5;
    setPostCountdown(remaining);
    const id = setInterval(() => {
      remaining -= 1;
      setPostCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(id);
        const next = Math.min(questionIndex + 1, Math.max(0, questions.length - 1));
        setLocalIndex(next);
        resetSelectedOption();
        setPostCountdown(0);
      }
    }, 1000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOption]);

  // ── Stats ────────────────────────────────────────────────────────
  const answeredCount = useMemo(
    () => leaderboard.filter((e) => e.answered).length,
    [leaderboard]
  );
  const correctCount = useMemo(
    () => leaderboard.filter((e) => e.answered && e.lastAnswerCorrect).length,
    [leaderboard]
  );

  const timerPct = roundDuration > 0 ? (timeLeft / roundDuration) * 100 : 0;
  const timerColor =
    timeLeft > 15
      ? "text-amber-400"
      : timeLeft > 5
      ? "text-orange-400"
      : "text-red-400 animate-pulse";

  // ── Waiting / Countdown ───────────────────────────────────────────
  if (phase === "waiting" || phase === "countdown") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-bg-base">
        <div className="glass-card-solid p-12 text-center max-w-md w-full mx-4 animate-slide-up">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-accent mx-auto mb-6 flex items-center justify-center shadow-glow">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-text-primary mb-2">Quiz Starting</h1>
          <p className="text-text-secondary mb-8">Get ready! The quiz begins in…</p>
          <div className="text-7xl font-black text-gradient mb-8">
            {countdownLeft > 0 ? countdownLeft : "…"}
          </div>
          <div className="flex items-center justify-center gap-2 text-text-muted text-sm">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            {leaderboard.length} player{leaderboard.length !== 1 ? "s" : ""} connected
          </div>
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
            Quiz Over! 🎉
          </h1>
          <p className="text-text-secondary text-center mb-8">Final Leaderboard</p>
          <div className="space-y-3 mb-8">
            {(finalLeaderboard.length > 0 ? finalLeaderboard : leaderboard).map((entry, i) => {
              const icons = ["🥇", "🥈", "🥉"];
              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border ${
                    i === 0
                      ? "border-amber-500/40 bg-amber-500/10"
                      : "border-white/8 bg-white/[0.03]"
                  }`}
                >
                  <span className="text-2xl w-8 text-center">
                    {i < 3 ? icons[i] : `#${i + 1}`}
                  </span>
                  <span className="flex-1 font-semibold text-text-primary">{entry.username}</span>
                  <span className="font-bold text-lg text-primary">{entry.score}</span>
                </div>
              );
            })}
          </div>
          <button
            id="back-home-btn"
            onClick={leaveQuiz}
            className="btn-primary w-full"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const displayIndex = localIndex ?? questionIndex;
  const currentQuestion = questions[displayIndex] ?? null;

  if (!currentQuestion) return null;

  const hasAnswered = selectedOption !== -1;

  return (
    <div className="min-h-screen flex flex-col bg-bg-base overflow-hidden relative">

      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-4 py-3 border-b border-white/8 bg-bg-surface/80 backdrop-blur shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow shrink-0">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
          </div>
          <div className="hidden sm:block">
            <p className="text-[10px] text-text-muted font-semibold uppercase tracking-widest leading-none">
              QUIZ ROUND
            </p>
            <p className="text-text-secondary text-xs font-medium">
              Question {displayIndex + 1} / {questions.length}
            </p>
          </div>
        </div>

        {/* Timer pill */}
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-black text-xl
            ${
              timeLeft > 15
                ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                : timeLeft > 5
                ? "border-orange-500/40 bg-orange-500/10 text-orange-400"
                : "border-red-500/40 bg-red-500/10 text-red-400 animate-pulse"
            }`}
        >
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="tabular-nums">{formatTime(timeLeft)}</span>
        </div>

        {/* Right nav items */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-text-muted text-xs">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            {leaderboard.length} Players
          </div>
          <div className={`hidden sm:flex items-center gap-1.5 text-xs ${connected ? "text-success" : "text-danger"}`}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
            {connected ? "Live" : "Offline"}
          </div>
          <button
            id="leave-quiz-btn"
            onClick={leaveQuiz}
            className="btn-danger text-xs px-3 py-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Leave Room</span>
          </button>
        </div>
      </nav>

      {postCountdown > 0 && (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div className="glass-card-solid p-8 text-center max-w-xs w-full">
            <div className="text-7xl font-black text-gradient">{postCountdown}</div>
            <div className="text-sm text-text-muted mt-2">Next question in…</div>
          </div>
        </div>
      )}

      {/* ── Timer progress bar ────────────────────────────────────────────── */}
      <div className="h-0.5 bg-white/5 shrink-0">
        <div
          className="h-full transition-all duration-1000 linear"
          style={{
            width: `${timerPct}%`,
            background:
              timeLeft > 15
                ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                : timeLeft > 5
                ? "linear-gradient(90deg, #f97316, #fb923c)"
                : "linear-gradient(90deg, #ef4444, #f87171)",
          }}
        />
      </div>

      {/* ── Main 3-column layout ──────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT: Scoreboard + Progress + Activity ────────────────── */}
        <aside className="w-56 xl:w-64 shrink-0 flex flex-col border-r border-white/8 bg-bg-surface/40 overflow-y-auto">

          {/* Scoreboard */}
          <div className="p-3 border-b border-white/8">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
              Scoreboard
            </p>
            <div className="space-y-1">
              {leaderboard.slice(0, 10).map((entry, i) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-2 py-1 px-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <span className="w-4 text-right text-xs font-bold text-text-muted shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-xs font-medium text-text-primary truncate">
                    {entry.username}
                    {i === 0 && <span className="ml-1">👑</span>}
                  </span>
                  <span className="text-xs font-bold text-text-secondary shrink-0">
                    {entry.score}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      entry.answered
                        ? entry.lastAnswerCorrect
                          ? "bg-emerald-400"
                          : "bg-red-400"
                        : "bg-white/20"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Round progress */}
          <div className="p-3 border-b border-white/8">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
              Round Progress
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {Array.from({ length: questions.length }).map((_, i) => (
                <div
                  key={i}
                  className={`w-6 h-2 rounded-full transition-all ${
                    i < displayIndex
                      ? "bg-primary"
                      : i === displayIndex
                      ? "bg-accent shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                      : "bg-white/10"
                  }`}
                />
              ))}
            </div>
            <p className="text-[10px] text-text-muted mt-1.5">
              {displayIndex + 1} / {questions.length}
            </p>
          </div>

          {/* Live Activity */}
          <div className="p-3 flex-1 overflow-y-auto">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
              Live Activity
            </p>
            {activityFeed.length === 0 ? (
              <p className="text-[11px] text-text-muted italic">No activity yet</p>
            ) : (
              <div className="space-y-1.5">
                {activityFeed.map((a) => (
                  <div key={a.id} className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-text-muted tabular-nums shrink-0">
                      {new Date(a.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-text-secondary truncate font-medium">
                      {a.username}
                    </span>
                    {a.correct ? (
                      <>
                        <svg className="w-3 h-3 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-emerald-400 font-bold shrink-0">
                          +{a.points}
                        </span>
                      </>
                    ) : (
                      <svg className="w-3 h-3 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* ── CENTER: Question ────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col p-4 lg:p-6 overflow-y-auto min-w-0">

          {/* Question header */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="text-xs font-bold text-text-muted uppercase tracking-widest">
              Question {displayIndex + 1}
            </span>
            <span className="badge bg-primary/20 text-primary border border-primary/30">
              {currentQuestion.points} pts
            </span>
            <span className="ml-auto flex items-center gap-1.5 text-xs text-text-muted">
              Difficulty:{" "}
              <span
                className={`font-semibold capitalize ${
                  DIFFICULTY_COLOR[currentQuestion.difficulty] ?? "text-text-muted"
                }`}
              >
                {currentQuestion.difficulty}
              </span>
            </span>
          </div>

          {/* Question text */}
          <div className="glass-card p-5 mb-5">
            <p className="text-lg sm:text-xl font-bold text-text-primary leading-relaxed">
              {currentQuestion.text}
            </p>
          </div>

          {/* Options */}
          <div className="grid gap-3 flex-1">
            {currentQuestion.options.map((opt, i) => (
              <OptionButton
                key={i}
                letter={OPTION_LETTERS[i]}
                text={opt}
                index={i}
                selectedOption={selectedOption}
                correctIndex={currentQuestion.correctIndex}
                onSelect={submitAnswer}
                disabled={phase !== "question" || postCountdown > 0}
              />
            ))}
          </div>

          {/* My score strip */}
          {myEntry && (
            <div className="mt-4 flex items-center justify-between px-4 py-2.5 rounded-xl border border-primary/20 bg-primary/5">
              <span className="text-xs text-text-secondary font-medium">Your Score</span>
              <span className="text-lg font-black text-primary">{myEntry.score}</span>
              {myEntry.streak >= 2 && (
                <span className="badge bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  🔥 ×{myEntry.streak}
                </span>
              )}
            </div>
          )}
        </main>

        {/* ── RIGHT: Stats + Answer + Explanation ────────────────────── */}
        <aside className="w-52 xl:w-64 shrink-0 flex flex-col border-l border-white/8 bg-bg-surface/40 p-3 gap-3 overflow-y-auto">

          {/* Question Stats */}
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
              Question Stats
            </p>
            <div className="glass-card p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">Answered</span>
                <span className="font-bold text-text-primary">
                  {answeredCount} / {leaderboard.length}
                </span>
              </div>
              {/* Answered progress bar */}
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-300"
                  style={{
                    width:
                      leaderboard.length > 0
                        ? `${(answeredCount / leaderboard.length) * 100}%`
                        : "0%",
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">Correct</span>
                <span className="font-bold text-emerald-400">{correctCount}</span>
              </div>
            </div>
          </div>

          {/* Timer ring */}
          <div>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
              Time Left
            </p>
            <div className="glass-card p-3 flex flex-col items-center gap-1">
              <div
                className={`text-3xl font-black font-mono tabular-nums ${timerColor}`}
              >
                {formatTime(timeLeft)}
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full rounded-full transition-all duration-1000 linear"
                  style={{
                    width: `${timerPct}%`,
                    background:
                      timeLeft > 15
                        ? "#f59e0b"
                        : timeLeft > 5
                        ? "#f97316"
                        : "#ef4444",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Your Answer */}
          {hasAnswered && (
            <div className="animate-fade-in">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
                Your Answer
              </p>
              <div
                className={`glass-card p-3 border ${
                  selectedOption === currentQuestion.correctIndex
                    ? "border-emerald-500/40 bg-emerald-500/10"
                    : "border-red-500/40 bg-red-500/10"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                      selectedOption === currentQuestion.correctIndex
                        ? "bg-emerald-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {OPTION_LETTERS[selectedOption]}
                  </span>
                  <span className="text-text-primary text-xs font-semibold truncate">
                    {currentQuestion.options[selectedOption]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold ${
                      selectedOption === currentQuestion.correctIndex
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    {selectedOption === currentQuestion.correctIndex ? "Correct!" : "Incorrect"}
                  </span>
                  {selectedOption === currentQuestion.correctIndex && myEntry && (
                    <span className="text-xs font-bold text-emerald-400">
                      +{currentQuestion.points}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Explanation — shown after answering */}
          {hasAnswered && currentQuestion.explanation && (
            <div className="animate-fade-in">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">
                Explanation
              </p>
              <div className="glass-card p-3">
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  {currentQuestion.explanation}
                </p>
              </div>
            </div>
          )}

          {/* Waiting message if not answered */}
          {!hasAnswered && (
            <div className="mt-auto">
              <div className="glass-card p-3 text-center">
                <div className="text-2xl mb-1">⏳</div>
                <p className="text-[11px] text-text-muted">
                  Select an answer above
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}