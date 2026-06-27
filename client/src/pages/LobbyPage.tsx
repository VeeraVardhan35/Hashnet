import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRoom } from "../hooks/useRoom";
import { useAuthStore } from "../store/auth.store";
import { useRoomStore } from "../store/room.store";
import PlayerCard from "../components/PlayerCard";
import RoomCodeDisplay from "../components/RoomCodeDisplay";

export default function LobbyPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const room = useRoomStore((s) => s.room);
  const gameMode = useRoomStore((s) => s.gameMode);

  const MODE_META: Record<string, { label: string; icon: string; color: string }> = {
    quiz:           { label: "Quiz Battle",    icon: "🧠",   color: "text-violet-400" },
    battle:         { label: "Battle Royale",  icon: "⚡",   color: "text-red-400" },
    teams:          { label: "Teams Mode",     icon: "⚔️",   color: "text-emerald-400" },
    boss_raid:      { label: "Code Boss Raid", icon: "👾",   color: "text-purple-400" },
    quiz_teams:     { label: "Quiz Teams",     icon: "🧠⚔️", color: "text-teal-400" },
    quiz_boss_raid: { label: "Quiz Boss Raid", icon: "🧠👾", color: "text-fuchsia-400" },
  };
  const meta = MODE_META[gameMode] ?? { label: "Game Mode", icon: "🎮", color: "text-accent" };

  const {
    roomCode,
    players,
    connected,
    gameStarted,
    toggleReady,
    pickTeam,
    startGame,
    leaveRoom,
  } = useRoom();

  // If navigated to /lobby without a room (e.g., direct URL), go home
  useEffect(() => {
    if (!room) {
      navigate("/home", { replace: true });
    }
  }, [room, navigate]);

  // Find the current player
  const myPlayer = players.find((p) => p.id === room?.sessionId);
  const isHost = myPlayer?.isHost ?? false;
  const isReady = myPlayer?.ready ?? false;
  const myTeam = myPlayer?.preferredTeam ?? "";
  const readyCount = players.filter((p) => p.ready).length;

  // Team mode helpers — must be defined before canStart
  const isTeamMode = gameMode === "quiz_teams";
  const alphaCount = players.filter((p) => p.preferredTeam === "alpha").length;
  const betaCount  = players.filter((p) => p.preferredTeam === "beta").length;
  const unpickedCount = players.filter((p) => !p.preferredTeam).length;

  const canStart = isTeamMode
    ? players.length >= 2 && readyCount === players.length && alphaCount >= 1 && betaCount >= 1
    : players.length >= 2 && readyCount === players.length;

  if (!room) return null;

  return (
    <div className="min-h-screen flex flex-col">

      {/* ── Nav ───────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
          </div>
          <div>
            <span className="font-bold text-text-primary text-lg tracking-tight">Hashet</span>
            <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 ${meta.color}`}>
              {meta.icon} {meta.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Connection status */}
          <div className={`flex items-center gap-1.5 text-xs font-medium ${connected ? "text-success" : "text-danger"}`}>
            <span className={`w-2 h-2 rounded-full ${connected ? "bg-success animate-pulse" : "bg-danger"}`} />
            {connected ? "Connected" : "Disconnected"}
          </div>

          {/* Leave button */}
          <button
            id="leave-room-btn"
            onClick={leaveRoom}
            className="btn-danger text-sm px-4 py-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Leave
          </button>
        </div>
      </nav>

      {/* ── Main Layout ───────────────────────────────────────── */}
      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-6 max-w-5xl mx-auto w-full">

        {/* ── Left Panel ──────────────────────────────────────── */}
        <div className="flex flex-col gap-6 lg:w-80 shrink-0">

          {/* Room Code Card */}
          <div className="glass-card p-6 flex flex-col items-center gap-2">
            <RoomCodeDisplay code={roomCode} />
          </div>

          {/* Room Info */}
          <div className="glass-card p-5 flex flex-col gap-3">
            <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Room Info
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary text-sm">Players</span>
              <span className="font-bold text-text-primary">
                {players.length} / 8
              </span>
            </div>
            <div className="w-full bg-bg-base rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-500"
                style={{ width: `${(players.length / 8) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-text-secondary text-sm">Ready</span>
              <span className={`font-bold text-sm ${canStart ? "text-success" : "text-text-primary"}`}>
                {readyCount} / {players.length}
              </span>
            </div>
          </div>

          {/* Game Started overlay state */}
          {gameStarted && (
            <div className="glass-card p-5 border-success/40 bg-success/10 text-center animate-fade-in">
              <div className="text-3xl mb-2">{meta.icon}</div>
              <p className="font-bold text-success">{meta.label} Starting!</p>
              <p className="text-xs text-text-secondary mt-1">Loading game…</p>
            </div>
          )}

          {/* Mode-specific info card */}
          {gameMode === "boss_raid" && !gameStarted && (
            <div className="glass-card p-4 border-purple-500/20 bg-purple-500/5">
              <p className="text-xs font-bold text-purple-400 mb-1">👾 Code Boss Raid</p>
              <p className="text-[11px] text-text-muted leading-relaxed">
                All players co-op against an AI boss. Roles (DPS/Tank/Support) assigned on join.
                Solve problems → deal damage. Stay alive to win!
              </p>
            </div>
          )}
          {gameMode === "teams" && !gameStarted && (
            <div className="glass-card p-4 border-emerald-500/20 bg-emerald-500/5">
              <p className="text-xs font-bold text-emerald-400 mb-1">⚔️ Teams Mode</p>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Players split into Alpha &amp; Beta teams automatically. Highest combined team score wins!
              </p>
            </div>
          )}
          {/* Team picker — quiz_teams mode only */}
          {isTeamMode && !gameStarted && (
            <div className="glass-card p-5 border-teal-500/20 bg-teal-500/5">
              <p className="text-xs font-bold text-teal-400 mb-3 uppercase tracking-widest">Pick Your Team</p>

              {/* Team distribution */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="flex flex-col items-center p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-xl mb-1">🟢</span>
                  <p className="text-xs font-black text-emerald-400">ALPHA</p>
                  <p className="text-2xl font-black text-emerald-400">{alphaCount}</p>
                  <p className="text-[10px] text-text-muted">players</p>
                </div>
                <div className="flex flex-col items-center p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <span className="text-xl mb-1">🟠</span>
                  <p className="text-xs font-black text-orange-400">BETA</p>
                  <p className="text-2xl font-black text-orange-400">{betaCount}</p>
                  <p className="text-[10px] text-text-muted">players</p>
                </div>
              </div>

              {unpickedCount > 0 && (
                <p className="text-[11px] text-amber-400 text-center mb-3">
                  ⚠ {unpickedCount} player{unpickedCount > 1 ? "s" : ""} haven't picked a team
                </p>
              )}

              {/* My team pick buttons */}
              <p className="text-[10px] text-text-muted uppercase tracking-widest mb-2">Your team</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => pickTeam("alpha")}
                  className={`py-3 rounded-xl font-black text-sm border transition-all ${
                    myTeam === "alpha"
                      ? "bg-emerald-500/30 border-emerald-500 text-emerald-400 shadow-lg"
                      : "bg-emerald-500/5 border-emerald-500/20 text-emerald-400/60 hover:bg-emerald-500/15 hover:border-emerald-500/40"
                  }`}
                >
                  {myTeam === "alpha" ? "✓ " : ""}Alpha
                </button>
                <button
                  onClick={() => pickTeam("beta")}
                  className={`py-3 rounded-xl font-black text-sm border transition-all ${
                    myTeam === "beta"
                      ? "bg-orange-500/30 border-orange-500 text-orange-400 shadow-lg"
                      : "bg-orange-500/5 border-orange-500/20 text-orange-400/60 hover:bg-orange-500/15 hover:border-orange-500/40"
                  }`}
                >
                  {myTeam === "beta" ? "✓ " : ""}Beta
                </button>
              </div>
            </div>
          )}
          {gameMode === "quiz_boss_raid" && !gameStarted && (
            <div className="glass-card p-4 border-fuchsia-500/20 bg-fuchsia-500/5">
              <p className="text-xs font-bold text-fuchsia-400 mb-1">🧠👾 Quiz Boss Raid</p>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Work together to answer trivia questions and damage the boss before it wipes your party!
              </p>
            </div>
          )}
        </div>

        {/* ── Right Panel ─────────────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">

          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-text-primary">
              Lobby
              <span className={`ml-2 text-sm font-bold ${meta.color}`}>{meta.icon}</span>
            </h2>
            <span className="text-text-muted text-sm">
              {isHost ? "You are the host" : `${players.find((p) => p.isHost)?.username ?? ""} is the host`}
            </span>
          </div>

          {/* Player list */}
          <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
            {players.length === 0 ? (
              <div className="glass-card p-8 text-center text-text-muted">
                <div className="text-4xl mb-3">👀</div>
                <p className="font-medium">Waiting for players…</p>
                <p className="text-xs mt-1">Share the room code to invite friends</p>
              </div>
            ) : (
              players.map((player) => (
                <div key={player.id} className="flex items-center gap-2">
                  <div className="flex-1">
                    <PlayerCard
                      player={player}
                      mySessionId={room?.sessionId}
                    />
                  </div>
                  {/* Team badge — quiz_teams only */}
                  {isTeamMode && (
                    <div className={`shrink-0 w-14 text-center text-[11px] font-black py-1.5 rounded-lg border ${
                      player.preferredTeam === "alpha" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : player.preferredTeam === "beta"  ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                      : "bg-white/5 text-text-muted border-white/10"
                    }`}>
                      {player.preferredTeam === "alpha" ? "Alpha"
                        : player.preferredTeam === "beta" ? "Beta"
                        : "—"}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* ── Action Bar ────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border-subtle">

            {/* Ready toggle */}
            <button
              id="toggle-ready-btn"
              onClick={toggleReady}
              className={`flex-1 btn text-base py-3.5 transition-all
                ${isReady
                  ? "bg-success/20 text-success border border-success/40 hover:bg-danger/20 hover:text-danger hover:border-danger/40"
                  : "btn-success"
                }
              `}
            >
              {isReady ? (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Unready
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Ready Up
                </>
              )}
            </button>

            {/* canStart hint for team mode */}
            {isTeamMode && !canStart && players.length >= 2 && readyCount === players.length && (
              <p className="text-xs text-amber-400 text-center">
                ⚠ Both teams need at least 1 player
              </p>
            )}

            {/* Start Game — host only */}
            {isHost && (
              <button
                id="start-game-btn"
                onClick={startGame}
                disabled={!canStart}
                title={
                  !canStart
                    ? players.length < 2
                      ? "Need at least 2 players"
                      : "All players must be ready"
                    : "Start the game"
                }
                className={`flex-1 btn text-base py-3.5 transition-all
                  ${canStart
                    ? "btn-primary animate-pulse-glow"
                    : "bg-primary/10 text-primary/40 border border-primary/20 cursor-not-allowed"
                  }
                `}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {!canStart
                  ? players.length < 2
                    ? "Need 2+ players"
                    : `${players.length - readyCount} not ready`
                  : "Start Game"
                }
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}