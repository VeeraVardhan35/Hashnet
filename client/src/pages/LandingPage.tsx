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
      <section ref={heroRef} className="relative min-h-screen flex flex-col items-start justify-center pt-24 pb-16 px-8 md:px-16 lg:px-24 overflow-hidden bg-[#030308]">
        {/* Full-Screen Background Image (Second Image) */}
        <div className="absolute right-0 top-0 bottom-0 w-full lg:w-[65%] pointer-events-none z-0 overflow-hidden">
          <div 
            className="w-full h-full bg-[url('/images/landing_bg.jpg')] bg-cover bg-center opacity-70"
          />
          {/* Subtle fade grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
          {/* Horizontal fade to solid landing background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#030308] via-[#030308]/50 to-transparent" />
          {/* Vertical fade to bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#030308] to-transparent" />
        </div>

        {/* Content Container (Left-aligned) */}
        <div className="relative z-10 max-w-xl md:max-w-2xl text-left" style={{ transform: `translateY(${scrollY * -0.05}px)` }}>
          <h1 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter mb-6 text-left">
            <span className="text-white block">CODE.</span>
            <span className="block bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">COMPETE.</span>
            <span className="text-white block">CONQUER.</span>
          </h1>
          
          <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-lg leading-relaxed">
            The ultimate platform for coders.<br />
            Battles, challenges and glory await.
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            <button onClick={() => navigate("/register")} className="px-8 py-4 rounded-full font-black text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all hover:scale-105 active:scale-95 flex items-center gap-3">
              Start Your Journey
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
            <button onClick={() => toast("🎬 Trailer — Coming Soon!", { icon: '⏳', duration: 3000 })} className="px-8 py-4 rounded-full font-bold text-white bg-[#030308]/60 border border-white/15 hover:bg-white/10 transition-all flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              </div>
              Play Demo
            </button>
          </div>

          {/* Gamified Live User Badge */}
          <div className="inline-flex items-center gap-2 bg-[#030308]/60 border border-white/5 rounded-full px-4 py-2 mt-8 text-xs font-semibold text-gray-400 z-10 backdrop-blur-md">
            <span className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-wider text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          </div>
        </div>

        {/* Bouncing Scroll Indicator at the bottom center */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-gray-600 text-xs flex items-center gap-2 z-10 pointer-events-none">
          <svg className="w-4 h-4 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          Scroll to explore
        </div>
      </section>

      {/* Overview / What is Hashnet? */}
      <section className="relative max-w-7xl mx-auto px-6 py-20 border-y border-white/5 bg-[#030308]">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-violet-600/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Heading and description */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-8 text-left">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-black tracking-wider uppercase mb-6">
                ✦ DISCOVER HASHNET
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight text-white mb-6">
                The Next <br/>
                Evolution of <br/>
                <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">Interactive <br/>Learning</span>
              </h2>
              <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-8">
                Hashnet blends real-time multiplayer gaming mechanics with industry-grade software development practices. Whether you are prepping for interviews, training your team, or mastering data structures, Hashnet makes code education cooperative, competitive, and highly addictive.
              </p>
            </div>
            
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 rounded-2xl border border-white/5 bg-[#12121a]/40 backdrop-blur-md">
                  <div className="text-2xl">👥</div>
                  <div>
                    <div className="font-black text-white text-lg leading-none">125K+</div>
                    <div className="text-xs text-gray-500 font-semibold mt-1">Active Coders</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-2xl border border-white/5 bg-[#12121a]/40 backdrop-blur-md">
                  <div className="text-2xl text-violet-400">⚡</div>
                  <div>
                    <div className="font-black text-white text-lg leading-none">2.5M+</div>
                    <div className="text-xs text-gray-500 font-semibold mt-1">Battles Played</div>
                  </div>
                </div>
              </div>

              <button onClick={() => navigate("/register")} className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm border border-violet-500/30 text-violet-400 hover:text-white hover:bg-violet-600/20 transition-all mr-auto">
                Explore All Features
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>

          {/* Right Column: Top two cards */}
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Agentic AI & RAG Mentor */}
            <div className="relative rounded-3xl border border-white/5 bg-[#06060c] p-8 flex flex-col justify-between overflow-hidden group min-h-[320px] shadow-[0_0_30px_-10px_rgba(124,58,237,0.1)] hover:border-violet-500/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/10 blur-[60px] rounded-full pointer-events-none" />
              
              <div className="relative z-10 flex-1 flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center text-2xl mb-4 border border-violet-500/20">🤖</div>
                <h3 className="text-xl font-bold text-white mb-2 leading-tight">Agentic AI &<br/>RAG Mentor</h3>
                <span className="inline-block text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20 mb-4 mr-auto">AI Powered</span>
                <p className="text-gray-400 text-xs leading-relaxed max-w-[55%]">
                  Unlock deeper insights with our built-in AI Guide. It analyzes uploaded documentation and code context (RAG) to provide hints, conceptual breakdowns, and step-by-step guidance.
                </p>
              </div>

              {/* Float Illustration */}
              <div className="absolute right-[-10%] bottom-[-5%] w-[55%] h-[75%] pointer-events-none">
                <img src="/images/mode10.png" alt="RAG AI Illustration" className="w-full h-full object-contain mix-blend-lighten opacity-80 transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#06060c] via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#06060c] via-transparent to-transparent" />
              </div>

              <button onClick={() => navigate("/register")} className="text-xs font-bold text-violet-400 flex items-center gap-1 hover:text-white transition-colors relative z-10 mt-6">
                Learn more <span className="transition-transform group-hover:translate-x-1">→</span>
              </button>
            </div>

            {/* Colyseus Multiplayer Engine */}
            <div className="relative rounded-3xl border border-white/5 bg-[#050b08] p-8 flex flex-col justify-between overflow-hidden group min-h-[320px] shadow-[0_0_30px_-10px_rgba(16,185,129,0.1)] hover:border-emerald-500/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-600/10 blur-[60px] rounded-full pointer-events-none" />
              
              <div className="relative z-10 flex-1 flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-emerald-600/20 flex items-center justify-center text-2xl mb-4 border border-emerald-500/20">🖥️</div>
                <h3 className="text-xl font-bold text-white mb-2 leading-tight">Colyseus Multiplayer<br/>Engine</h3>
                <span className="inline-block text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 mb-4 mr-auto">Real-Time</span>
                <p className="text-gray-400 text-xs leading-relaxed max-w-[55%]">
                  Powered by a high-throughput Colyseus.js state-synchronization protocol. Every keystroke in multiplayer coding rooms, every choice in quiz duels, and every boss attack is synchronized instantly.
                </p>
              </div>

              {/* Float Illustration */}
              <div className="absolute right-[-10%] bottom-[-5%] w-[55%] h-[75%] pointer-events-none">
                <img src="/images/mode11.png" alt="Colyseus Illustration" className="w-full h-full object-contain mix-blend-lighten opacity-80 transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050b08] via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#050b08] via-transparent to-transparent" />
              </div>

              <button onClick={() => navigate("/register")} className="text-xs font-bold text-emerald-400 flex items-center gap-1 hover:text-white transition-colors relative z-10 mt-6">
                Learn more <span className="transition-transform group-hover:translate-x-1">→</span>
              </button>
            </div>

          </div>

          {/* Row 2: Gamified, Matchmaking, and Co-op Card */}
          <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-12 gap-6 mt-2">
            
            {/* Gamified Progression */}
            <div className="md:col-span-3 relative rounded-3xl border border-white/5 bg-[#06060c] p-6 flex flex-col justify-between overflow-hidden group min-h-[300px] hover:border-violet-500/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-36 h-36 bg-violet-600/5 blur-[50px] rounded-full pointer-events-none" />
              
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-lg bg-violet-600/20 flex items-center justify-center text-xl mb-4 border border-violet-500/20">🎮</div>
                <h3 className="text-lg font-bold text-white mb-2 leading-tight">Gamified<br/>Progression</h3>
                <p className="text-gray-400 text-xs leading-relaxed max-w-[70%]">
                  Earn XP, complete daily code quests, unlock achievements, and climb global leaderboards.
                </p>
              </div>

              {/* Float Illustration */}
              <div className="absolute right-[-10%] bottom-[-5%] w-[60%] h-[55%] pointer-events-none">
                <img src="/images/mode7.png" alt="Progression" className="w-full h-full object-contain mix-blend-lighten opacity-75 transition-transform duration-750 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#06060c] via-transparent to-transparent" />
              </div>
            </div>

            {/* Realtime Matchmaking */}
            <div className="md:col-span-3 relative rounded-3xl border border-white/5 bg-[#0a050c] p-6 flex flex-col justify-between overflow-hidden group min-h-[300px] hover:border-pink-500/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-36 h-36 bg-pink-600/5 blur-[50px] rounded-full pointer-events-none" />
              
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-lg bg-pink-600/20 flex items-center justify-center text-xl mb-4 border border-pink-500/20">🚀</div>
                <h3 className="text-lg font-bold text-white mb-2 leading-tight">Realtime<br/>Matchmaking</h3>
                <p className="text-gray-400 text-xs leading-relaxed max-w-[70%]">
                  Join lobby rooms instantly with friends or online rivals. Smart matchmaking ensures balanced and exciting battles.
                </p>
              </div>

              {/* Float Illustration */}
              <div className="absolute right-[-10%] bottom-[-5%] w-[60%] h-[55%] pointer-events-none">
                <img src="/images/mode8.png" alt="Matchmaking" className="w-full h-full object-contain mix-blend-lighten opacity-75 transition-transform duration-750 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a050c] via-transparent to-transparent" />
              </div>
            </div>

            {/* Co-op & Raid Modes (MMORPG for Coders) */}
            <div className="md:col-span-6 relative rounded-3xl border border-white/5 bg-[#0c0612] p-8 flex flex-col md:flex-row justify-between items-center overflow-hidden group min-h-[300px] hover:border-fuchsia-500/30 transition-all duration-300">
              <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-600/10 blur-[85px] rounded-full pointer-events-none" />
              
              <div className="flex-1 space-y-4 relative z-10 text-left">
                <div className="w-10 h-10 rounded-lg bg-fuchsia-600/20 flex items-center justify-center text-xl border border-fuchsia-500/20">⚔️</div>
                <h3 className="text-xl font-bold text-white mb-1">Co-op & Raid Modes<br/>(MMORPG for Coders)</h3>
                <span className="inline-block text-[10px] font-black tracking-wider uppercase px-2.5 py-1 rounded bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/20 mb-3">Co-Op</span>
                <p className="text-gray-400 text-xs leading-relaxed max-w-sm">
                  Tackle algorithm problems or tricky system design quizzes as a guild. Team up with friends to deal damage to high-HP "AI Code Bosses" by writing optimized solutions. Coordinate roles, share strategies, and reap legendary rewards together.
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <button onClick={() => navigate("/register")} className="text-xs font-bold text-fuchsia-400 flex items-center gap-1 hover:text-white transition-colors">
                    Learn more <span className="transition-transform group-hover:translate-x-1">→</span>
                  </button>
                  <div className="flex items-center gap-3 pl-4 border-l border-white/10 text-lg">
                    <span className="hover:scale-125 transition-transform" title="Trophy">🏆</span>
                    <span className="hover:scale-125 transition-transform" title="Gem">💎</span>
                    <span className="text-xs font-black px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 select-none">XP</span>
                    <span className="hover:scale-125 transition-transform" title="Chest">🎁</span>
                  </div>
                </div>
              </div>

              {/* Boss Raid Graphic */}
              <div className="w-full max-w-xs md:max-w-none md:w-[45%] h-64 pointer-events-none relative mt-4 md:mt-0">
                <img src="/images/mode5.png" alt="Raid Boss Fight" className="w-full h-full object-contain mix-blend-lighten opacity-95 rounded-2xl transition-transform duration-750 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0612] via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0c0612] via-transparent to-transparent" />
              </div>
            </div>

          </div>

          {/* Bottom Bar: Horizontal items */}
          <div className="lg:col-span-12 mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4 bg-[#050510]/80 border border-white/5 rounded-2xl p-4 divide-y lg:divide-y-0 lg:divide-x divide-white/5">
            {[
              { icon: "🎯", title: "Learn by Competing", desc: "Sharpen skills in real battles" },
              { icon: "👥", title: "Build Together", desc: "Code, collaborate, conquer" },
              { icon: "🏆", title: "Climb & Conquer", desc: "Prove your skills, be the best" },
              { icon: "🛡️", title: "Trusted by Coders", desc: "Built for coders, by coders" }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-6 py-2 first:pt-2 first:lg:pt-2 lg:py-2">
                <span className="text-2xl">{item.icon}</span>
                <div className="text-left">
                  <h4 className="text-sm font-bold text-white leading-none">{item.title}</h4>
                  <p className="text-xs text-gray-500 font-semibold mt-1.5">{item.desc}</p>
                </div>
              </div>
            ))}
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

      {/* Real Footer */}
      <footer className="bg-[#030308] border-t border-white/5 pt-16 pb-8 mt-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10 mb-16">
            {/* Column 1: Brand */}
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src="/logo.png" alt="Hashnet" className="h-10 w-auto object-contain" />
              </div>
              <p className="text-white font-bold mb-4">Learn. Practice. Compete. Succeed.</p>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed max-w-sm">
                The all-in-one platform to learn, practice, compete and crack your dream job.
              </p>
              <div className="flex items-center gap-4">
                {/* Social Icons */}
                <a href={import.meta.env.VITE_GITHUB_URL || "#"} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
                </a>
                <a href={import.meta.env.VITE_DISCORD_URL || "#"} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" /></svg>
                </a>
                <a href={import.meta.env.VITE_INSTAGRAM_URL || "#"} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                </a>
                <a href={import.meta.env.VITE_LINKEDIN_URL || "#"} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a href={import.meta.env.VITE_YOUTUBE_URL || "#"} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
              </div>
            </div>

            {/* Column 2: Platform */}
            <div className="col-span-1">
              <h3 className="text-white font-bold mb-4">Platform</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Home</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Coding</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Quiz</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Leaderboard</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">AI Mentor</a></li>
              </ul>
            </div>

            {/* Column 3: Resources */}
            <div className="col-span-1">
              <h3 className="text-white font-bold mb-4">Resources</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Articles</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Roadmaps</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Study Notes</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Downloads</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Company Prep</a></li>
              </ul>
            </div>

            {/* Column 4: Support */}
            <div className="col-span-1">
              <h3 className="text-white font-bold mb-4">Support</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Feedback</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Report Bug</a></li>
              </ul>
            </div>

            {/* Column 5: Legal */}
            <div className="col-span-1">
              <h3 className="text-white font-bold mb-4">Legal</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-center justify-between pt-8 border-t border-white/5 gap-6 text-center lg:text-left">
            <p className="text-gray-500 text-sm font-medium">© 2026 HashNet. All rights reserved.</p>
            <p className="text-gray-500 text-sm font-medium">Built with <span className="text-red-500">❤️</span> by Veeravardhan for future Software Engineers.</p>
            <div className="w-12 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-mono text-sm font-bold shadow-[0_0_15px_rgba(139,92,246,0.2)]">
              {"</>"}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
