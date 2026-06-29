import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuiz } from "../hooks/useQuiz";
import { useRoomStore } from "../store/room.store";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

const OPTION_LETTERS = ["A", "B", "C", "D"];

const DIFFICULTY_COLOR: Record<string, string> = {
  easy:   "text-emerald-400",
  medium: "text-amber-400",
  hard:   "text-red-400",
};

// ── OptionButton ─────────────────────────────────────────────────────────────

function OptionButton({ letter, text, index, selectedOption, correctIndex, onSelect, disabled }: {
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
  const isCorrect  = index === correctIndex;

  let containerClass = "group flex items-center gap-4 w-full p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer ";
  let letterClass    = "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 transition-all ";

  if (!hasAnswered) {
    containerClass += "border-white/10 bg-[#12121a] hover:border-violet-500/50 hover:bg-violet-500/10 hover:shadow-[0_0_20px_rgba(139,92,246,0.1)]";
    letterClass    += "bg-white/5 text-gray-400 group-hover:bg-violet-500/30 group-hover:text-violet-300";
  } else if (isSelected && isCorrect) {
    containerClass += "border-emerald-500/60 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.15)]";
    letterClass    += "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30";
  } else if (isSelected && !isCorrect) {
    containerClass += "border-red-500/60 bg-red-500/10 shadow-[0_0_20px_rgba(239,68,68,0.15)]";
    letterClass    += "bg-red-500 text-white";
  } else if (!isSelected && isCorrect && hasAnswered) {
    containerClass += "border-emerald-500/40 bg-emerald-500/5";
    letterClass    += "bg-emerald-500/30 text-emerald-400";
  } else {
    containerClass += "border-white/5 bg-[#0d0d14] opacity-40";
    letterClass    += "bg-white/5 text-gray-600";
  }

  return (
    <button
      onClick={() => !disabled && onSelect(index)}
      disabled={disabled || hasAnswered}
      className={containerClass}
      id={`option-${index}`}
    >
      <span className={letterClass}>{letter}</span>
      <span className="text-white font-semibold text-sm sm:text-base flex-1">{text}</span>
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
    questions, questionIndex, selectedOption, phase, leaderboard, activityFeed,
    roundEndsAt, phaseStartsAt, roundDuration, connected, finalLeaderboard, myEntry,
    submitAnswer, resetSelectedOption, leaveQuiz,
  } = useQuiz();

  useEffect(() => {
    if (!quizRoomId) navigate("/home", { replace: true });
  }, [quizRoomId, navigate]);

  const [timeLeft, setTimeLeft]           = useState(0);
  const [countdownLeft, setCountdownLeft] = useState(0);
  // Track the last questionIndex we rendered so we can detect server-driven advances
  const prevQuestionIndexRef = useRef<number>(questionIndex);

  // Reset selectedOption whenever server advances to a new question
  useEffect(() => {
    if (questionIndex !== prevQuestionIndexRef.current) {
      prevQuestionIndexRef.current = questionIndex;
      resetSelectedOption();
    }
  }, [questionIndex, resetSelectedOption]);

  // Countdown timer (pre-game)
  useEffect(() => {
    if (phase !== "countdown") return;
    const tick = () => setCountdownLeft(Math.max(0, Math.ceil((phaseStartsAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [phase, phaseStartsAt]);

  // Per-question timer
  useEffect(() => {
    if (phase !== "question") { setTimeLeft(0); return; }
    const tick = () => setTimeLeft(Math.max(0, Math.ceil((roundEndsAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [phase, roundEndsAt]);

  const answeredCount = useMemo(() => leaderboard.filter((e) => e.answered).length, [leaderboard]);
  const correctCount  = useMemo(() => leaderboard.filter((e) => e.answered && e.lastAnswerCorrect).length, [leaderboard]);

  const timerPct = roundDuration > 0 ? (timeLeft / roundDuration) * 100 : 0;

  // ── Countdown screen
  if (phase === "waiting" || phase === "countdown") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#010103]">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-900/20 to-transparent pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="relative z-10 text-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 mx-auto mb-8 flex items-center justify-center shadow-[0_0_50px_rgba(139,92,246,0.4)]">
            <span className="text-5xl">🧠</span>
          </div>
          <h1 className="text-5xl font-black text-white mb-3 tracking-wider">QUIZ BATTLE</h1>
          <p className="text-gray-400 mb-10 font-medium">Get ready! Starting in…</p>
          <div className="text-[120px] font-black leading-none mb-10 text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-500">
            {countdownLeft > 0 ? countdownLeft : "GO!"}
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {leaderboard.length} player{leaderboard.length !== 1 ? "s" : ""} connected
          </div>
        </div>
      </div>
    );
  }

  // ── Reveal screen (brief pause between questions)
  if (phase === "reveal") {
    const lastQ = questions[questionIndex] ?? null;
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#010103]">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-900/10 to-transparent pointer-events-none" />
        <div className="relative z-10 text-center px-4">
          <div className="text-5xl mb-6">⏭️</div>
          <h2 className="text-3xl font-black text-white mb-2">Next Question Coming…</h2>
          {lastQ && (
            <p className="text-gray-400 text-sm mt-4">
              Correct answer was: <span className="text-emerald-400 font-bold">{OPTION_LETTERS[lastQ.correctIndex]}. {lastQ.options[lastQ.correctIndex]}</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Game Over
  if (phase === "finished") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#010103] px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/10 to-transparent pointer-events-none" />
        <div className="relative z-10 w-full max-w-lg">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-4xl font-black text-white mb-2">Quiz Over!</h1>
            <p className="text-gray-400">Final Leaderboard</p>
          </div>
          <div className="rounded-3xl border border-white/10 bg-[#12121a] p-6 space-y-3 mb-6">
            {(finalLeaderboard.length > 0 ? finalLeaderboard : leaderboard).map((entry, i) => {
              const icons = ["🥇", "🥈", "🥉"];
              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-4 p-4 rounded-2xl border ${
                    i === 0
                      ? "border-amber-500/40 bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.1)]"
                      : "border-white/5 bg-white/[0.02]"
                  }`}
                >
                  <span className="text-2xl w-8 text-center">{i < 3 ? icons[i] : `#${i + 1}`}</span>
                  <span className="flex-1 font-semibold text-white">{entry.username}</span>
                  <span className="font-black text-xl text-violet-400">{entry.score}</span>
                </div>
              );
            })}
          </div>
          <button
            id="back-home-btn"
            onClick={leaveQuiz}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-base shadow-lg shadow-violet-500/25 transition-all active:scale-[0.98]"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[questionIndex] ?? null;
  if (!currentQuestion) return null;

  const hasAnswered = selectedOption !== -1;

  return (
    <div className="min-h-screen flex flex-col bg-[#010103] overflow-hidden relative" style={{ height: "100vh" }}>

      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-[#010103]/90 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.4)]">
            <span className="text-base">🧠</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">QUIZ BATTLE</p>
            <p className="text-violet-400 text-xs font-semibold">Question {questionIndex + 1} / {questions.length}</p>
          </div>
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-black text-xl ${
          timeLeft > 15 ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
          : timeLeft > 5 ? "border-orange-500/40 bg-orange-500/10 text-orange-400"
          : "border-red-500/40 bg-red-500/10 text-red-400 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.2)]"
        }`}>
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="tabular-nums text-2xl">{formatTime(timeLeft)}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-gray-500 text-xs font-medium">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
            {leaderboard.length} Players
          </div>
          <div className={`hidden sm:flex items-center gap-1.5 text-xs font-medium ${connected ? "text-emerald-400" : "text-red-400"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
            {connected ? "Live" : "Offline"}
          </div>
          <button
            id="leave-quiz-btn"
            onClick={leaveQuiz}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </nav>

      {/* Timer bar */}
      <div className="h-0.5 bg-white/5 shrink-0">
        <div
          className="h-full transition-all duration-1000"
          style={{
            width: `${timerPct}%`,
            background: timeLeft > 15 ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
              : timeLeft > 5 ? "linear-gradient(90deg, #f97316, #fb923c)"
              : "linear-gradient(90deg, #ef4444, #f87171)",
          }}
        />
      </div>

      {/* ── 3-column layout ─────────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">

        {/* LEFT: Scoreboard + Progress + Activity */}
        <aside className="w-56 xl:w-64 shrink-0 flex flex-col border-r border-white/5 bg-[#0d0d14] overflow-y-auto">

          {/* Scoreboard */}
          <div className="p-4 border-b border-white/5">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Scoreboard</p>
            <div className="space-y-1">
              {leaderboard.slice(0, 10).map((entry, i) => (
                <div key={entry.id} className="flex items-center gap-2 py-1.5 px-1 rounded-xl hover:bg-white/5 transition-colors">
                  <span className="w-4 text-right text-xs font-bold text-gray-600 shrink-0">{i + 1}</span>
                  <span className="flex-1 text-xs font-medium text-white truncate">
                    {entry.username}
                    {i === 0 && <span className="ml-1">👑</span>}
                  </span>
                  <span className="text-xs font-bold text-gray-400 shrink-0">{entry.score}</span>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    entry.answered
                      ? entry.lastAnswerCorrect ? "bg-emerald-400" : "bg-red-400"
                      : "bg-white/20"
                  }`} />
                </div>
              ))}
            </div>
          </div>

          {/* Round progress */}
          <div className="p-4 border-b border-white/5">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Progress</p>
            <div className="flex items-center gap-1 flex-wrap mb-2">
              {Array.from({ length: questions.length }).map((_, i) => (
                <div key={i} className={`h-2 rounded-full transition-all ${
                  i < questionIndex ? "bg-violet-600 w-5"
                  : i === questionIndex ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)] w-6"
                  : "bg-white/10 w-5"
                }`} />
              ))}
            </div>
            <p className="text-[10px] text-gray-600">{questionIndex + 1} / {questions.length}</p>
          </div>

          {/* Live Activity */}
          <div className="p-4 flex-1 overflow-y-auto">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Live Activity</p>
            {activityFeed.length === 0 ? (
              <p className="text-[11px] text-gray-600 italic">No activity yet</p>
            ) : (
              <div className="space-y-2">
                {activityFeed.map((a) => (
                  <div key={a.id} className="flex items-center gap-1.5 text-[11px]">
                    <span className="text-gray-600 tabular-nums shrink-0">
                      {new Date(a.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="text-gray-400 truncate font-medium">{a.username}</span>
                    {a.correct ? (
                      <>
                        <span className="text-emerald-400">✓</span>
                        <span className="text-emerald-400 font-bold shrink-0">+{a.points}</span>
                      </>
                    ) : (
                      <span className="text-red-400">✗</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* CENTER: Question */}
        <main className="flex-1 flex flex-col p-5 lg:p-8 overflow-y-auto min-w-0 bg-[#010103]">

          {/* Question meta */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Question {questionIndex + 1}</span>
            <span className="px-2.5 py-0.5 rounded-lg bg-violet-500/20 text-violet-400 border border-violet-500/30 text-xs font-bold">
              {currentQuestion.points} pts
            </span>
            <span className="ml-auto flex items-center gap-1.5 text-xs text-gray-500">
              <span className={`font-bold capitalize ${DIFFICULTY_COLOR[currentQuestion.difficulty] ?? "text-gray-500"}`}>
                {currentQuestion.difficulty}
              </span>
            </span>
          </div>

          {/* Question text */}
          <div className="rounded-2xl border border-white/10 bg-[#12121a] p-6 mb-6 shadow-[0_0_30px_rgba(139,92,246,0.05)]">
            <p className="text-xl font-bold text-white leading-relaxed">{currentQuestion.text}</p>
          </div>

          {/* Options */}
          <div className="grid gap-3 flex-1">
            {currentQuestion.options.map((opt, i) => (
              <OptionButton
                key={`${questionIndex}-${i}`}
                letter={OPTION_LETTERS[i]}
                text={opt}
                index={i}
                selectedOption={selectedOption}
                correctIndex={currentQuestion.correctIndex}
                onSelect={submitAnswer}
                disabled={phase !== "question"}
              />
            ))}
          </div>

          {/* My score strip */}
          {myEntry && (
            <div className="mt-5 flex items-center justify-between px-5 py-3 rounded-2xl border border-violet-500/20 bg-violet-500/5">
              <span className="text-sm text-gray-400 font-medium">Your Score</span>
              <span className="text-2xl font-black text-violet-400">{myEntry.score}</span>
              {myEntry.streak >= 2 && (
                <span className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 text-sm font-bold">
                  🔥 ×{myEntry.streak}
                </span>
              )}
            </div>
          )}
        </main>

        {/* RIGHT: Stats + Answer + Explanation */}
        <aside className="w-52 xl:w-64 shrink-0 flex flex-col border-l border-white/5 bg-[#0d0d14] p-4 gap-4 overflow-y-auto">

          {/* Question Stats */}
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Question Stats</p>
            <div className="rounded-xl border border-white/5 bg-[#010103] p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Answered</span>
                <span className="font-bold text-white">{answeredCount} / {leaderboard.length}</span>
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all duration-300"
                  style={{ width: leaderboard.length > 0 ? `${(answeredCount / leaderboard.length) * 100}%` : "0%" }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Correct</span>
                <span className="font-bold text-emerald-400">{correctCount}</span>
              </div>
            </div>
          </div>

          {/* Timer ring */}
          <div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Time Left</p>
            <div className="rounded-xl border border-white/5 bg-[#010103] p-4 flex flex-col items-center gap-2">
              <div className={`text-3xl font-black font-mono tabular-nums ${
                timeLeft > 15 ? "text-amber-400" : timeLeft > 5 ? "text-orange-400" : "text-red-400 animate-pulse"
              }`}>
                {formatTime(timeLeft)}
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${timerPct}%`,
                    background: timeLeft > 15 ? "#f59e0b" : timeLeft > 5 ? "#f97316" : "#ef4444",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Your Answer */}
          {hasAnswered && (
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Your Answer</p>
              <div className={`rounded-xl border p-4 ${
                selectedOption === currentQuestion.correctIndex
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : "border-red-500/40 bg-red-500/10"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                    selectedOption === currentQuestion.correctIndex ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                  }`}>
                    {OPTION_LETTERS[selectedOption]}
                  </span>
                  <span className="text-white text-xs font-semibold truncate">
                    {currentQuestion.options[selectedOption]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${selectedOption === currentQuestion.correctIndex ? "text-emerald-400" : "text-red-400"}`}>
                    {selectedOption === currentQuestion.correctIndex ? "Correct! ✓" : "Incorrect ✗"}
                  </span>
                  {selectedOption !== currentQuestion.correctIndex && (
                    <span className="text-xs text-gray-500">
                      Ans: <span className="text-emerald-400 font-bold">{OPTION_LETTERS[currentQuestion.correctIndex]}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Explanation */}
          {hasAnswered && currentQuestion.explanation && (
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Explanation</p>
              <div className="rounded-xl border border-white/5 bg-[#010103] p-3">
                <p className="text-xs text-gray-400 leading-relaxed">{currentQuestion.explanation}</p>
              </div>
            </div>
          )}

          {/* Waiting hint */}
          {!hasAnswered && (
            <div className="mt-auto">
              <div className="rounded-xl border border-white/5 bg-[#010103] p-4 text-center">
                <div className="text-2xl mb-2">⏳</div>
                <p className="text-xs text-gray-500">Select an answer</p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}