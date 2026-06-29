import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRoom } from "../hooks/useRoom";
import { useAuthStore } from "../store/auth.store";
import { useRoomStore } from "../store/room.store";
import PlayerCard from "../components/PlayerCard";
import RoomCodeDisplay from "../components/RoomCodeDisplay";
import RulesOverlay from "../components/RulesOverlay";

export default function LobbyPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const room = useRoomStore((s) => s.room);
  const gameMode = useRoomStore((s) => s.gameMode);
  const bossLevel = useRoomStore((s) => s.bossLevel);
  const [showRules, setShowRules] = useState(false);

  const MODE_META: Record<string, { label: string; icon: string; color: string; gradient: string; glow: string }> = {
    quiz:           { label: "Quiz Battle",    icon: "🧠", color: "text-violet-400",  gradient: "from-violet-600 to-indigo-600", glow: "shadow-[0_0_30px_rgba(139,92,246,0.4)]" },
    battle:         { label: "Battle Royale",  icon: "⚡", color: "text-red-400",     gradient: "from-red-600 to-pink-600",       glow: "shadow-[0_0_30px_rgba(239,68,68,0.4)]" },
    teams:          { label: "Teams Mode",     icon: "⚔️", color: "text-emerald-400", gradient: "from-emerald-600 to-teal-600",   glow: "shadow-[0_0_30px_rgba(16,185,129,0.4)]" },
    boss_raid:      { label: "Code Boss Raid", icon: "👾", color: "text-purple-400",  gradient: "from-purple-600 to-fuchsia-600", glow: "shadow-[0_0_30px_rgba(168,85,247,0.4)]" },
    quiz_teams:     { label: "Quiz Teams",     icon: "🧠", color: "text-teal-400",    gradient: "from-teal-500 to-cyan-600",      glow: "shadow-[0_0_30px_rgba(20,184,166,0.4)]" },
    quiz_boss_raid: { label: "Quiz Boss Raid", icon: "👾", color: "text-fuchsia-400", gradient: "from-fuchsia-600 to-pink-600",   glow: "shadow-[0_0_30px_rgba(217,70,239,0.4)]" },
  };
  const meta = MODE_META[gameMode] ?? { label: "Game Mode", icon: "🎮", color: "text-cyan-400", gradient: "from-cyan-500 to-blue-600", glow: "" };

  const {
    roomCode, players, connected, gameStarted,
    toggleReady, pickTeam, startGame, leaveRoom, setBossLevel,
  } = useRoom();

  useEffect(() => {
    if (!room) navigate("/home", { replace: true });
  }, [room, navigate]);

  const myPlayer = players.find((p) => p.id === room?.sessionId);
  const isHost = myPlayer?.isHost ?? false;
  const isReady = myPlayer?.ready ?? false;
  const myTeam = myPlayer?.preferredTeam ?? "";
  const readyCount = players.filter((p) => p.ready).length;

  const isTeamMode = gameMode === "quiz_teams" || gameMode === "teams";
  const alphaCount = players.filter((p) => p.preferredTeam === "alpha").length;
  const betaCount  = players.filter((p) => p.preferredTeam === "beta").length;
  const unpickedCount = players.filter((p) => !p.preferredTeam).length;

  const canStart = isTeamMode
    ? players.length >= 2 && readyCount === players.length && alphaCount >= 1 && betaCount >= 1
    : players.length >= 2 && readyCount === players.length;

  if (!room) return null;

  return (
    <div className="min-h-screen flex flex-col bg-[#010103] text-white font-sans overflow-hidden">
      
      {/* Background glows */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-purple-900/20 to-transparent pointer-events-none" />
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />

      {/* ── Nav ─────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#010103]/80 backdrop-blur-md shrink-0 relative z-10">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center ${meta.glow}`}>
            <span className="text-lg">{meta.icon}</span>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest leading-none">HASHNET LOBBY</p>
            <p className={`font-black text-lg ${meta.color}`}>{meta.label}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg border ${connected ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : "text-red-400 border-red-500/30 bg-red-500/10"}`}>
            <span className={`w-2 h-2 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
            {connected ? "Connected" : "Disconnected"}
          </div>

          <button
            onClick={() => setShowRules(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white text-sm font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Rules
          </button>

          <button
            id="leave-room-btn"
            onClick={leaveRoom}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 text-sm font-bold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            Leave
          </button>
        </div>
      </nav>

      {/* ── Main Layout ─────────────────────────────────────── */}
      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-6 max-w-6xl mx-auto w-full relative z-10">

        {/* ── Left Panel ──────────────────────────────────── */}
        <div className="flex flex-col gap-5 lg:w-80 shrink-0">

          {/* Room Code Card */}
          <div className="rounded-2xl border border-white/10 bg-[#12121a] p-6 flex flex-col items-center gap-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Room Code</p>
            <RoomCodeDisplay code={roomCode} />
            <p className="text-xs text-gray-500">Share this code to invite players</p>
          </div>

          {/* Room Info */}
          <div className="rounded-2xl border border-white/10 bg-[#12121a] p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Room Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">Players</span>
                <span className="font-black text-white">{players.length} / 8</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-2">
                <div
                  className={`bg-gradient-to-r ${meta.gradient} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${(players.length / 8) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-gray-400 text-sm">Ready</span>
                <span className={`font-black text-sm ${canStart ? "text-emerald-400" : "text-white"}`}>
                  {readyCount} / {players.length}
                </span>
              </div>
              <div className="flex gap-1 mt-1">
                {players.map((p, i) => (
                  <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${p.ready ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-white/10"}`} />
                ))}
                {Array.from({ length: Math.max(0, 2 - players.length) }).map((_, i) => (
                  <div key={`empty-${i}`} className="flex-1 h-1.5 rounded-full bg-white/5" />
                ))}
              </div>
            </div>
          </div>

          {/* Game Started */}
          {gameStarted && (
            <div className={`rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-5 text-center`}>
              <div className="text-3xl mb-2">{meta.icon}</div>
              <p className="font-black text-emerald-400">{meta.label} Starting!</p>
              <p className="text-xs text-gray-400 mt-1">Loading game arena...</p>
            </div>
          )}

          {/* Mode-specific info */}
          {gameMode === "boss_raid" && !gameStarted && (
            <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-4">
              <p className="text-xs font-black text-purple-400 mb-2 flex items-center gap-2">👾 Code Boss Raid</p>
              <p className="text-xs text-gray-400 leading-relaxed">All players co-op against an AI boss. Solve problems to deal damage. Survive and win!</p>
            </div>
          )}
          {gameMode === "teams" && !gameStarted && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
              <p className="text-xs font-black text-emerald-400 mb-2 flex items-center gap-2">⚔️ Teams Mode</p>
              <p className="text-xs text-gray-400 leading-relaxed">Players split into Alpha & Beta teams. Highest combined team score wins!</p>
            </div>
          )}

          {/* Team picker */}
          {isTeamMode && !gameStarted && (
            <div className="rounded-2xl border border-teal-500/30 bg-teal-500/5 p-5">
              <p className="text-xs font-black text-teal-400 mb-4 uppercase tracking-widest">Pick Your Team</p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex flex-col items-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <p className="text-xs font-black text-emerald-400">ALPHA</p>
                  <p className="text-3xl font-black text-emerald-400">{alphaCount}</p>
                  <p className="text-[10px] text-gray-500">players</p>
                </div>
                <div className="flex flex-col items-center p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <p className="text-xs font-black text-orange-400">BETA</p>
                  <p className="text-3xl font-black text-orange-400">{betaCount}</p>
                  <p className="text-[10px] text-gray-500">players</p>
                </div>
              </div>

              {unpickedCount > 0 && (
                <p className="text-[11px] text-amber-400 text-center mb-3">⚠ {unpickedCount} player{unpickedCount > 1 ? "s" : ""} haven't picked a team</p>
              )}

              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Your team</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => pickTeam("alpha")}
                  className={`py-3 rounded-xl font-black text-sm border transition-all ${myTeam === "alpha" ? "bg-emerald-500/30 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/20" : "bg-emerald-500/5 border-emerald-500/20 text-emerald-400/60 hover:bg-emerald-500/15"}`}
                >
                  {myTeam === "alpha" ? "✓ " : ""}Alpha
                </button>
                <button
                  onClick={() => pickTeam("beta")}
                  className={`py-3 rounded-xl font-black text-sm border transition-all ${myTeam === "beta" ? "bg-orange-500/30 border-orange-500 text-orange-400 shadow-lg shadow-orange-500/20" : "bg-orange-500/5 border-orange-500/20 text-orange-400/60 hover:bg-orange-500/15"}`}
                >
                  {myTeam === "beta" ? "✓ " : ""}Beta
                </button>
              </div>
            </div>
          )}

          {/* Boss Level picker (host only) */}
          {(gameMode === "boss_raid" || gameMode === "quiz_boss_raid") && !gameStarted && (
            <div className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-black text-purple-400 uppercase tracking-widest">Boss Level</p>
                <span className="text-2xl font-black text-purple-400">{bossLevel}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-gray-500 font-bold uppercase">Easy</span>
                <input
                  type="range" min="1" max="10" value={bossLevel}
                  onChange={(e) => setBossLevel(parseInt(e.target.value))}
                  disabled={!isHost}
                  className="flex-1 accent-purple-500"
                />
                <span className="text-[10px] text-gray-500 font-bold uppercase">Hard</span>
              </div>
              {!isHost && (
                <p className="text-[10px] text-gray-500 text-center mt-2 italic">Waiting for host to set level</p>
              )}
            </div>
          )}
        </div>

        {/* ── Right Panel ─────────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-5 min-h-0">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                Waiting for Players
                <span className={`text-lg ${meta.color}`}>{meta.icon}</span>
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {isHost ? "You are the host" : `${players.find((p) => p.isHost)?.username ?? ""} is the host`}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              {players.length} player{players.length !== 1 ? "s" : ""} online
            </div>
          </div>

          {/* Player list */}
          <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
            {players.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-[#12121a] p-12 text-center">
                <div className="text-5xl mb-4">👀</div>
                <p className="font-black text-white text-lg mb-2">Waiting for Players</p>
                <p className="text-gray-500 text-sm">Share the room code to invite friends</p>
              </div>
            ) : (
              players.map((player) => (
                <div key={player.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <PlayerCard player={player} mySessionId={room?.sessionId} />
                  </div>
                  {isTeamMode && (
                    <div className={`shrink-0 w-16 text-center text-xs font-black py-2 px-3 rounded-xl border ${
                      player.preferredTeam === "alpha" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : player.preferredTeam === "beta" ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                      : "bg-white/5 text-gray-500 border-white/10"
                    }`}>
                      {player.preferredTeam === "alpha" ? "Alpha" : player.preferredTeam === "beta" ? "Beta" : "—"}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* ── Action Bar ─────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3 pt-5 border-t border-white/5">

            <button
              id="toggle-ready-btn"
              onClick={toggleReady}
              className={`flex-1 py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                isReady
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/40"
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25"
              }`}
            >
              {isReady ? (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  Cancel Ready
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  Ready Up!
                </>
              )}
            </button>

            {isTeamMode && !canStart && players.length >= 2 && readyCount === players.length && (
              <p className="text-xs text-amber-400 text-center self-center">⚠ Both teams need at least 1 player</p>
            )}

            {isHost && (
              <button
                id="start-game-btn"
                onClick={startGame}
                disabled={!canStart}
                title={!canStart ? players.length < 2 ? "Need at least 2 players" : "All players must be ready" : "Start the game"}
                className={`flex-1 py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                  canStart
                    ? `bg-gradient-to-r ${meta.gradient} text-white shadow-lg animate-pulse`
                    : "bg-white/5 text-gray-600 border border-white/10 cursor-not-allowed"
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                {!canStart
                  ? players.length < 2 ? "Need 2+ Players" : `${players.length - readyCount} Not Ready`
                  : "START GAME"
                }
              </button>
            )}
          </div>
        </div>
      </main>

      {showRules && (
        <RulesOverlay onClose={() => setShowRules(false)} />
      )}
    </div>
  );
}