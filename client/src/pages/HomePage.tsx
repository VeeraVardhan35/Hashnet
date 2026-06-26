import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { useRoom } from "../hooks/useRoom";

export default function HomePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { createRoom, joinRoom, createBattleRoom } = useRoom();

  const [joinCode, setJoinCode] = useState("");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingBattle, setLoadingBattle] = useState(false);
  const [loadingJoin, setLoadingJoin] = useState(false);
  const [joinError, setJoinError] = useState("");

  // ── Create Room ───────────────────────────────────────────────
  const handleCreateRoom = async () => {
    setLoadingCreate(true);
    try {
      await createRoom();
    } catch (err) {
      console.error("Failed to create room:", err);
    } finally {
      setLoadingCreate(false);
    }
  };

  const handleCreateBattle = async () => {
    setLoadingBattle(true);
    try {
      await createBattleRoom();
    } catch (err) {
      console.error("Failed to create battle room:", err);
    } finally {
      setLoadingBattle(false);
    }
  };

  // ── Join Room ─────────────────────────────────────────────────
  const handleJoinRoom = async (e: FormEvent) => {
    e.preventDefault();
    setJoinError("");

    const code = joinCode.trim().toUpperCase();

    if (code.length !== 6) {
      setJoinError("Room code must be exactly 6 characters.");
      return;
    }

    setLoadingJoin(true);

    try {
      await joinRoom(code);
    } catch (err: any) {
      setJoinError(err?.message || "Could not find that room. Check the code and try again.");
    } finally {
      setLoadingJoin(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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
          <span className="font-bold text-text-primary text-lg tracking-tight">Hashet</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-accent/30 border border-primary/30 flex items-center justify-center text-sm font-bold text-primary">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <span className="text-text-secondary text-sm font-medium hidden sm:block">
              {user?.username}
            </span>
          </div>
          <button
            onClick={handleLogout}
            id="logout-btn"
            className="btn-ghost text-sm px-3 py-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:block">Logout</span>
          </button>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="text-center max-w-xl animate-slide-up">

          {/* Welcome */}
          <div className="mb-2">
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-accent uppercase tracking-widest bg-accent/10 border border-accent/20 px-4 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              Online
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold mt-6 mb-4 leading-tight">
            Hey,{" "}
            <span className="text-gradient">{user?.username}</span>
            <span className="text-text-primary"> 👋</span>
          </h1>

          <p className="text-text-secondary text-lg mb-12 leading-relaxed">
            Create a lobby and invite friends, or join an existing room with a code.
          </p>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
            <button
              id="create-room-btn"
              onClick={handleCreateRoom}
              disabled={loadingCreate || loadingBattle}
              className="btn-primary text-base px-8 py-4 shadow-glow hover:scale-105 transition-transform"
            >
              {loadingCreate ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating…
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Create Quiz
                </>
              )}
            </button>

            <button
              id="create-battle-btn"
              onClick={handleCreateBattle}
              disabled={loadingCreate || loadingBattle}
              className="flex items-center gap-2 justify-center px-8 py-4 rounded-xl font-bold text-base transition-all hover:scale-105 bg-gradient-to-r from-red-600 to-primary text-white shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingBattle ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating…
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                  Battle Royale
                </>
              )}
            </button>

            <button
              id="join-room-btn"
              onClick={() => setShowJoinModal(true)}
              className="btn-ghost text-base px-8 py-4 hover:scale-105 transition-transform border-accent/30 hover:border-accent/60 text-accent"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Join Room
            </button>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-20 w-full max-w-3xl animate-fade-in">
          {[
            {
              icon: "🎮",
              title: "Up to 8 players",
              desc: "Invite your whole squad to one lobby",
            },
            {
              icon: "⚡",
              title: "Real-time sync",
              desc: "Powered by Colyseus for instant state updates",
            },
            {
              icon: "🔐",
              title: "Secure rooms",
              desc: "Join only with a 6-character invite code",
            },
          ].map((f) => (
            <div key={f.title} className="glass-card p-5 text-center hover:border-primary/30 transition-all">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-text-primary mb-1">{f.title}</h3>
              <p className="text-xs text-text-secondary leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* ── Join Room Modal ────────────────────────────────────── */}
      {showJoinModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowJoinModal(false);
          }}
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
              <label htmlFor="room-code-input" className="input-label">
                Room Code
              </label>
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
                disabled={loadingJoin}
                className="btn-accent w-full"
              >
                {loadingJoin ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Joining…
                  </>
                ) : (
                  "Join Room"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}