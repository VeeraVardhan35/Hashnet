import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../store/auth.store";
import { useRoom } from "../hooks/useRoom";

type ContentCategory = "quiz" | "code";
type GameMode = "quiz" | "quiz_teams" | "quiz_boss_raid" | "battle" | "teams" | "boss_raid";

const CATEGORIES: Record<ContentCategory, { id: GameMode; title: string; desc: string; icon: string; color: string; gradient: string }[]> = {
  quiz: [
    { id: "quiz", title: "Quiz Battle", desc: "1v1 quiz battle. Be the smartest!", icon: "🧠", color: "text-violet-400", gradient: "from-violet-600 to-indigo-600" },
    { id: "quiz_teams", title: "Quiz Teams", desc: "Team up and answer together!", icon: "👥", color: "text-teal-400", gradient: "from-teal-500 to-emerald-600" },
    { id: "quiz_boss_raid", title: "Quiz Boss Raid", desc: "Take on the boss and earn epic rewards!", icon: "👾", color: "text-fuchsia-400", gradient: "from-fuchsia-600 to-pink-600" },
  ],
  code: [
    { id: "battle", title: "Battle Royale", desc: "Every coder for themselves. Last one wins!", icon: "⚡", color: "text-red-400", gradient: "from-red-600 to-pink-600" },
    { id: "teams", title: "Teams Mode", desc: "Collaborate with your team and dominate!", icon: "⚔️", color: "text-emerald-400", gradient: "from-emerald-600 to-cyan-600" },
    { id: "boss_raid", title: "Code Boss Raid", desc: "Defeat the coding boss and climb the ranks!", icon: "👾", color: "text-purple-400", gradient: "from-purple-600 to-fuchsia-600" },
  ]
};

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const aiCategory = searchParams.get("aiCategory");
  
  const user = useAuthStore((s) => s.user);
  const { createRoom, createBattleRoom, createTeamsRoom, createBossRaidRoom, createQuizTeamsRoom, createQuizBossRaidRoom } = useRoom();

  const [category, setCategory] = useState<ContentCategory>("quiz");
  const [mode, setMode] = useState<GameMode>("quiz");
  const [loading, setLoading] = useState(false);

  // Settings mock state
  const [questionsCount, setQuestionsCount] = useState(10);
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [difficulty, setDifficulty] = useState("Mixed");
  const [categories, setCategories] = useState(aiCategory ? "My AI Content" : "All Categories");

  useEffect(() => {
    if (aiCategory) {
      setCategories("My AI Content");
    }
  }, [aiCategory]);
  const [allowSpectators, setAllowSpectators] = useState(true);
  const [privateRoom, setPrivateRoom] = useState(false);

  // Dynamic categories from DB
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [dbTags, setDbTags] = useState<string[]>([]);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:2567/api";
    fetch(`${apiUrl}/quiz/categories`)
      .then((r) => r.json())
      .then((d) => setDbCategories(d.categories || []))
      .catch(() => {});
    fetch(`${apiUrl}/problems/tags`)
      .then((r) => r.json())
      .then((d) => setDbTags(d.tags || []))
      .catch(() => {});
  }, []);

  // Auto-select first mode when switching categories
  const handleCategorySwitch = (cat: ContentCategory) => {
    setCategory(cat);
    setMode(CATEGORIES[cat][0].id);
  };

  const handleCreateContent = async () => {
    setLoading(true);
    const options = {
      questionsCount,
      timePerQuestion,
      difficulty,
      category: categories === "My AI Content" ? aiCategory : categories,
      allowSpectators,
      privateRoom
    };
    
    try {
      if (mode === "quiz") await createRoom(options);
      else if (mode === "battle") await createBattleRoom(options);
      else if (mode === "teams") await createTeamsRoom(options);
      else if (mode === "boss_raid") await createBossRaidRoom(options);
      else if (mode === "quiz_teams") await createQuizTeamsRoom(options);
      else if (mode === "quiz_boss_raid") await createQuizBossRaidRoom(options);
    } catch (err) {
      console.error("Failed to create room:", err);
    } finally {
      setLoading(false);
    }
  };

  const activeModeDetails = CATEGORIES[category].find((m) => m.id === mode);

  return (
    <div className="min-h-screen bg-[#010103] text-white font-sans overflow-hidden flex flex-col">
      
      {/* Background Cyberpunk Element */}
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-emerald-900/20 to-transparent pointer-events-none" />
      <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-emerald-600/10 blur-[150px] pointer-events-none rounded-full" />

      {/* Header */}
      <header className="flex items-center gap-6 p-8 relative z-10 border-b border-white/5 bg-[#010103]/80 backdrop-blur-md">
        <button onClick={() => navigate("/home")} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center transition-colors">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-3xl font-black text-white tracking-wider flex items-center gap-3">
            CREATE ROOM
            <span className="text-emerald-500">❖</span>
          </h1>
          <p className="text-gray-400 mt-1 font-medium text-sm">Configure your game settings and invite players.</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden relative z-10 p-4 sm:p-8 gap-8 max-w-[1600px] mx-auto w-full custom-scrollbar">
        
        {/* LEFT COLUMN: Mode Selection & Settings */}
        <div className="flex-1 overflow-y-auto lg:pr-4 space-y-8 pb-4 lg:pb-12 custom-scrollbar">
          
          {/* Top Banner specific to category */}
          {category === "quiz" ? (
            <div className="rounded-3xl border border-violet-500/30 bg-[#120a1c] p-8 relative overflow-hidden shadow-[0_0_30px_-5px_rgba(139,92,246,0.15)]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/20 blur-[80px] rounded-full pointer-events-none" />
              <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex shrink-0 items-center justify-center text-3xl sm:text-4xl shadow-lg shadow-violet-600/30">
                  🧠
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white mb-2">QUIZ MODE</h2>
                  <p className="text-violet-400 font-medium">
                    Test your knowledge and outsmart your opponents in exciting quiz battles!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-emerald-500/30 bg-[#0a1a14] p-8 relative overflow-hidden shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/20 blur-[80px] rounded-full pointer-events-none" />
              <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex shrink-0 items-center justify-center text-3xl sm:text-4xl shadow-lg shadow-emerald-500/30">
                  ⚡
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white mb-2">CODE MODE</h2>
                  <p className="text-emerald-400 font-medium">
                    Solve, code and compete in intense programming challenges!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Settings Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            
            {/* Category / Sub-mode picker */}
            <div className="rounded-3xl border border-white/10 bg-[#12121a] p-8">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-emerald-500">1.</span> Select Game Type
              </h3>
              
              {/* Tabs */}
              <div className="flex bg-[#010103] rounded-xl p-1.5 mb-8 border border-white/5">
                <button
                  onClick={() => handleCategorySwitch("quiz")}
                  className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
                    category === "quiz" ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25" : "text-gray-500 hover:text-white hover:bg-white/5"
                  }`}
                >
                  QUIZ MODE
                </button>
                <button
                  onClick={() => handleCategorySwitch("code")}
                  className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${
                    category === "code" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25" : "text-gray-500 hover:text-white hover:bg-white/5"
                  }`}
                >
                  CODE MODE
                </button>
              </div>

              {/* Sub-modes list */}
              <div className="space-y-4">
                {CATEGORIES[category].map((m) => {
                  const isSelected = mode === m.id;
                  const activeColor = category === 'quiz' ? 'violet-500' : 'emerald-500';
                  const activeBg = category === 'quiz' ? 'bg-violet-500/10' : 'bg-emerald-500/10';
                  
                  return (
                    <div key={m.id} className="relative">
                      <button
                        onClick={() => setMode(m.id)}
                        className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center gap-5 group ${
                          isSelected 
                            ? `${activeBg} border-${activeColor}/50 shadow-[0_0_20px_-5px_rgba(var(--${activeColor}),0.2)]` 
                            : "border-white/5 bg-[#010103] hover:bg-white/5 hover:border-white/20"
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                          isSelected ? `bg-gradient-to-br ${m.gradient} text-white` : 'bg-white/5'
                        }`}>
                          {m.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className={`text-base font-bold mb-1 ${isSelected ? "text-white" : "text-gray-300"}`}>{m.title}</h3>
                          <p className={`text-xs ${isSelected ? m.color : "text-gray-500"} leading-tight`}>{m.desc}</p>
                        </div>
                        {/* Radio dot */}
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected ? `border-${activeColor}` : "border-gray-600 group-hover:border-gray-400"
                        }`}>
                          {isSelected && <div className={`w-3 h-3 rounded-full bg-${activeColor}`} />}
                        </div>
                      </button>
                      {/* Rules link */}
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/rules?mode=${m.id}`); }}
                        className="absolute right-12 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-600 hover:text-gray-300 transition-colors px-2 py-1 rounded border border-white/5 hover:border-white/20 bg-[#010103]"
                      >
                        RULES
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Content Settings */}
            <div className="rounded-3xl border border-white/10 bg-[#12121a] p-8">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-emerald-500">2.</span> Game Settings
              </h3>
              
              <div className="space-y-8">
                <div>
                  <label className="text-sm font-semibold text-gray-400 mb-3 block">Number of Questions</label>
                  <div className="grid grid-cols-4 gap-3">
                    {[5, 10, 15, 20].map((num) => (
                      <button
                        key={num}
                        onClick={() => setQuestionsCount(num)}
                        className={`py-3 text-sm font-bold rounded-xl border transition-all ${
                          questionsCount === num 
                            ? "bg-fuchsia-600 text-white border-fuchsia-500 shadow-lg shadow-fuchsia-600/25" 
                            : "bg-[#010103] text-gray-400 border-white/10 hover:border-white/30 hover:text-white"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-400 mb-3 block">Time Per Question</label>
                  <div className="grid grid-cols-4 gap-3">
                    {[15, 30, 45, 60].map((num) => (
                      <button
                        key={num}
                        onClick={() => setTimePerQuestion(num)}
                        className={`py-3 text-sm font-bold rounded-xl border transition-all ${
                          timePerQuestion === num 
                            ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/25" 
                            : "bg-[#010103] text-gray-400 border-white/10 hover:border-white/30 hover:text-white"
                        }`}
                      >
                        {num}s
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-semibold text-gray-400 mb-3 block">Difficulty</label>
                    <div className="relative">
                      <select 
                        value={difficulty} 
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="w-full bg-[#010103] border border-white/10 rounded-xl px-4 py-3.5 text-sm font-semibold text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none appearance-none cursor-pointer"
                      >
                        <option>Mixed</option>
                        <option>Easy</option>
                        <option>Medium</option>
                        <option>Hard</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-gray-400 mb-3 block">Categories</label>
                    <div className="relative">
                      <select 
                        value={categories} 
                        onChange={(e) => setCategories(e.target.value)}
                        className="w-full bg-[#010103] border border-white/10 rounded-xl px-4 py-3.5 text-sm font-semibold text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none appearance-none cursor-pointer"
                      >
                        <option value="All Categories">All Categories</option>
                        {aiCategory && <option value="My AI Content">My AI Content ✨</option>}
                        {category === "quiz" && dbCategories.length > 0 && (
                          <>
                            <option disabled>── Quiz Topics ──</option>
                            {dbCategories.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </>
                        )}
                        {category === "code" && dbTags.length > 0 && (
                          <>
                            <option disabled>── Coding Tags ──</option>
                            {dbTags.map((tag) => (
                              <option key={tag} value={tag}>{tag}</option>
                            ))}
                          </>
                        )}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-white/5 my-6"></div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[#010103] border border-white/5">
                    <div>
                      <span className="text-sm font-bold text-white block mb-0.5">Allow Spectators</span>
                      <span className="text-xs text-gray-500">Other users can watch the game</span>
                    </div>
                    <button 
                      onClick={() => setAllowSpectators(!allowSpectators)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors ${allowSpectators ? "bg-emerald-500" : "bg-gray-700"}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${allowSpectators ? "translate-x-6" : "translate-x-0"}`} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-[#010103] border border-white/5">
                    <div>
                      <span className="text-sm font-bold text-white block mb-0.5">Private Room</span>
                      <span className="text-xs text-gray-500">Only accessible via room code</span>
                    </div>
                    <button 
                      onClick={() => setPrivateRoom(!privateRoom)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors ${privateRoom ? "bg-fuchsia-500" : "bg-gray-700"}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${privateRoom ? "translate-x-6" : "translate-x-0"}`} />
                    </button>
                  </div>

                  {privateRoom && (
                    <div className="animate-slide-up">
                      <input 
                        type="text" 
                        placeholder="Enter room password (optional)"
                        className="w-full bg-[#010103] border border-fuchsia-500/30 rounded-xl px-4 py-3.5 text-sm text-white focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 outline-none placeholder:text-gray-600"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Preview & Actions */}
        <div className="w-full lg:w-[380px] shrink-0 flex flex-col gap-6 lg:h-full pb-12">
          
          <div className="rounded-3xl border border-white/10 bg-[#12121a] p-6 flex flex-col flex-1 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-6 text-center border-b border-white/5 pb-4">
              Room Summary
            </h3>
            
            <div className="p-5 rounded-2xl border border-white/5 bg-[#010103] flex gap-4 mb-8">
              <div className={`w-14 h-14 shrink-0 rounded-xl flex items-center justify-center text-3xl bg-gradient-to-br ${activeModeDetails?.gradient} shadow-lg`}>
                {activeModeDetails?.icon}
              </div>
              <div className="flex flex-col justify-center">
                <h3 className="text-base font-black text-white mb-1">{activeModeDetails?.title}</h3>
                <span className={`text-xs font-bold ${activeModeDetails?.color} px-2 py-0.5 rounded-full bg-white/5 w-max`}>
                  {category === 'quiz' ? 'QUIZ MODE' : 'CODE MODE'}
                </span>
              </div>
            </div>

            <div className="space-y-5 mb-8 flex-1">
              <div className="flex justify-between items-center p-3 rounded-xl hover:bg-white/5 transition-colors">
                <span className="text-gray-400 font-medium flex items-center gap-3 text-sm">
                  <span className="w-8 h-8 rounded-lg bg-fuchsia-500/10 text-fuchsia-500 flex items-center justify-center text-base">📄</span> 
                  Questions
                </span>
                <span className="font-bold text-white text-sm">{questionsCount}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl hover:bg-white/5 transition-colors">
                <span className="text-gray-400 font-medium flex items-center gap-3 text-sm">
                  <span className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center text-base">⏱️</span> 
                  Time limit
                </span>
                <span className="font-bold text-white text-sm">{timePerQuestion}s</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl hover:bg-white/5 transition-colors">
                <span className="text-gray-400 font-medium flex items-center gap-3 text-sm">
                  <span className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-500 flex items-center justify-center text-base">🎯</span> 
                  Difficulty
                </span>
                <span className="font-bold text-white text-sm">{difficulty}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl hover:bg-white/5 transition-colors">
                <span className="text-gray-400 font-medium flex items-center gap-3 text-sm">
                  <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-base">📂</span> 
                  Categories
                </span>
                <span className="font-bold text-white text-sm">{categories}</span>
              </div>
            </div>

            <button
              onClick={handleCreateContent}
              disabled={loading}
              className={`w-full py-5 rounded-2xl font-black text-sm text-white shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50 ${
                category === "quiz" 
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-violet-600/30" 
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/30"
              }`}
            >
              {loading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  CREATING ROOM...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                  CREATE MATCH
                </>
              )}
            </button>
            <p className="text-center text-xs text-gray-500 mt-4">
              By creating a room, you agree to the <a href="#" className="text-gray-400 hover:text-white underline">Terms of Play</a>.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
