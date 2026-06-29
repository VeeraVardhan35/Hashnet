import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useBossRaid } from "../hooks/useBossRaid";
import { useRoomStore } from "../store/room.store";
import { useBossRaidStore } from "../store/bossRaid.store";
import { useAuthStore } from "../store/auth.store";
import CodeEditor from "../components/CodeEditor";
import bossImg from "../assets/boss.png";

function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// Floating damage/heal number component
type FloatVal = { id: number; value: number; isHeal: boolean };
function useFloatingValues(hp: number) {
  const [floats, setFloats] = useState<FloatVal[]>([]);
  const prevHp = useRef(hp);
  useEffect(() => {
    if (prevHp.current !== hp && prevHp.current !== 0) {
      const delta = hp - prevHp.current;
      const id = Date.now();
      setFloats((prev) => [...prev, { id, value: Math.abs(delta), isHeal: delta > 0 }]);
      setTimeout(() => setFloats((prev) => prev.filter((f) => f.id !== id)), 1500);
    }
    prevHp.current = hp;
  }, [hp]);
  return floats;
}

function FloatingValueDisplay({ floats }: { floats: FloatVal[] }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {floats.map((f) => (
        <div
          key={f.id}
          className={`absolute left-1/2 -translate-x-1/2 font-black text-sm ${
            f.isHeal ? "text-emerald-400" : "text-red-400"
          }`}
          style={{
            animation: "floatUp 1.4s ease-out forwards",
            bottom: "100%",
            textShadow: f.isHeal ? "0 0 12px #10b981" : "0 0 12px #ef4444",
          }}
        >
          {f.isHeal ? "+" : "-"}{f.value.toLocaleString()}
        </div>
      ))}
    </div>
  );
}

// Wrapper HP bar with floating values
function HpBarWithFloats({ hp, maxHp, color = "emerald" }: { hp: number; maxHp: number; color?: string }) {
  const floats = useFloatingValues(hp);
  return (
    <div className="relative">
      <FloatingValueDisplay floats={floats} />
      <HpBar hp={hp} maxHp={maxHp} color={color} />
    </div>
  );
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

const VERDICT_STYLE: Record<string, { label: string; color: string; icon: string }> = {
  accepted: { label: "Accepted", color: "text-emerald-400", icon: "✓" },
  wrong_answer: { label: "Wrong Answer", color: "text-red-400", icon: "✗" },
  runtime_error: { label: "Runtime Error", color: "text-orange-400", icon: "!" },
  time_limit_exceeded: { label: "Time Limit", color: "text-amber-400", icon: "⏱" },
  error: { label: "Service Error", color: "text-orange-400", icon: "⚠" },
  silenced: { label: "Silenced!", color: "text-purple-400", icon: "🔇" },
  stunned: { label: "Stunned!", color: "text-purple-400", icon: "⚡" },
  eliminated: { label: "Eliminated", color: "text-red-400", icon: "☠" },
};

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  dps:     { label: "DPS",     color: "text-red-400    border-red-400/30    bg-red-400/10"    },
  tank:    { label: "TANK",    color: "text-blue-400   border-blue-400/30   bg-blue-400/10"   },
  support: { label: "SUPPORT", color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10" },
};

const DIFFICULTY_STYLE: Record<string, string> = {
  easy: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  hard: "bg-red-500/20 text-red-400 border-red-500/30",
};

const EVENT_COLOR: Record<string, string> = {
  damage:      "text-emerald-400",
  boss_attack: "text-orange-400",
  ability:     "text-purple-400",
  eliminated:  "text-red-400",
  heal:        "text-cyan-400",
  system:      "text-amber-400",
  wrong:       "text-red-400",
};

const EVENT_ICON: Record<string, string> = {
  damage:      "⚔",
  boss_attack: "💥",
  ability:     "🌀",
  eliminated:  "☠",
  heal:        "💚",
  system:      "⚡",
  wrong:       "✗",
};

export default function BossRaidPage() {
  const navigate       = useNavigate();
  const bossRaidRoomId = useRoomStore((s) => s.bossRaidRoomId);
  const user           = useAuthStore((s) => s.user);
  const { setActiveTab, setBody, setLanguage: setLang } = useBossRaidStore();

  const {
    problem, phase, waveNumber, totalWaves, roundEndsAt, roundDuration, phaseStartsAt,
    bossName, bossLevel, bossHp, bossMaxHp, bossPhase,
    nextAbilityName, nextAbilityAt, activeAbilities,
    players, liveEvents, runResults, isRunning, isSubmitting,
    lastVerdict, lastVerdictDetails, lastDamage,
    connected, finalResult, submissionHistory, language, body, fullTemplate, activeTab,
    myEntry, runCode, submitCode, leaveRoom,
  } = useBossRaid();

  useEffect(() => { if (!bossRaidRoomId) navigate("/home", { replace: true }); }, [bossRaidRoomId]);

  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    if (phase !== "wave") return;
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

  const bossHpPct     = bossMaxHp > 0 ? (bossHp / bossMaxHp) * 100 : 0;
  const isEnraged     = bossPhase === "enraged";
  const isUrgent      = timeLeft <= 60 && timeLeft > 0;
  const timerPct      = roundDuration > 0 ? (timeLeft / roundDuration) * 100 : 0;

  const topDamage     = useMemo(() => [...players].sort((a, b) => b.damageDealt - a.damageDealt).slice(0, 5), [players]);
  const alivePlayers  = useMemo(() => players.filter((p) => p.isAlive), [players]);

  const isSilenced    = myEntry && Date.now() < myEntry.silencedUntil;
  const isStunned     = myEntry && Date.now() < myEntry.stunnedUntil;
  const isEliminated  = myEntry && !myEntry.isAlive;

  // ── Countdown ─────────────────────────────────────────────────────────────
  if (phase === "countdown") {
    const secs = Math.max(0, Math.ceil((phaseStartsAt - Date.now()) / 1000));
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#010103]">
        <div className="absolute inset-0 bg-gradient-to-b from-red-900/20 to-transparent pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="relative z-10 rounded-3xl border border-red-500/20 bg-[#12121a] p-12 text-center max-w-sm w-full mx-4 shadow-[0_0_50px_rgba(239,68,68,0.15)]">
          <img src={bossImg} alt="boss" className="w-28 h-28 mx-auto mb-6 rounded-2xl object-cover opacity-90 shadow-[0_0_30px_rgba(239,68,68,0.4)]" />
          <h1 className="text-3xl font-black text-red-400 mb-1">{bossName}</h1>
          <p className="text-xs text-gray-500 mb-6">Level {bossLevel} Boss • {totalWaves} Waves</p>
          <p className="text-gray-400 mb-4">Boss Raid begins in…</p>
          <div className="text-[100px] font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-500 leading-none mb-6">{secs > 0 ? secs : "Go!"}</div>
          <div className="flex gap-2 justify-center mt-4">
            {alivePlayers.map((p) => (
              <span key={p.id} className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${ROLE_BADGE[p.role]?.color ?? "text-gray-500"}`}>{p.role.toUpperCase()}</span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Game Over ─────────────────────────────────────────────────────────────
  if (phase === "finished" && finalResult) {
    const won = finalResult.playersWon;
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#010103] px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-red-900/10 to-transparent pointer-events-none" />
        <div className="relative z-10 rounded-3xl border border-white/10 bg-[#12121a] p-8 max-w-xl w-full shadow-[0_0_40px_rgba(239,68,68,0.1)]">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{won ? "🏆" : "💀"}</div>
            <h1 className={`text-4xl font-black ${won ? "text-emerald-400" : "text-red-400"}`}>
              {won ? "Boss Defeated!" : "Boss Wins…"}
            </h1>
            <p className="text-gray-400 mt-2">
              {won ? `You destroyed the ${bossName}!` : `${bossName} was too powerful.`}
            </p>
            {!won && <p className="text-gray-500 text-sm mt-1">Boss HP Remaining: {finalResult.bossHpRemaining?.toLocaleString()}</p>}
          </div>

          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4">Damage Leaderboard</p>
          <div className="space-y-2 mb-6">
            {finalResult.leaderboard?.map((entry: any, i: number) => {
              const medals = ["🥇", "🥈", "🥉"];
              return (
                <div key={entry.id} className={`flex items-center gap-3 p-4 rounded-2xl border ${
                  entry.isAlive ? "border-white/10 bg-white/5" : "border-red-500/15 bg-red-500/5 opacity-60"
                }`}>
                  <span className="text-lg w-7 text-center shrink-0">{entry.isAlive ? (i < 3 ? medals[i] : `#${i+1}`) : "☠"}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm truncate ${entry.isAlive ? "text-white" : "text-gray-500 line-through"}`}>{entry.username}</p>
                    <p className="text-[10px] text-gray-500">{entry.role?.toUpperCase()} • {entry.solved} solved</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-red-400">⚔ {entry.damageDealt.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500">{entry.score} pts</p>
                  </div>
                </div>
              );
            })}
          </div>
          <button onClick={leaveRoom} className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-500 hover:to-red-500 text-white font-black transition-all active:scale-[0.98]">Back to Home</button>
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
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-red-600 flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)]">
            <span className="text-base">👾</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest leading-none">BOSS RAID</p>
            <p className="text-gray-400 text-xs font-semibold">Wave {waveNumber} / {totalWaves}</p>
          </div>
          <div className="hidden xl:flex items-center gap-2 ml-2">
            <div className="w-48 relative">
              <HpBarWithFloats hp={bossHp} maxHp={bossMaxHp} color="purple" />
            </div>
            <span className="text-xs font-bold text-gray-500 tabular-nums">
              {bossHp.toLocaleString()} / {bossMaxHp.toLocaleString()} HP
            </span>
            {isEnraged && <span className="text-[10px] font-black text-red-400 border border-red-400/40 px-2 py-0.5 rounded-lg animate-pulse">ENRAGED</span>}
          </div>
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-black text-xl ${
          isUrgent ? "border-red-500/50 bg-red-500/10 text-red-400 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          : timeLeft <= 120 ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
          : "border-purple-500/30 bg-purple-500/5 text-purple-400"
        }`}>
          <span className="text-xs font-bold tracking-widest">ENDS IN</span>
          <span className="tabular-nums text-2xl">{formatTime(timeLeft)}</span>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-xs font-medium ${connected ? "text-emerald-400" : "text-red-400"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
            {connected ? `${alivePlayers.length} Alive` : "Offline"}
          </div>
          <button onClick={leaveRoom} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-colors">Leave Raid</button>
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
      <div className="xl:hidden border-b border-white/5 px-4 py-2 bg-purple-950/20 shrink-0">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-black ${isEnraged ? "text-red-400 animate-pulse" : "text-gray-500"}`}>
            {isEnraged ? "⚠ ENRAGED" : bossName}
          </span>
          <span className="text-xs font-bold text-gray-500 tabular-nums">{bossHp.toLocaleString()} / {bossMaxHp.toLocaleString()}</span>
        </div>
        <HpBarWithFloats hp={bossHp} maxHp={bossMaxHp} color="purple" />
      </div>

      {/* 3-col layout */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* LEFT: Boss Info + Players */}
        <aside className="w-56 xl:w-64 shrink-0 flex flex-col border-r border-white/5 bg-[#0d0d14] overflow-y-auto">
          {/* Boss card */}
          <div className="p-3 border-b border-white/5">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Boss Info</p>
            <img src={bossImg} alt={bossName} className="w-full h-24 object-cover rounded-xl mb-2 opacity-80" />
            <p className="text-sm font-black text-red-400 leading-tight">{bossName}</p>
            <p className="text-[10px] text-text-muted mb-2">Level {bossLevel} Boss</p>
            <HpBarWithFloats hp={bossHp} maxHp={bossMaxHp} color="purple" />
            <p className="text-[10px] text-text-muted tabular-nums mt-1">
              {bossHp.toLocaleString()} / {bossMaxHp.toLocaleString()} HP ({bossHpPct.toFixed(1)}%)
            </p>
            {isEnraged && (
              <div className="mt-2 px-2 py-1 bg-red-500/15 border border-red-500/30 rounded text-[10px] font-bold text-red-400 animate-pulse">
                ⚠ Phase 2 — ENRAGED<br />
                <span className="font-normal text-text-muted">Boss deals 50% more dmg</span>
              </div>
            )}
          </div>

          {/* Next ability */}
          {nextAbilityName && (
            <div className="p-3 border-b border-white/5">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Next Ability</p>
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
            <div className="p-3 border-b border-white/5">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Active Effects</p>
              <div className="space-y-1">
                {activeAbilities.map((ab, i) => (
                  <div key={i} className="text-[10px] px-2 py-1 bg-purple-500/5 border border-purple-500/20 rounded text-purple-400 font-bold">
                    🌀 {ab}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wave progress */}
          <div className="p-3 border-b border-white/5">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Raid Progress</p>
            <div className="flex gap-2">
              {Array.from({ length: totalWaves }).map((_, i) => (
                <div key={i} className={`flex-1 h-2 rounded-full ${
                  i < waveNumber - 1 ? "bg-red-400" :
                  i === waveNumber - 1 ? "bg-amber-400 animate-pulse" :
                  "bg-white/10"
                }`} />
              ))}
            </div>
            <p className="text-[10px] text-text-muted mt-1">Wave {waveNumber} / {totalWaves}</p>
          </div>

          {/* Your stats */}
          {myEntry && (
            <div className="p-3 border-b border-white/5">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Your Stats</p>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-bold text-text-primary truncate">{myEntry.username}</span>
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${ROLE_BADGE[myEntry.role]?.color}`}>
                  {myEntry.role.toUpperCase()}
                </span>
              </div>
              <div className="mb-1">
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className={`font-bold ${myEntry.isAlive ? "text-emerald-400" : "text-red-400"}`}>
                    {myEntry.isAlive ? "HP" : "DEAD"}
                  </span>
                  <span className="text-text-muted tabular-nums">{myEntry.hp} / {myEntry.maxHp}</span>
                </div>
                <HpBarWithFloats hp={myEntry.hp} maxHp={myEntry.maxHp} />
              </div>
              {(isSilenced || isStunned || myEntry.isDoomMarked) && (
                <div className="mt-2 space-y-1">
                  {isSilenced && <p className="text-[10px] font-bold text-purple-400 animate-pulse">🔇 SILENCED</p>}
                  {isStunned  && <p className="text-[10px] font-bold text-yellow-400 animate-pulse">⚡ STUNNED</p>}
                  {myEntry.isDoomMarked && <p className="text-[10px] font-bold text-red-400 animate-pulse">💀 DOOM MARKED</p>}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 mt-2 text-center">
                <div className="glass-card p-1.5 rounded">
                  <p className="text-red-400 font-black text-sm">{myEntry.damageDealt.toLocaleString()}</p>
                  <p className="text-[9px] text-text-muted">Damage</p>
                </div>
                <div className="glass-card p-1.5 rounded">
                  <p className="text-text-primary font-black text-sm">{myEntry.solved}</p>
                  <p className="text-[9px] text-text-muted">Solved</p>
                </div>
              </div>
            </div>
          )}

          {/* Damage Leaderboard */}
          <div className="p-3 flex-1">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Damage Board</p>
            <div className="space-y-1.5">
              {topDamage.map((p, i) => (
                <div key={p.id} className={`flex items-center gap-1.5 ${!p.isAlive ? "opacity-40" : ""}`}>
                  <span className="text-[10px] text-text-muted w-3 shrink-0">{i + 1}</span>
                  <span className={`text-[10px] font-bold w-3 text-center ${ROLE_BADGE[p.role]?.color.split(" ")[0] ?? ""}`}>
                    {p.role === "dps" ? "D" : p.role === "tank" ? "T" : "S"}
                  </span>
                  <span className={`flex-1 text-xs truncate ${p.isAlive ? "text-text-primary" : "text-text-muted"}`}>{p.username}</span>
                  <span className="text-[10px] font-bold text-red-400 shrink-0">{p.damageDealt.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* CENTER: Problem + Activity */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex border-b border-white/5 bg-[#0d0d14] shrink-0">
            {(["problem", "submissions"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-3 text-sm font-bold border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? "border-red-500 text-red-400 bg-red-500/5"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}>{tab}</button>
            ))}
          </div>

          {/* Boss banner image */}
          {phase === "wave" && (
            <div className="relative shrink-0 h-20 overflow-hidden border-b border-white/8">
              <img src={bossImg} alt={bossName} className="w-full h-full object-cover object-top opacity-25" />
              <div className="absolute inset-0 flex items-center px-4">
                <p className="text-[11px] font-bold text-purple-400 animate-pulse">
                  {isEnraged ? "⚠ Boss is ENRAGED — deal damage fast!" : "⚔ Boss is preparing an attack…"}
                </p>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "problem" && problem ? (
              <>
                <div className="flex items-start gap-3 mb-4 flex-wrap">
                  <h2 className="text-xl font-bold text-text-primary flex-1">{problem.title}</h2>
                  <div className="flex gap-2">
                    <span className={`badge border text-xs px-2.5 py-1 capitalize ${DIFFICULTY_STYLE[problem.difficulty] ?? ""}`}>{problem.difficulty}</span>
                    <span className="badge bg-red-500/15 text-red-400 border-red-500/30 text-xs px-2.5 py-1">{problem.points} pts → damage</span>
                  </div>
                </div>
                {/* Tags & Companies */}
                <div className="flex flex-wrap gap-1.5 mb-5 mt-2">
                  {problem.tags?.map((tag) => (
                    <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/5 text-gray-500 border border-white/5">{tag}</span>
                  ))}
                  {problem.companies?.map((company) => (
                    <span key={company} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500/70 border border-amber-500/20">{company}</span>
                  ))}
                </div>

                <p className="text-text-secondary text-sm leading-relaxed mb-6 whitespace-pre-wrap">{problem.description}</p>
                
                {problem.examples.map((ex, i) => (
                  <div key={i} className="mb-4 glass-card p-4 rounded-xl">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">Example {i + 1}</p>
                    <div className="space-y-2 text-sm text-text-muted font-mono">
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
                    <div className="glass-card p-4 rounded-xl">
                      <p className="text-xs font-bold text-gray-500 mb-2">Constraints</p>
                      <p className="text-sm text-gray-300 font-mono whitespace-pre-wrap">{problem.constraints}</p>
                    </div>
                  )}
                  {problem.expectedComplexity && (
                    <div className="glass-card p-4 rounded-xl">
                      <p className="text-xs font-bold text-gray-500 mb-2">Expected Complexity</p>
                      <p className="text-sm text-gray-300 font-mono">{problem.expectedComplexity}</p>
                    </div>
                  )}
                </div>

                {/* Hints */}
                {problem.hints && problem.hints.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <p className="text-xs font-bold text-gray-500 mb-2">Hints</p>
                    {problem.hints.map((hint, i) => (
                      <div key={i} className="rounded-xl border border-white/5 bg-[#0d0d14] p-3 text-xs text-gray-400">
                        <span className="font-bold text-gray-500 mr-2">#{i + 1}</span> {hint}
                      </div>
                    ))}
                  </div>
                )}
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
              <p className="text-text-muted italic text-sm">Loading…</p>
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

          {/* Raid Activity Feed */}
          <div className="shrink-0 border-t border-white/8 bg-bg-surface/10" style={{ maxHeight: "120px", overflowY: "auto" }}>
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-4 pt-2">Raid Activity</p>
            <div className="px-4 pb-2 space-y-0.5">
              {liveEvents.slice(0, 8).map((e) => (
                <p key={e.id} className="text-[11px] leading-tight">
                  <span className="text-text-muted tabular-nums text-[10px] mr-1">
                    {new Date(e.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className={`font-bold ${EVENT_COLOR[e.type] ?? "text-text-muted"}`}>
                    {EVENT_ICON[e.type] ?? "•"}
                  </span>{" "}
                  <span className="font-bold text-text-primary">{e.username}</span>{" "}
                  <span className={EVENT_COLOR[e.type] ?? "text-text-muted"}>{e.message}</span>
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Editor + Players */}
        <div className="flex-1 flex flex-col border-l border-white/8 overflow-hidden min-w-0">
          {/* Players panel (compact) */}
          <div className="shrink-0 border-b border-white/8 overflow-y-auto" style={{ maxHeight: "220px" }}>
            <div className="p-2 space-y-1">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-1">Players ({players.length})</p>
              {players.map((p) => (
                <div key={p.id} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg ${!p.isAlive ? "opacity-40" : ""} ${p.username === user?.username ? "bg-white/5" : ""}`}>
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${p.isAlive ? "bg-emerald-400" : "bg-red-400"}`} />
                  <span className={`text-[10px] font-black shrink-0 ${ROLE_BADGE[p.role]?.color.split(" ")[0]}`}>{p.role === "dps" ? "D" : p.role === "tank" ? "T" : "S"}</span>
                  <span className="flex-1 text-xs font-medium truncate text-text-primary">{p.username}{p.username === user?.username && " (You)"}</span>
                  {p.isAlive ? (
                    <div className="flex items-center gap-1 shrink-0 w-16">
                      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-300" style={{
                          width: `${(p.hp / p.maxHp) * 100}%`,
                          backgroundColor: p.hp / p.maxHp <= 0.25 ? "#ef4444" : p.hp / p.maxHp <= 0.5 ? "#f59e0b" : "#10b981",
                        }} />
                      </div>
                      <span className="text-[9px] text-text-muted tabular-nums">{p.hp}</span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-red-400 font-bold">DEAD</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-hidden min-h-0">
            <CodeEditor
              fullTemplate={fullTemplate}
              language={language}
              body={body}
              onBodyChange={setBody}
              onLanguageChange={setLang}
              onRun={runCode}
              onSubmit={submitCode}
              isRunning={isRunning}
              isSubmitting={isSubmitting}
              isEliminated={isEliminated ?? false}
            />
          </div>

          {/* Verdict / Your Status */}
          <div className="shrink-0 border-t border-white/8 p-3 bg-bg-surface/40">
            <div className="flex items-center gap-3 flex-wrap">
              {myEntry && (
                <div className={`px-3 py-1.5 rounded-lg font-black text-xs shrink-0 border ${
                  !myEntry.isAlive ? "bg-red-500/20 text-red-400 border-red-500/30" :
                  isSilenced ? "bg-purple-500/20 text-purple-400 border-purple-500/30" :
                  "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                }`}>
                  {!myEntry.isAlive ? "DEAD" : isSilenced ? "SILENCED" : isStunned ? "STUNNED" : "ALIVE"}
                </div>
              )}
              {lastVerdict && (
                <div className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg border animate-fade-in ${
                  lastVerdict === "accepted" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"
                }`}>
                  {VERDICT_STYLE[lastVerdict]?.icon} {VERDICT_STYLE[lastVerdict]?.label ?? lastVerdict}
                  {lastVerdict === "accepted" && lastDamage > 0 && <span className="ml-1 text-red-300">⚔ -{lastDamage} Boss HP</span>}
                </div>
              )}
              {lastVerdict && lastVerdict !== "accepted" && lastVerdictDetails && (
                <p className="text-[11px] font-mono text-red-300 flex-1">{lastVerdictDetails.slice(0, 150)}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
