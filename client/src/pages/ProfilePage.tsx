import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  if (!user) {
    navigate("/login");
    return null;
  }

  const initials = user.username.slice(0, 2).toUpperCase();
  const joinDate = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="min-h-screen bg-[#010103] text-white font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-fuchsia-600/8 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl">
        {/* Back button */}
        <button onClick={() => navigate("/home")} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-semibold mb-8 group">
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Home
        </button>

        {/* Card */}
        <div className="rounded-3xl border border-white/10 bg-[#12121a] overflow-hidden shadow-[0_0_40px_-10px_rgba(139,92,246,0.2)]">
          {/* Header banner */}
          <div className="h-28 bg-gradient-to-r from-violet-600/40 via-fuchsia-600/30 to-indigo-600/40 relative">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
          </div>

          {/* Avatar + info */}
          <div className="px-8 pb-8 -mt-12">
            <div className="flex items-end gap-6 mb-6">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-3xl font-black border-4 border-[#12121a] shadow-xl shadow-violet-600/30">
                {initials}
              </div>
              <div className="mb-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-black text-white">{user.username}</h1>
                  {user.isAdmin && (
                    <span className="text-xs font-black px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">ADMIN</span>
                  )}
                </div>
                <p className="text-gray-400 text-sm mt-0.5">Member since {joinDate}</p>
              </div>
            </div>

            {/* Info fields */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#010103] border border-white/5">
                <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center text-violet-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Username</p>
                  <p className="text-white font-bold">{user.username}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#010103] border border-white/5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Email</p>
                  <p className="text-white font-bold">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#010103] border border-white/5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Account Role</p>
                  <p className="text-white font-bold">{user.isAdmin ? "Administrator" : "Player"}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#010103] border border-white/5">
                <div className="w-10 h-10 rounded-xl bg-fuchsia-500/15 flex items-center justify-center text-fuchsia-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Account ID</p>
                  <p className="text-white font-mono text-sm">{user.id}</p>
                </div>
              </div>
            </div>

            {/* Stats (placeholder) */}
            <div className="grid grid-cols-3 gap-3 mt-6">
              {[{ label: "Games Played", val: "—", icon: "🎮" }, { label: "Total Wins", val: "—", icon: "🏆" }, { label: "Win Streak", val: "—", icon: "🔥" }].map((s) => (
                <div key={s.label} className="text-center p-4 rounded-2xl bg-[#010103] border border-white/5">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <p className="text-xl font-black text-white">{s.val}</p>
                  <p className="text-xs text-gray-500 font-semibold">{s.label}</p>
                </div>
              ))}
            </div>

            <button onClick={handleLogout} className="mt-6 w-full py-4 rounded-2xl border border-red-500/30 text-red-400 font-bold text-sm hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
