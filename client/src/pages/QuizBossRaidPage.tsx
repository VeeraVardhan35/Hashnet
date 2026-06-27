import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuizBossRaid } from "../hooks/useQuizBossRaid";
import { useRoomStore } from "../store/room.store";
import { useAuthStore } from "../store/auth.store";

function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function HpBar({ hp, maxHp, color = "emerald" }: { hp: number; maxHp: number; color?: string }) {
  const pct = maxHp > 0 ? Math.max(0, Math.min(100, (hp / maxHp) * 100)) : 0;
  const barColor = pct <= 20 ? "#ef4444" : pct <= 50 ? "#f59e0b" : color === "purple" ? "#a855f7" : "#10b981";
  return (
    <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: barColor }} />
    </div>
  );
}

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  dps:     { label: "DPS",     color: "text-red-400    border-red-400/30    bg-red-400/10"    },
  tank:    { label: "TANK",    color: "text-blue-400   border-blue-400/30   bg-blue-400/10"   },
  support: { label: "SUPPORT", color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" },
};

const EVENT_COLOR: Record<string, string> = {
  damage:  "text-emerald-400",
  wrong:   "text-red-400",
  heal:    "text-cyan-400",
  ability: "text-purple-400",
  enrage:  "text-orange-400",
  system:  "text-amber-400",
};

const EVENT_ICON: Record<string, string> = {
  damage:  "⚔",
  wrong:   "✗",
  heal:    "💚",
  ability: "🌀",
  enrage:  "💥",
  system:  "⚡",
};

const DIFFICULTY_STYLE: Record<string, string> = {
  easy:   "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  hard:   "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function QuizBossRaidPage() {
  const navigate          = useNavigate();
  const quizBossRaidRoomId = useRoomStore((s) => s.quizBossRaidRoomId);
  const user              = useAuthStore((s) => s.user);

  const {
    questions, questionIndex, selectedOption, phase,
    roundEndsAt, roundDuration, phaseStartsAt,
    bossName, bossLevel, bossHp, bossMaxHp, bossPhase,
    nextAbilityName, nextAbilityAt, activeAbilities,
    players, liveEvents, connected, myEntry,
    submitAnswer, leaveRoom,
  } = useQuizBossRaid();

  useEffect(() => { if (!quizBossRaidRoomId) navigate("/home", { replace: true }); }, [quizBossRaidRoomId]);

  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    if (phase !== "playing") return;
    const tick = () => setTimeLeft(Math.max(0, Math.ceil((roundEndsAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [phase, roundEndsAt]);

  const [abilityCountdown, setAbilityCountdown] = useState(0);
  useEffect(() => {
    if (!nextAbilityAt) return;
    const tick = () => setAbilityCountdown(Math.max(0, Math.ceil((nextAbilityAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [nextAbilityAt]);

  const bossHpPct    = bossMaxHp > 0 ? (bossHp / bossMaxHp) * 100 : 0;
  const isEnraged    = bossPhase === "enraged";
  const isUrgent     = timeLeft <= 5 && timeLeft > 0 && phase === "playing";
  const timerPct     = roundDuration > 0 ? (timeLeft / roundDuration) * 100 : 0;

  // Force re-render every 250ms during countdown so the number animates
  const [, setTick] = useState(0);
  useEffect(() => {
    if (phase !== "countdown") return;
    const id = setInterval(() => setTick((n) => n + 1), 250);
    return () => clearInterval(id);
  }, [phase]);

  const playersList  = useMemo(() => Object.values(players).sort((a, b) => b.damageDealt - a.damageDealt), [players]);
  const alivePlayers = useMemo(() => playersList.filter((p) => p.isAlive), [playersList]);

  // My entry — find by username since we don't have sessionId in client store
  const meByUsername = useMemo(() => playersList.find((p) => p.username === user?.username), [playersList, user]);
  const me = myEntry ?? meByUsername;

  const isSilenced   = me && Date.now() < me.silencedUntil;
  const isStunned    = me && Date.now() < me.stunnedUntil;
  const isEliminated = me && !me.isAlive;
  const canAnswer    = !isEliminated && !isSilenced && !isStunned && selectedOption === -1;

  const currentQuestion = questions[questionIndex];
  const hasAnswered      = selectedOption !== -1;

  // ── Countdown ─────────────────────────────────────────────────────────────
  if (phase === "countdown") {
    const secs = Math.max(0, Math.ceil((phaseStartsAt - Date.now()) / 1000));
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base">
        <div className="glass-card-solid p-12 text-center max-w-sm w-full mx-4 animate-slide-up">
          <div className="w-28 h-28 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-900 to-red-900 flex items-center justify-center text-6xl border border-red-500/30 shadow-lg">
            👾
          </div>
          <h1 className="text-2xl font-extrabold text-red-400 mb-1">{bossName || "Algorithm Overlord"}</h1>
          <p className="text-xs text-text-muted mb-6">Level {bossLevel} Boss • Quiz Raid</p>
          <p className="text-text-secondary mb-2">Boss Raid begins in…</p>
          <div className="text-7xl font-black text-red-400 mb-2">{secs > 0 ? secs : "Go!"}</div>
          <div className="flex gap-2 justify-center mt-4 flex-wrap">
            {alivePlayers.map((p) => (
              <span key={p.id} className={`text-[10px] font-bold px-2 py-1 rounded border ${ROLE_BADGE[p.role]?.color ?? "text-text-muted"}`}>{p.role.toUpperCase()}</span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Game Over ─────────────────────────────────────────────────────────────
  if (phase === "finished") {
    const won = bossHp <= 0;
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-base px-4">
        <div className="glass-card-solid p-8 max-w-xl w-full animate-slide-up">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{won ? "🏆" : "💀"}</div>
            <h1 className={`text-3xl font-extrabold ${won ? "text-emerald-400" : "text-red-400"}`}>
              {won ? "Boss Defeated!" : "Boss Wins…"}
            </h1>
            <p className="text-text-secondary mt-1">
              {won ? `You destroyed the ${bossName}!` : `${bossName} was too powerful.`}
            </p>
            {!won && <p className="text-text-muted text-sm mt-1">Boss HP Remaining: {bossHp.toLocaleString()}</p>}
          </div>

          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Damage Leaderboard</p>
          <div className="space-y-2 mb-6">
            {playersList.map((p, i) => {
              const medals = ["🥇", "🥈", "🥉"];
              return (
                <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border ${
                  p.isAlive ? "border-white/10 bg-white/[0.03]" : "border-red-500/15 bg-red-500/5 opacity-60"
                }`}>
                  <span className="text-lg w-7 text-center shrink-0">{p.isAlive ? (i < 3 ? medals[i] : `#${i+1}`) : "☠"}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm truncate ${p.isAlive ? "text-text-primary" : "text-text-muted line-through"}`}>{p.username}</p>
                    <p className="text-[10px] text-text-muted">{p.role?.toUpperCase()} • streak {p.streak}🔥</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-red-400">⚔ {p.damageDealt.toLocaleString()}</p>
                    <p className="text-[10px] text-text-muted">{p.score} pts</p>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={leaveRoom} className="btn-primary w-full">Back to Home</button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  // ── Main Game — mirrors BossRaidPage layout ───────────────────────────────
  const labels = ["A", "B", "C", "D"];

  return (
    <div className="min-h-screen flex flex-col bg-bg-base overflow-hidden" style={{ height: "100vh" }}>

      {/* Nav */}
      <nav className="flex items-center justify-between px-4 py-2.5 border-b border-white/8 bg-bg-surface/80 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-red-400 font-black text-sm">☠</span>
          <div>
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest leading-none">QUIZ BOSS RAID</p>
            <p className="text-text-secondary text-xs font-medium">Question {questionIndex + 1} / {questions.length}</p>
          </div>
          {/* Boss HP in nav bar on XL screens */}
          <div className="hidden xl:flex items-center gap-2 ml-2">
            <div className="w-48 relative">
              <HpBar hp={bossHp} maxHp={bossMaxHp} color="purple" />
            </div>
            <span className="text-xs font-bold text-text-muted tabular-nums">
              {bossHp.toLocaleString()} / {bossMaxHp.toLocaleString()} HP
            </span>
            {isEnraged && <span className="text-[10px] font-black text-red-400 border border-red-400/40 px-2 py-0.5 rounded animate-pulse">ENRAGED</span>}
          </div>
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-black text-xl ${
          isUrgent ? "border-red-500/50 bg-red-500/10 text-red-400 animate-pulse"
          : timeLeft <= 10 ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
          : "border-red-500/30 bg-red-500/5 text-red-400"
        }`}>
          <span className="text-xs text-text-muted">ENDS IN</span>
          <span className="tabular-nums text-2xl">{formatTime(timeLeft)}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-xs ${connected ? "text-success" : "text-danger"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-success" : "bg-danger"}`} />
            {connected ? `${alivePlayers.length} Alive` : "Offline"}
          </div>
          <button onClick={leaveRoom} className="btn-danger text-xs px-3 py-2">Leave Raid</button>
        </div>
      </nav>

      {/* Timer bar */}
      <div className="h-0.5 bg-white/5 shrink-0">
        <div className="h-full transition-all duration-1000" style={{
          width: `${timerPct}%`,
          background: isUrgent ? "linear-gradient(90deg,#ef4444,#dc2626)" : "linear-gradient(90deg,#a855f7,#ef4444)",
        }} />
      </div>

      {/* Boss HP bar — mobile visible */}
      <div className="xl:hidden border-b border-white/8 px-4 py-2 bg-red-950/20 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-black ${isEnraged ? "text-red-400 animate-pulse" : "text-text-muted"}`}>
            {isEnraged ? "⚠ ENRAGED" : bossName}
          </span>
          <span className="text-xs font-bold text-text-muted tabular-nums">{bossHp.toLocaleString()} / {bossMaxHp.toLocaleString()}</span>
        </div>
        <HpBar hp={bossHp} maxHp={bossMaxHp} color="purple" />
      </div>

      {/* 3-col layout — mirrors BossRaidPage exactly */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* LEFT: Boss Info + Players — identical to BossRaidPage sidebar */}
        <aside className="w-56 xl:w-64 shrink-0 flex flex-col border-r border-white/8 bg-bg-surface/30 overflow-y-auto">
          {/* Boss card */}
          <div className="p-3 border-b border-white/8">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Boss Info</p>
            <div className="w-full h-24 rounded-xl mb-2 bg-gradient-to-br from-purple-900/60 to-red-900/60 border border-red-500/20 flex items-center justify-center text-5xl">
              👾
            </div>
            <p className={`text-sm font-black leading-tight ${isEnraged ? "text-red-400" : "text-purple-400"}`}>{bossName}</p>
            <p className="text-[10px] text-text-muted mb-2">Level {bossLevel} Boss</p>
            <HpBar hp={bossHp} maxHp={bossMaxHp} color="purple" />
            <p className="text-[10px] text-text-muted tabular-nums mt-1">
              {bossHp.toLocaleString()} / {bossMaxHp.toLocaleString()} HP ({bossHpPct.toFixed(1)}%)
            </p>
            {isEnraged && (
              <div className="mt-2 px-2 py-1 bg-red-500/15 border border-red-500/30 rounded text-[10px] font-bold text-red-400 animate-pulse">
                ⚠ ENRAGED<br />
                <span className="font-normal text-text-muted">Boss deals 50% more dmg</span>
              </div>
            )}
          </div>

          {/* Next ability */}
          {nextAbilityName && (
            <div className="p-3 border-b border-white/8">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Next Ability</p>
              <div className="px-2 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <p className="text-xs font-black text-purple-400">⚡ {nextAbilityName}</p>
                <p className="text-[10px] text-text-muted tabular-nums mt-0.5">
                  {abilityCountdown > 0 ? `in ${abilityCountdown}s` : "Incoming!"}
                </p>
              </div>
            </div>
          )}

          {/* Active abilities */}
          {activeAbilities.length > 0 && (
            <div className="p-3 border-b border-white/8">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Active Effects</p>
              <div className="space-y-1">
                {activeAbilities.slice(-3).map((ab, i) => (
                  <div key={i} className="text-[10px] px-2 py-1 bg-purple-500/5 border border-purple-500/20 rounded text-purple-400 font-bold">
                    🌀 {ab}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Player party frames */}
          <div className="p-3 border-b border-white/8">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Party ({alivePlayers.length} Alive)</p>
            <div className="space-y-2">
              {playersList.map((p) => {
                const hpPct = p.maxHp > 0 ? Math.max(0, (p.hp / p.maxHp) * 100) : 0;
                const badge = ROLE_BADGE[p.role];
                return (
                  <div key={p.id} className={`p-2 rounded-lg border relative overflow-hidden ${!p.isAlive ? "opacity-40 grayscale border-white/5" : "bg-bg-base/50 border-white/5"}`}>
                    {p.isDoomMarked && <div className="absolute inset-0 bg-purple-500/10 animate-pulse" />}
                    <div className="flex items-center justify-between mb-1.5 relative z-10">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-black uppercase ${badge?.color ?? "text-text-muted"}`}>{p.role}</span>
                        <span className="text-xs font-bold text-text-primary truncate">{p.username}</span>
                        {p.username === user?.username && <span className="text-[9px] text-accent">(You)</span>}
                      </div>
                      <span className={`text-[10px] ${p.answered ? (p.lastAnswerCorrect ? "text-emerald-400" : "text-red-400") : "text-text-muted"}`}>
                        {p.answered ? (p.lastAnswerCorrect ? "✓" : "✗") : "●"}
                      </span>
                    </div>
                    {/* HP Bar */}
                    <div className="h-1.5 bg-black/40 rounded-full overflow-hidden mb-1.5 relative z-10">
                      <div className={`h-full transition-all ${hpPct > 50 ? "bg-emerald-500" : hpPct > 25 ? "bg-orange-500" : "bg-red-500"}`} style={{ width: `${hpPct}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-mono text-text-muted relative z-10">
                      <span>HP: {p.hp}/{p.maxHp}</span>
                      <span>⚔ {p.damageDealt.toLocaleString()}</span>
                    </div>
                    {/* Status effects */}
                    {(p.silencedUntil > Date.now() || p.stunnedUntil > Date.now() || p.isDoomMarked) && (
                      <div className="mt-1 flex gap-1 relative z-10 flex-wrap">
                        {p.silencedUntil > Date.now() && <span className="text-[9px] px-1 bg-purple-500/20 text-purple-300 rounded">🔇 SILENCED</span>}
                        {p.stunnedUntil > Date.now()  && <span className="text-[9px] px-1 bg-yellow-500/20 text-yellow-300 rounded">⚡ STUNNED</span>}
                        {p.isDoomMarked               && <span className="text-[9px] px-1 bg-red-500/20 text-red-300 rounded">💀 DOOM</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Events */}
          <div className="p-3 flex-1 overflow-y-auto">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Live Events</p>
            {liveEvents.length === 0 ? (
              <p className="text-[11px] text-text-muted italic">Waiting…</p>
            ) : (
              <div className="space-y-1.5">
                {liveEvents.map((e) => {
                  const color = EVENT_COLOR[e.type] || "text-text-secondary";
                  const icon  = EVENT_ICON[e.type] || "•";
                  return (
                    <div key={e.id} className="text-[11px] leading-tight flex gap-1.5">
                      <span className="shrink-0">{icon}</span>
                      <span>
                        <span className="font-bold text-text-primary">{e.username}</span>{" "}
                        <span className={color}>{e.message}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* CENTER: Question — mirrors the "Problem" panel */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex border-b border-white/8 bg-bg-surface/20 shrink-0 items-center px-4">
            <div className="px-1 py-3 text-xs font-bold uppercase tracking-wider text-text-primary border-b-2 border-red-500">
              Question
            </div>
            <div className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-text-muted">
              {questionIndex + 1} / {questions.length}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {/* Eliminated / Stunned / Silenced overlay */}
            {isEliminated ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-6xl mb-4">☠</div>
                <h2 className="text-2xl font-black text-red-400 mb-2">You were eliminated</h2>
                <p className="text-text-muted text-sm">Spectating the raid…</p>
              </div>
            ) : isSilenced || isStunned ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-6xl mb-4">{isSilenced ? "🔇" : "⚡"}</div>
                <h2 className="text-2xl font-black text-purple-400 mb-2">{isSilenced ? "Silenced!" : "Stunned!"}</h2>
                <p className="text-text-muted text-sm">You cannot answer this round.</p>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-3 mb-4 flex-wrap">
                  <h2 className="text-xl font-bold text-text-primary flex-1 leading-relaxed">{currentQuestion.text}</h2>
                  <div className="flex gap-2 flex-wrap shrink-0">
                    <span className={`badge border text-xs px-2.5 py-1 capitalize ${DIFFICULTY_STYLE[currentQuestion.difficulty] ?? ""}`}>
                      {currentQuestion.difficulty}
                    </span>
                    <span className="badge bg-red-500/15 text-red-400 border-red-500/30 text-xs px-2.5 py-1">
                      {currentQuestion.points} Base DMG
                    </span>
                    <span className="badge border border-white/10 text-text-muted text-xs px-2.5 py-1">
                      {currentQuestion.category}
                    </span>
                  </div>
                </div>

                {hasAnswered && currentQuestion.explanation && (
                  <div className="mt-6 glass-card p-4 rounded-xl border-accent/20 animate-fade-in">
                    <p className="text-xs font-bold text-accent uppercase tracking-wider mb-2">Explanation</p>
                    <p className="text-sm text-text-secondary leading-relaxed">{currentQuestion.explanation}</p>
                  </div>
                )}

                {hasAnswered && (
                  <div className="mt-4 text-center py-4 text-text-muted text-sm">
                    Waiting for other players to answer…
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT: MCQ Options + Your Status — mirrors Editor panel */}
        <div className="flex-1 flex flex-col border-l border-white/8 overflow-hidden min-w-0">
          {/* Options header */}
          <div className="flex border-b border-white/8 bg-bg-surface/20 shrink-0 items-center px-4 py-2 gap-3">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
              {isEliminated ? "Spectating" : isSilenced ? "Silenced" : isStunned ? "Stunned" : "Select Answer"}
            </p>
            {hasAnswered && !isEliminated && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
                currentQuestion.correctIndex === selectedOption
                  ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                  : "border-red-500/40 text-red-400 bg-red-500/10"
              }`}>
                {currentQuestion.correctIndex === selectedOption ? "✓ Hit!" : "✗ Missed"}
              </span>
            )}
          </div>

          {/* Option buttons */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {isEliminated ? (
              <div className="flex-1 flex items-center justify-center text-text-muted italic text-sm">
                Spectating the raid…
              </div>
            ) : isSilenced || isStunned ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-2">
                <div className="text-4xl">{isSilenced ? "🔇" : "⚡"}</div>
                <p className="text-text-muted text-sm">{isSilenced ? "Silenced — cannot answer" : "Stunned — cannot answer"}</p>
              </div>
            ) : (
              currentQuestion.options.map((opt, i) => {
                const isSelected   = selectedOption === i;
                const isCorrect    = i === currentQuestion.correctIndex;
                const showCorrect  = hasAnswered && isCorrect;
                const showWrong    = hasAnswered && isSelected && !isCorrect;

                let borderClass = "border-white/10 bg-bg-surface/40 text-text-secondary hover:border-red-500/40 hover:bg-red-500/5 cursor-pointer";
                if (showCorrect) borderClass = "border-emerald-500 bg-emerald-500/20 text-emerald-400 cursor-default";
                else if (showWrong) borderClass = "border-red-500 bg-red-500/20 text-red-400 cursor-default";
                else if (isSelected) borderClass = "border-accent bg-accent/20 text-accent cursor-default";
                else if (hasAnswered) borderClass = "border-white/5 bg-bg-surface/20 text-text-muted opacity-40 grayscale cursor-default";

                return (
                  <button
                    key={i}
                    onClick={() => canAnswer && submitAnswer(i)}
                    disabled={!canAnswer}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex items-center gap-3 group ${borderClass}`}
                  >
                    <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-sm font-black border transition-colors ${
                      showCorrect ? "bg-emerald-500/30 border-emerald-500/50 text-emerald-400"
                      : showWrong ? "bg-red-500/30 border-red-500/50 text-red-400"
                      : isSelected ? "bg-accent/30 border-accent/50 text-accent"
                      : "bg-white/5 border-white/10 group-hover:bg-red-500/10"
                    }`}>
                      {["A","B","C","D"][i]}
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
              })
            )}
          </div>

          {/* Your Status — mirrors BossRaidPage status bar */}
          <div className="shrink-0 border-t border-white/8 p-3 bg-bg-surface/40">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Your Status</p>
            <div className="flex items-center gap-3 flex-wrap">
              <div className={`px-3 py-1.5 rounded-lg font-black text-sm shrink-0 border ${ROLE_BADGE[me?.role ?? "dps"]?.color ?? "text-text-muted border-white/10"}`}>
                {me?.role?.toUpperCase() ?? "—"}
              </div>
              {[
                { label: "HP",     value: `${me?.hp ?? 0}/${me?.maxHp ?? 0}` },
                { label: "Damage", value: (me?.damageDealt ?? 0).toLocaleString() },
                { label: "Score",  value: `${me?.score ?? 0}` },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className={`font-black text-base ${stat.label === "HP" && (me?.hp ?? 0) <= 0 ? "text-red-400" : "text-text-primary"}`}>{stat.value}</p>
                  <p className="text-[10px] text-text-muted uppercase">{stat.label}</p>
                </div>
              ))}
              {hasAnswered && !isEliminated && (
                <div className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg border animate-fade-in ${
                  currentQuestion.correctIndex === selectedOption
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : "bg-red-500/20 text-red-400 border-red-500/30"
                }`}>
                  {currentQuestion.correctIndex === selectedOption ? "✓ Hit!" : "✗ Missed"}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
