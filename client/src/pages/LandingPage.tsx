import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/auth.store";

const FEATURES = [
  {
    num: "01", icon: "🧠", title: "QUIZ BATTLE", color: "violet",
    desc: "Challenge players in real-time quiz battles. Fast, think, smart.",
    bullets: ["Real-time duels", "Multiple topics", "XP & Coin rewards", "Mind-bending questions"],
    tag: "vs",
  },
  {
    num: "02", icon: "👥", title: "QUIZ TEAMS", color: "teal",
    desc: "Form your team and compete against other squads. Teamwork makes the dreamwork.",
    bullets: ["Team vs Team battles", "Coordinate strategies", "Shared team rewards", "Epic real-team rewards"],
    tag: "team",
  },
  {
    num: "03", icon: "👾", title: "QUIZ BOSS RAID", color: "fuchsia",
    desc: "Team up and fight powerful AI bosses. Every correct answer deals damage.",
    bullets: ["Epic boss battles", "Increase difficulty", "Legendary rewards", "Defeat bosses & rise"],
    tag: "raid",
  },
  {
    num: "04", icon: "⚡", title: "BATTLE ROYALE", color: "red",
    desc: "Every coder for themselves. Solve problems, survive eliminations, be the last one standing!",
    bullets: ["Fast coding eliminations", "Live score standings", "Power-ups & drops", "Huge prize pool"],
    tag: "solo",
  },
  {
    num: "05", icon: "⚔️", title: "CODE TEAMS", color: "emerald",
    desc: "Solve coding challenges together. Collaborate, divide and conquer.",
    bullets: ["Team coding challenges", "Real-time collaboration", "Team rankings", "Power-ups & strikes"],
    tag: "team",
  },
  {
    num: "06", icon: "👹", title: "CODE BOSS RAID", color: "purple",
    desc: "Take down massive code bosses by solving algo problems. Work together. Win together.",
    bullets: ["Multi-phase boss fights", "Special abilities", "Mythic rewards"],
    tag: "raid",
  },
];

const COLOR_MAP: Record<string, { border: string; text: string; glow: string; bg: string; tag: string }> = {
  violet:  { border: "border-violet-500/30",  text: "text-violet-400",  glow: "shadow-violet-500/20",  bg: "from-violet-600/20 to-transparent",  tag: "bg-violet-500/20 text-violet-300" },
  teal:    { border: "border-teal-500/30",    text: "text-teal-400",    glow: "shadow-teal-500/20",    bg: "from-teal-600/20 to-transparent",    tag: "bg-teal-500/20 text-teal-300"    },
  fuchsia: { border: "border-fuchsia-500/30", text: "text-fuchsia-400", glow: "shadow-fuchsia-500/20", bg: "from-fuchsia-600/20 to-transparent", tag: "bg-fuchsia-500/20 text-fuchsia-300" },
  red:     { border: "border-red-500/30",     text: "text-red-400",     glow: "shadow-red-500/20",     bg: "from-red-600/20 to-transparent",     tag: "bg-red-500/20 text-red-300"     },
  emerald: { border: "border-emerald-500/30", text: "text-emerald-400", glow: "shadow-emerald-500/20", bg: "from-emerald-600/20 to-transparent", tag: "bg-emerald-500/20 text-emerald-300" },
  purple:  { border: "border-purple-500/30",  text: "text-purple-400",  glow: "shadow-purple-500/20",  bg: "from-purple-600/20 to-transparent",  tag: "bg-purple-500/20 text-purple-300" },
};

export default function LandingPage() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#030308] text-white font-sans overflow-x-hidden">
      {/* Ambient background orbs */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[700px] h-[700px] rounded-full bg-violet-600/10 blur-[120px]" style={{ transform: `translateY(${scrollY * 0.15}px)` }} />
        <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/8 blur-[100px]" style={{ transform: `translateY(${scrollY * 0.1}px)` }} />
        <div className="absolute top-[60%] right-[-5%] w-[400px] h-[400px] rounded-full bg-fuchsia-600/8 blur-[100px]" style={{ transform: `translateY(${scrollY * 0.08}px)` }} />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 bg-[#030308]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Hashnet" className="h-16 w-auto object-contain" />
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-400">
          <button onClick={() => navigate(user ? "/home" : "/login")} className="hover:text-white transition-colors">Home</button>
          <button onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })} className="hover:text-white transition-colors">Features</button>
          <a href="https://github.com/Hashnet/Hashet" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">How It Works</a>
          <button onClick={() => toast("🚀 Leaderboard — Coming Soon!", { icon: '⏳', duration: 3000 })} className="hover:text-white transition-colors">Leaderboard</button>
          <button onClick={() => toast("🚀 Pricing — Coming Soon!", { icon: '⏳', duration: 3000 })} className="hover:text-white transition-colors">Pricing</button>
          <a href="https://github.com/Hashnet/Hashet" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">About</a>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/login")} className="px-5 py-2 text-sm font-bold text-gray-300 hover:text-white transition-colors">
            Log in
          </button>
          <button onClick={() => navigate("/register")} className="px-5 py-2 text-sm font-black text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-xl shadow-lg shadow-violet-600/30 transition-all">
            Play Now
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-center justify-center text-center pt-20 px-4 overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />


        <div className="relative z-10 max-w-5xl mx-auto" style={{ transform: `translateY(${scrollY * -0.1}px)` }}>
          <h1 className="text-7xl md:text-9xl font-black leading-[0.9] tracking-tighter mb-4">
            <span className="text-white block">CODE.</span>
            <span className="block bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">COMPETE.</span>
            <span className="text-white block">CONQUER.</span>
          </h1>
          <p className="text-gray-400 text-xl mt-6 mb-10 max-w-xl mx-auto">
            The ultimate platform for coders.<br />Battles, challenges and glory await.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button onClick={() => navigate("/register")} className="px-8 py-4 text-base font-black text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-2xl shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all hover:scale-105 active:scale-95">
              Play Now
            </button>
            <button onClick={() => toast("🎬 Trailer — Coming Soon!", { icon: '⏳', duration: 3000 })} className="px-8 py-4 text-base font-bold text-white bg-white/5 border border-white/15 hover:bg-white/10 rounded-2xl transition-all flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              </div>
              Watch Trailer
            </button>
          </div>

          <p className="text-gray-600 text-xs mt-8 flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            Scroll to explore
          </p>
        </div>

        {/* Silhouette figure (CSS art) */}
        <div className="absolute right-8 bottom-0 opacity-20 pointer-events-none hidden xl:block">
          <div className="w-64 h-96 relative">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-80 bg-gradient-to-t from-violet-500/80 to-transparent rounded-t-full blur-sm" />
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="relative max-w-7xl mx-auto px-6 py-20 space-y-12">
        {FEATURES.map((feat, idx) => {
          const colors = COLOR_MAP[feat.color];
          const isRight = idx % 2 === 1;
          return (
            <div key={feat.num} className={`flex flex-col md:flex-row ${isRight ? "md:flex-row-reverse" : ""} gap-8 items-center group`}>
              {/* Text side */}
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-4">
                  <span className={`text-4xl font-black ${colors.text} opacity-40`}>{feat.num}</span>
                  <span className={`text-xs font-black px-3 py-1 rounded-full ${colors.tag}`}>{feat.tag.toUpperCase()}</span>
                </div>
                <h2 className={`text-4xl font-black text-white flex items-center gap-3`}>
                  <span>{feat.icon}</span> {feat.title}
                </h2>
                <p className="text-gray-400 text-lg leading-relaxed">{feat.desc}</p>
                <ul className="space-y-2">
                  {feat.bullets.map((b, i) => (
                    <li key={i} className={`flex items-center gap-3 text-sm font-semibold text-gray-300`}>
                      <span className={`w-5 h-5 rounded-full ${colors.bg.split(" ")[0]} ${colors.text} flex items-center justify-center text-xs`}>✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
                <button onClick={() => navigate("/register")} className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border ${colors.border} ${colors.text} bg-white/5 hover:bg-white/10 transition-all`}>
                  Learn More <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>

              {/* Visual card side */}
              <div className={`flex-1 rounded-3xl border ${colors.border} bg-[#0d0d18] overflow-hidden shadow-[0_0_40px_-10px] ${colors.glow} relative group-hover:scale-[1.01] transition-transform duration-300`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${colors.bg} opacity-40 pointer-events-none`} />
                <div className="p-8 min-h-[220px] flex flex-col justify-between relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`text-4xl`}>{feat.icon}</div>
                    <span className={`text-xs font-black px-3 py-1.5 rounded-lg ${colors.tag}`}>{feat.title}</span>
                  </div>
                  {/* Mock UI preview */}
                  <div className="space-y-2">
                    {[85, 62, 45].map((w, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${colors.bg.split(" ")[0]} flex items-center justify-center text-xs font-bold ${colors.text}`}>{i + 1}</div>
                        <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full bg-gradient-to-r ${feat.color === "violet" ? "from-violet-500 to-fuchsia-500" : feat.color === "teal" ? "from-teal-500 to-emerald-500" : feat.color === "fuchsia" ? "from-fuchsia-500 to-pink-500" : feat.color === "red" ? "from-red-500 to-orange-500" : feat.color === "emerald" ? "from-emerald-500 to-teal-500" : "from-purple-500 to-violet-500"}`} style={{ width: `${w}%` }} />
                        </div>
                        <span className={`text-xs font-bold ${colors.text}`}>{w}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* AI Mentor */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-[#080d1e] to-[#030308] p-12 flex flex-col md:flex-row items-center gap-10 relative overflow-hidden shadow-[0_0_60px_-20px_rgba(59,130,246,0.3)]">
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="flex-1 relative z-10">
            <div className="text-6xl mb-6">🤖</div>
            <h2 className="text-4xl font-black text-white mb-4">AI MENTOR</h2>
            <p className="text-gray-400 text-lg mb-6">Learn through conversational AI that understands your documents. Get explanations, hints, and analysis 24/7.</p>
            <ul className="space-y-3 mb-8">
              {["Upload your study materials", "Hints & guidance", "Analyze your code", "Available 24/7"].map((b) => (
                <li key={b} className="flex items-center gap-3 text-sm font-semibold text-gray-300">
                  <span className="text-blue-400">✓</span> {b}
                </li>
              ))}
            </ul>
            <button onClick={() => navigate("/register")} className="px-6 py-3 font-bold text-sm text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all">
              Start Learning
            </button>
          </div>
          {/* AI chat bubble preview */}
          <div className="flex-1 relative z-10 max-w-sm w-full">
            <div className="rounded-2xl border border-white/10 bg-[#12121a] p-4 space-y-3">
              {[{ ai: false, msg: "What is time complexity of binary search?" }, { ai: true, msg: "Binary search runs in O(log n) time because it halves the search space each step..." }].map((m, i) => (
                <div key={i} className={`flex ${m.ai ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[85%] rounded-xl p-3 text-sm ${m.ai ? "bg-[#1a1a2e] border border-blue-500/20 text-gray-300" : "bg-blue-600 text-white"}`}>{m.msg}</div>
                </div>
              ))}
              <div className="flex items-center gap-2 bg-[#010103] rounded-xl px-3 py-2 border border-white/5">
                <input className="flex-1 bg-transparent text-xs text-gray-400 outline-none" placeholder="Ask me anything..." readOnly />
                <button className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Leaderboards */}
      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-[#100e00] to-[#030308] p-12 relative overflow-hidden shadow-[0_0_60px_-20px_rgba(234,179,8,0.2)]">
          <div className="absolute top-0 left-0 w-80 h-80 bg-yellow-600/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="flex flex-col md:flex-row items-start gap-10 relative z-10">
            <div className="flex-1">
              <div className="text-6xl mb-4">🏆</div>
              <h2 className="text-4xl font-black text-white mb-4">GLOBAL LEADERBOARDS</h2>
              <p className="text-gray-400 text-lg mb-6">Compete with coders from around the world. Climb the ranks and be the legend.</p>
              <ul className="space-y-2 mb-6">
                {["Global rankings", "Friends & college rankings", "Seasonal leaderboards", "XP & reward leaders"].map((b) => (
                  <li key={b} className="flex items-center gap-3 text-sm font-semibold text-gray-300">
                    <span className="text-yellow-400">✓</span> {b}
                  </li>
                ))}
              </ul>
              <button onClick={() => navigate("/register")} className="px-6 py-3 font-bold text-sm text-white bg-yellow-600 hover:bg-yellow-500 rounded-xl transition-all">
                See Rankings
              </button>
            </div>
            {/* Leaderboard preview */}
            <div className="flex-1 max-w-sm w-full">
              <div className="rounded-2xl border border-white/10 bg-[#12121a] overflow-hidden">
                {[{ rank: 1, name: "CodeNinja", pts: 9850, medal: "🥇" }, { rank: 2, name: "NightRyder", pts: 9210, medal: "🥈" }, { rank: 3, name: "NexCode", pts: 8740, medal: "🥉" }].map((u) => (
                  <div key={u.rank} className="flex items-center gap-4 px-5 py-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                    <span className="text-xl">{u.medal}</span>
                    <div className="flex-1">
                      <p className="font-bold text-white">{u.name}</p>
                    </div>
                    <span className="text-yellow-400 font-black text-sm">{u.pts.toLocaleString()} pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-24 px-6 text-center relative">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[300px] bg-violet-600/15 blur-[100px] rounded-full" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-5xl font-black text-white mb-4">READY TO <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">CONQUER?</span></h2>
          <p className="text-gray-400 mb-10 text-lg">Join thousands of coders and start your journey today!</p>
          <button onClick={() => navigate("/register")} className="px-10 py-5 text-base font-black text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 rounded-2xl shadow-[0_0_40px_rgba(139,92,246,0.4)] transition-all hover:scale-105 active:scale-95">
            Play Now
          </button>
        </div>
      </section>
    </div>
  );
}
