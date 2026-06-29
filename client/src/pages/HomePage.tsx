import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { useRoom } from "../hooks/useRoom";
import toast from "react-hot-toast";

export default function HomePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { joinRoom } = useRoom();

  const [joinCode, setJoinCode] = useState("");
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [joinError, setJoinError] = useState("");

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

  return (
    <div className="min-h-screen flex bg-[#010103] text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-[#0d0d14] flex flex-col justify-between py-6 shrink-0 relative z-10 hidden md:flex">
        <div>
          <div className="flex items-center justify-center px-6 mb-8 mt-2 w-full">
            <img src="/logo.png" alt="Hashnet Logo" className="w-full h-28 object-contain scale-125 transform" />
          </div>

          <nav className="flex flex-col gap-1 px-4">
            <button onClick={() => navigate("/home")} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-600/20 text-violet-400 font-semibold transition-colors border border-violet-500/30">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              Home
            </button>
            <button onClick={() => navigate("/create-room")} className="flex items-center gap-3 px-4 py-3 rounded-xl text-emerald-400 hover:text-white hover:bg-emerald-600/20 transition-colors font-medium">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Games
            </button>
            <button onClick={() => navigate("/competitive/setup")} className="flex items-center gap-3 px-4 py-3 rounded-xl text-violet-400 hover:text-white hover:bg-violet-600/20 transition-colors font-medium">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              Practice
            </button>
            <button onClick={() => navigate("/chat")} className="flex items-center gap-3 px-4 py-3 rounded-xl text-blue-400 hover:text-white hover:bg-blue-600/20 transition-colors font-medium group">
              <svg className="w-5 h-5 group-hover:animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              AI Chat
            </button>
            <button onClick={() => navigate("/profile")} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors font-medium">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              Profile
            </button>
            {['Leaderboard', 'Store', 'Settings'].map((item) => (
              <button key={item} onClick={() => toast(`🚀 ${item} — Coming Soon!`, { icon: '⏳', duration: 3000 })} className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors font-medium">
                <div className="w-5 h-5 rounded-full border border-current opacity-70" />
                {item}
              </button>
            ))}
          </nav>
        </div>

        <div className="px-6">
          <div className="bg-[#151520] border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-orange-500">🔥</span>
              <span className="text-sm font-bold text-gray-300">Daily Streak</span>
            </div>
            <div className="text-3xl font-black text-white">15</div>
            <div className="text-xs text-gray-500 mb-3">Keep it up!</div>
            <div className="flex gap-1">
              <div className="h-1 w-6 bg-violet-500 rounded-full"></div>
              <div className="h-1 w-6 bg-violet-500 rounded-full"></div>
              <div className="h-1 w-6 bg-white/10 rounded-full"></div>
              <div className="h-1 w-6 bg-white/10 rounded-full"></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto relative">
        {/* Background Cyberpunk Element */}
        <div className="absolute top-0 right-0 w-[600px] h-[300px] bg-violet-600/10 blur-[120px] pointer-events-none rounded-full" />
        
        {/* Topbar */}
        <header className="flex justify-between items-center p-8 relative z-10">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              Welcome back, 
            </h1>
            <div className="text-5xl font-black bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent flex items-center gap-2 mt-1">
              {user?.username || "Guest"}
              <span className="text-pink-500">⚡</span>
            </div>
            <p className="text-gray-400 mt-2 font-medium">Ready to <span className="text-fuchsia-400">code</span>, <span className="text-blue-400">compete</span> and conquer?</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-600/30 border border-violet-500 flex items-center justify-center">
                <span className="text-lg font-bold">{user?.username?.[0]?.toUpperCase() || "G"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white flex items-center gap-1">
                  {user?.username}
                  <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </span>
                <span className="text-xs font-semibold text-fuchsia-400 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                  Master Coder
                </span>
              </div>
            </div>
            <button className="text-gray-400 hover:text-white relative">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-fuchsia-500 rounded-full border-2 border-[#010103]"></span>
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-sm font-semibold">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Logout
            </button>
          </div>
        </header>

        {/* Stats Banner */}
        <div className="px-8 mb-8 relative z-10">
          <div className="flex bg-[#11111a] border border-white/5 rounded-2xl divide-x divide-white/5 overflow-hidden shadow-2xl">
            <div className="flex-1 flex items-center gap-4 p-6 hover:bg-white/[0.02] transition-colors">
              <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center text-2xl border border-violet-500/20">🎮</div>
              <div>
                <p className="text-2xl font-black text-white">125</p>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Games Played</p>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-4 p-6 hover:bg-white/[0.02] transition-colors">
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center text-2xl border border-orange-500/20">🏆</div>
              <div>
                <p className="text-2xl font-black text-white">48</p>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Wins</p>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-4 p-6 hover:bg-white/[0.02] transition-colors">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center text-2xl border border-red-500/20">🔥</div>
              <div>
                <p className="text-2xl font-black text-white">15</p>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Win Streak</p>
              </div>
            </div>
            <div className="flex-1 flex items-center gap-4 p-6 hover:bg-white/[0.02] transition-colors">
              <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center text-2xl border border-yellow-500/20">⭐</div>
              <div>
                <p className="text-2xl font-black text-white">2500</p>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">XP Points</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Action Cards */}
        <div className="px-8 pb-12 grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 flex-1">
          
          {/* Competitive Programming */}
          <div className="flex flex-col rounded-3xl border border-fuchsia-500/30 bg-[#120a1c] overflow-hidden relative group shadow-[0_0_30px_-5px_rgba(217,70,239,0.15)] hover:shadow-[0_0_40px_0px_rgba(217,70,239,0.3)] transition-all duration-300">
            {/* Blended Background Illustration */}
            <div className="absolute right-0 top-0 bottom-0 w-[45%] pointer-events-none overflow-hidden hidden sm:block">
              <div 
                className="w-full h-full bg-[url('/images/mode0.png')] bg-cover bg-center opacity-70 mix-blend-lighten"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#120a1c] via-[#120a1c]/40 to-transparent" />
            </div>
            
            <div className="p-8 flex-1 flex flex-col relative z-10">
              <h2 className="text-2xl font-black text-white mb-1 leading-tight tracking-tight">COMPETITIVE<br/>PROGRAMMING</h2>
              <p className="text-fuchsia-400 font-bold text-xs uppercase tracking-wider mb-4 font-mono">Code. Compete. Conquer.</p>
              <p className="text-gray-400 text-sm mb-6 max-w-[85%] sm:max-w-[60%] md:max-w-full leading-relaxed">
                Solve Codeforces problems in an endless run. The more you solve, the higher you climb!
              </p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-gray-300 font-semibold">
                  <span className="text-orange-500 text-base">🔥</span> Endless Run
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300 font-semibold">
                  <span className="text-yellow-500 text-base">⚡</span> Improve Codeforces Rating
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300 font-semibold">
                  <span className="text-blue-400 text-base">📊</span> Track Your Progress
                </li>
              </ul>
              
              <div className="flex-1" />
              
              <button onClick={() => navigate("/competitive/setup")} className="w-full py-4 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-600/30 transition-all active:scale-[0.98] hover:scale-[1.02]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                START CODING
                <svg className="w-4 h-4 ml-1 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>

          {/* Create Room */}
          <div className="flex flex-col rounded-3xl border border-emerald-500/30 bg-[#0a1a14] overflow-hidden relative group shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)] hover:shadow-[0_0_40px_0px_rgba(16,185,129,0.3)] transition-all duration-300">
            {/* Blended Background Illustration */}
            <div className="absolute right-0 top-0 bottom-0 w-[45%] pointer-events-none overflow-hidden hidden sm:block">
              <div 
                className="w-full h-full bg-[url('/images/mode1.png')] bg-cover bg-center opacity-70 mix-blend-lighten"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a1a14] via-[#0a1a14]/40 to-transparent" />
            </div>
            
            <div className="p-8 flex-1 flex flex-col relative z-10">
              <h2 className="text-2xl font-black text-white mb-1 leading-tight tracking-tight">CREATE<br/>ROOM</h2>
              <p className="text-emerald-400 font-bold text-xs uppercase tracking-wider mb-4 font-mono">Host. Invite. Battle.</p>
              <p className="text-gray-400 text-sm mb-6 max-w-[85%] sm:max-w-[60%] md:max-w-full leading-relaxed">
                Create your own room, invite friends and set the rules of the game.
              </p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-gray-300 font-semibold">
                  <span className="text-emerald-500 text-base">⚙️</span> Customize Game Settings
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300 font-semibold">
                  <span className="text-emerald-500 text-base">👥</span> Invite Friends
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300 font-semibold">
                  <span className="text-emerald-500 text-base">🔒</span> Private or Public Room
                </li>
              </ul>
              
              <div className="flex-1" />
              
              <button onClick={() => navigate("/create-room")} className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all active:scale-[0.98] hover:scale-[1.02]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                CREATE ROOM
                <svg className="w-4 h-4 ml-1 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>

          {/* Join Room */}
          <div className="flex flex-col rounded-3xl border border-blue-500/30 bg-[#0a101c] overflow-hidden relative group shadow-[0_0_30px_-5px_rgba(59,130,246,0.15)] hover:shadow-[0_0_40px_0px_rgba(59,130,246,0.3)] transition-all duration-300">
            {/* Blended Background Illustration */}
            <div className="absolute right-0 top-0 bottom-0 w-[45%] pointer-events-none overflow-hidden hidden sm:block">
              <div 
                className="w-full h-full bg-[url('/images/mode2.png')] bg-cover bg-center opacity-70 mix-blend-lighten"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a101c] via-[#0a101c]/40 to-transparent" />
            </div>
            
            <div className="p-8 flex-1 flex flex-col relative z-10">
              <h2 className="text-2xl font-black text-white mb-1 leading-tight tracking-tight">JOIN<br/>ROOM</h2>
              <p className="text-blue-400 font-bold text-xs uppercase tracking-wider mb-4 font-mono">Join. Compete. Win.</p>
              <p className="text-gray-400 text-sm mb-6 max-w-[85%] sm:max-w-[60%] md:max-w-full leading-relaxed">
                Enter a room code and join exciting battles with players.
              </p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm text-gray-300 font-semibold">
                  <span className="text-blue-500 text-base">⌨️</span> Enter Room Code
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300 font-semibold">
                  <span className="text-blue-500 text-base">⚡</span> Quick Join
                </li>
                <li className="flex items-center gap-3 text-sm text-gray-300 font-semibold">
                  <span className="text-blue-500 text-base">🌐</span> Real-time Competition
                </li>
              </ul>
              
              <div className="flex-1" />
              
              <button onClick={() => setShowJoinModal(true)} className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] hover:scale-[1.02]">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                JOIN ROOM
                <svg className="w-4 h-4 ml-1 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>

        </div>
        
        {/* Quote Footer */}
        <div className="px-8 pb-8 flex justify-center w-full">
          <div className="flex items-center gap-4 text-gray-500 font-medium italic">
            <span className="text-fuchsia-500">✦</span>
            "It's not about being the best. It's about being better than you were yesterday."
            <span className="text-fuchsia-500">✦</span>
          </div>
        </div>

      </main>

      {/* Join Room Modal */}
      {showJoinModal && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={(e) => { if (e.target === e.currentTarget) setShowJoinModal(false); }}
        >
          <div className="bg-[#12121a] border border-blue-500/30 shadow-[0_0_50px_-10px_rgba(59,130,246,0.3)] rounded-2xl w-full max-w-sm p-8 animate-slide-up relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-white">Join Room</h2>
              <button
                onClick={() => { setShowJoinModal(false); setJoinCode(""); setJoinError(""); }}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {joinError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-5 flex items-start gap-2">
                <svg className="w-5 h-5 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {joinError}
              </div>
            )}

            <form onSubmit={handleJoinRoom}>
              <label htmlFor="room-code-input" className="block text-sm font-semibold text-gray-400 mb-2">Room Code</label>
              <input
                id="room-code-input"
                type="text"
                className="w-full bg-[#010103] border border-white/10 rounded-xl px-4 py-4 text-white font-mono text-2xl text-center tracking-widest uppercase mb-6 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600"
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
                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-transform active:scale-[0.98] disabled:opacity-50"
              >
                {loading === "join" ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Joining...
                  </>
                ) : (
                  <>
                    JOIN BATTLE
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}