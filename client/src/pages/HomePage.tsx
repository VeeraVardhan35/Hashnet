import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { useRoom } from "../hooks/useRoom";

export default function HomePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { createRoom, joinRoom, createBattleRoom, createTeamsRoom, createBossRaidRoom } = useRoom();

  const [joinCode, setJoinCode] = useState("");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [joinError, setJoinError] = useState("");

  const handleCreate = async (mode: string) => {
    setLoading(mode);
    try {
      if (mode === "quiz") await createRoom();
      else if (mode === "battle") await createBattleRoom();
      else if (mode === "teams") await createTeamsRoom();
      else if (mode === "boss_raid") await createBossRaidRoom();
    } catch (err) {
      console.error("Failed to create room:", err);
    } finally {
      setLoading(null);
    }
  };

  const handleJoinRoom = async (e: FormEvent) => {
    e.preventDefault();
    setJoinError("");
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) { setJoinError("Room code must be exactly 6 characters."); return; }
    setLoading("join");
    try {
      await joinRoom(code);
    } catch (err: any) {
      setJoinError(err?.message || "Could not find that room. Check the code and try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  const MODES = [
    {
      id: "quiz",
      icon: "🧠",
      title: "Quiz Battle",
      desc: "Lightning-fast MCQ rounds. First to answer wins points. Classic trivia chaos.",
      gradient: "from-violet-600 to-indigo-600",
      glow: "rgba(139,92,246,0.3)",
      glowHover: "rgba(139,92,246,0.55)",
      badge: "Up to 8 players",
    },
    {
      id: "battle",
      icon: "⚡",
      title: "Battle Royale",
      desc: "Solve DSA problems to survive. Wrong answers risk elimination each round. Last coder standing wins.",
      gradient: "from-red-600 to-pink-600",
      glow: "rgba(239,68,68,0.3)",
      glowHover: "rgba(239,68,68,0.55)",
      badge: "Elimination Mode",
    },
    {
      id: "teams",
      icon: "⚔️",
      title: "Teams Mode",
      desc: "Alpha vs Beta — compete as a team. Combined scores decide the winner across 5 coding rounds.",
      gradient: "from-emerald-600 to-cyan-600",
      glow: "rgba(16,185,129,0.3)",
      glowHover: "rgba(16,185,129,0.55)",
      badge: "Team vs Team",
    },
    {
      id: "boss_raid",
      icon: "👾",
      title: "Boss Raid",
      desc: "All players cooperate against an AI boss. Solve problems to deal damage. Survive boss attacks across 3 waves.",
      gradient: "from-purple-700 to-red-700",
      glow: "rgba(168,85,247,0.3)",
      glowHover: "rgba(168,85,247,0.55)",
      badge: "Co-op PvE",
      new: true,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-bg-base">

      {/* ── Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-bg-surface/60 backdrop-blur sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-glow">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
          </div>
          <span className="font-black text-text-primary text-lg tracking-tight">Hashet</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-accent/30 border border-primary/30 flex items-center justify-center text-sm font-bold text-primary">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <span className="text-text-secondary text-sm font-medium hidden sm:block">{user?.username}</span>
          </div>
          <button onClick={handleLogout} id="logout-btn" className="btn-ghost text-sm px-3 py-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:block">Logout</span>
          </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">

        {/* Hero */}
        <div className="text-center max-w-2xl mb-14 animate-slide-up">
          <div className="mb-4">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-accent uppercase tracking-widest bg-accent/10 border border-accent/20 px-4 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Choose your battleground
            </span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold mt-4 mb-4 leading-tight">
            Hey, <span className="text-gradient">{user?.username}</span> 👋
          </h1>
          <p className="text-text-secondary text-lg leading-relaxed">
            Pick a game mode, create a lobby, and invite your squad.
          </p>
        </div>

        {/* Mode Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 w-full max-w-5xl mb-10 animate-fade-in">
          {MODES.map((mode) => {
            const busy = loading === mode.id;
            return (
              <button
                key={mode.id}
                id={`create-${mode.id}-btn`}
                onClick={() => handleCreate(mode.id)}
                disabled={!!loading}
                className="relative group text-left p-6 rounded-2xl border border-white/10 bg-bg-surface/40 backdrop-blur transition-all duration-300
                  hover:border-white/20 hover:scale-[1.03] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden"
                style={{
                  boxShadow: `0 0 0 transparent`,
                  transition: "box-shadow 0.3s, transform 0.2s, border-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 0 28px ${mode.glowHover}`)}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 0 0 transparent")}
              >
                {/* gradient background blob */}
                <div className={`absolute -top-6 -right-6 w-28 h-28 rounded-full bg-gradient-to-br ${mode.gradient} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />

                {/* NEW badge */}
                {mode.new && (
                  <span className="absolute top-3 right-3 text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 border border-purple-500/40 uppercase tracking-widest">
                    NEW
                  </span>
                )}

                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center text-2xl bg-gradient-to-br ${mode.gradient} shadow-lg`}
                  style={{ boxShadow: `0 4px 16px ${mode.glow}` }}>
                  {busy ? (
                    <svg className="w-5 h-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : mode.icon}
                </div>

                {/* Text */}
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">{mode.badge}</p>
                <h2 className="text-base font-extrabold text-text-primary mb-2">{mode.title}</h2>
                <p className="text-xs text-text-secondary leading-relaxed">{mode.desc}</p>

                {/* CTA */}
                <div className={`mt-5 flex items-center gap-2 text-xs font-bold bg-gradient-to-r ${mode.gradient} bg-clip-text text-transparent`}>
                  {busy ? "Creating…" : "Create Room"}
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
            );
          })}
        </div>

        {/* Join existing room */}
        <button
          id="join-room-btn"
          onClick={() => setShowJoinModal(true)}
          className="btn-ghost text-base px-8 py-4 hover:scale-105 transition-transform border-accent/30 hover:border-accent/60 text-accent"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          Join Existing Room
        </button>
      </main>

      {/* Join Room Modal */}
      {showJoinModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setShowJoinModal(false); }}
        >
          <div className="glass-card-solid w-full max-w-sm p-8 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-text-primary">Join Room</h2>
              <button
                onClick={() => { setShowJoinModal(false); setJoinCode(""); setJoinError(""); }}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {joinError && (
              <div className="alert-error mb-5">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {joinError}
              </div>
            )}

            <form onSubmit={handleJoinRoom}>
              <label htmlFor="room-code-input" className="input-label">Room Code</label>
              <input
                id="room-code-input"
                type="text"
                className="input font-mono text-xl text-center tracking-widest uppercase mb-5"
                placeholder="XXXXXX"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                autoFocus
                autoComplete="off"
              />
              <button
                id="join-submit-btn"
                type="submit"
                disabled={loading === "join"}
                className="btn-accent w-full"
              >
                {loading === "join" ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Joining…
                  </>
                ) : "Join Room"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}