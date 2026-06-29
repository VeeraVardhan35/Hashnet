import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCompetitive } from "../hooks/useCompetitive";
import { useAuthStore } from "../store/auth.store";
import toast from "react-hot-toast";

const CF_TAGS = ["dp", "greedy", "math", "graphs", "trees", "strings", "sorting", "bitmasks", "number theory", "geometry", "implementation", "brute force", "binary search", "two pointers", "constructive algorithms"];

export default function CompetitiveSetupPage() {
  const navigate = useNavigate();
  const { profile, fetchProfile, updateProfile, startRun, loading } = useCompetitive();
  
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");

  const [minRating, setMinRating] = useState(800);
  const [maxRating, setMaxRating] = useState(1600);
  const [tags, setTags] = useState<string[]>(["dp", "greedy"]);
  const [newTag, setNewTag] = useState("");
  const [numberOfProblems, setNumberOfProblems] = useState(10);
  const [timerPerProblem, setTimerPerProblem] = useState(15);
  const [infiniteMode, setInfiniteMode] = useState(true);
  const [excludeSolved, setExcludeSolved] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile) {
      setHandle(profile.codeforcesHandle || "");
    }
  }, [profile]);

  const handleStart = async () => {
    if (!handle.trim()) {
      toast.error("Codeforces handle is required!");
      return;
    }
    if (!password.trim()) {
      toast.error("Codeforces password is required!");
      return;
    }
    const toastId = toast.loading("Setting up your session...");
    try {
      await updateProfile(handle, password);
      await startRun({
        minRating,
        maxRating,
        tags,
        numberOfProblems,
        timerPerProblem,
        infiniteMode,
        excludeSolved
      });
      toast.dismiss(toastId);
      navigate("/competitive/arena");
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err?.message || "Failed to start session");
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      removeTag(tag);
    } else {
      setTags([...tags, tag]);
    }
  };

  return (
    <div className="min-h-screen bg-[#010103] text-white font-sans overflow-hidden">
      
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-b from-violet-900/15 to-transparent pointer-events-none" />
      <div className="fixed top-0 right-0 w-[600px] h-[400px] bg-violet-600/10 blur-[150px] pointer-events-none rounded-full" />

      {/* Header */}
      <header className="relative z-10 flex items-center gap-6 px-8 py-5 border-b border-white/5 bg-[#010103]/80 backdrop-blur-md">
        <button onClick={() => navigate("/home")} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center transition-colors">
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            COMPETITIVE PROGRAMMING
            <span className="text-violet-500">❖</span>
          </h1>
          <p className="text-violet-400 font-medium text-sm">Configure your endless run session</p>
        </div>
      </header>

      <main className="relative z-10 p-8 max-w-[1400px] mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Col */}
          <div className="lg:w-80 shrink-0 flex flex-col gap-6">
            
            {/* Hero Card */}
            <div className="rounded-3xl border border-violet-500/30 bg-[#120a1c] p-8 relative overflow-hidden shadow-[0_0_40px_-10px_rgba(139,92,246,0.3)]">
              <div className="absolute top-0 right-0 w-48 h-48 bg-violet-600/20 blur-[60px] rounded-full pointer-events-none" />
              <div className="relative z-10">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-4xl mb-6 shadow-lg shadow-violet-600/30">
                  ⚡
                </div>
                <h2 className="text-2xl font-black text-white mb-2">ENDLESS RUN</h2>
                <p className="text-violet-400 font-medium text-sm mb-6">Practice with real Codeforces problems. Grind, improve, conquer.</p>
                <div className="space-y-2">
                  {["Real CF problems", "Filter by rating & tags", "Track streaks", "Submission analytics"].map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm text-gray-300">
                      <div className="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center shrink-0">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </div>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Codeforces Account */}
            <div className="rounded-3xl border border-white/10 bg-[#12121a] p-6">
              <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
                <span className="text-violet-400">🏆</span> Codeforces Account
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-2">
                    CF Handle <span className="text-red-400 font-black">*</span>
                    <span className="ml-1 text-[10px] text-gray-600">(required)</span>
                  </label>
                  <input 
                    type="text" 
                    value={handle}
                    onChange={e => setHandle(e.target.value)}
                    className={`w-full bg-[#010103] border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 transition-all placeholder:text-gray-600 text-sm ${
                      !handle.trim() ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : "border-white/10 focus:border-violet-500 focus:ring-violet-500"
                    }`}
                    placeholder="e.g. tourist"
                    required
                  />
                  {profile?.codeforcesHandle && (
                    <p className="text-xs text-emerald-400 mt-1">✓ Verified handle: {profile.codeforcesHandle}</p>
                  )}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-2">
                    CF Password <span className="text-red-400 font-black">*</span>
                    <span className="ml-1 text-[10px] text-gray-600">(required)</span>
                  </label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className={`w-full bg-[#010103] border rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-1 transition-all placeholder:text-gray-600 text-sm ${
                      !password.trim() ? "border-red-500/50 focus:border-red-500 focus:ring-red-500" : "border-white/10 focus:border-violet-500 focus:ring-violet-500"
                    }`}
                    placeholder="••••••••"
                    required
                  />
                  <p className="text-[10px] text-gray-600 mt-1 leading-tight">Used to submit on your behalf via our secure backend.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Col */}
          <div className="flex-1 flex flex-col gap-6">
            
            {/* Config Card */}
            <div className="rounded-3xl border border-white/10 bg-[#12121a] p-8">
              <h2 className="text-xl font-black text-white mb-1">Configure Your Run</h2>
              <p className="text-gray-500 text-sm mb-8">Customize difficulty, topics, and session settings</p>
              
              <div className="space-y-8">
                
                {/* Rating Range */}
                <div>
                  <label className="text-sm font-bold text-gray-300 block mb-3">Rating Range</label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 block mb-1">Min Rating</label>
                      <input
                        type="number"
                        value={minRating}
                        onChange={e => setMinRating(Number(e.target.value))}
                        className="w-full bg-[#010103] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 text-sm text-center"
                      />
                    </div>
                    <div className="text-gray-600 font-bold mt-5">—</div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 block mb-1">Max Rating</label>
                      <input
                        type="number"
                        value={maxRating}
                        onChange={e => setMaxRating(Number(e.target.value))}
                        className="w-full bg-[#010103] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 text-sm text-center"
                      />
                    </div>
                    <div className="mt-5 px-4 py-3 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-400 text-sm font-bold whitespace-nowrap">
                      {minRating} — {maxRating}
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="text-sm font-bold text-gray-300 block mb-3">Problem Tags</label>
                  <div className="flex flex-wrap gap-2 mb-4 min-h-[40px]">
                    {tags.map(tag => (
                      <span key={tag} className="px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-400 text-xs font-bold border border-violet-500/30 flex items-center gap-1.5">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-white text-violet-300 leading-none text-base">&times;</button>
                      </span>
                    ))}
                  </div>

                  {/* Quick select tags */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {CF_TAGS.map(tag => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          tags.includes(tag)
                            ? "bg-violet-500/20 text-violet-400 border-violet-500/40"
                            : "bg-white/5 text-gray-500 border-white/5 hover:border-white/20 hover:text-gray-300"
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newTag} 
                      onChange={e => setNewTag(e.target.value)} 
                      onKeyDown={e => e.key === "Enter" && addTag()}
                      placeholder="Custom tag (e.g. 2-sat)" 
                      className="flex-1 bg-[#010103] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 text-sm placeholder:text-gray-600"
                    />
                    <button
                      onClick={addTag}
                      className="px-5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Questions & Time */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-bold text-gray-300 block mb-3">
                      Number of Problems
                      {infiniteMode && <span className="ml-2 text-gray-600 font-normal text-xs">(disabled in ∞ mode)</span>}
                    </label>
                    <input
                      type="number"
                      value={numberOfProblems}
                      onChange={e => setNumberOfProblems(Number(e.target.value))}
                      disabled={infiniteMode}
                      className={`w-full bg-[#010103] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 text-sm ${infiniteMode ? "opacity-40 cursor-not-allowed" : ""}`}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-300 block mb-3">Time Per Problem (mins)</label>
                    <input
                      type="number"
                      value={timerPerProblem}
                      onChange={e => setTimerPerProblem(Number(e.target.value))}
                      className="w-full bg-[#010103] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-violet-500 text-sm"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[#010103] border border-white/5">
                    <div>
                      <span className="text-sm font-bold text-white block">Infinite Mode</span>
                      <span className="text-xs text-gray-500">No problem limit</span>
                    </div>
                    <button
                      onClick={() => setInfiniteMode(!infiniteMode)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors shrink-0 ${infiniteMode ? "bg-violet-500" : "bg-gray-700"}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${infiniteMode ? "translate-x-6" : "translate-x-0"}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[#010103] border border-white/5">
                    <div>
                      <span className="text-sm font-bold text-white block">Exclude Solved</span>
                      <span className="text-xs text-gray-500">Skip problems you've done</span>
                    </div>
                    <button
                      onClick={() => setExcludeSolved(!excludeSolved)}
                      className={`w-12 h-6 rounded-full p-1 transition-colors shrink-0 ${excludeSolved ? "bg-violet-500" : "bg-gray-700"}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${excludeSolved ? "translate-x-6" : "translate-x-0"}`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
                <h3 className="text-sm font-black text-emerald-400 mb-3 flex items-center gap-2">⚙️ How It Works</h3>
                <ul className="text-xs text-gray-400 space-y-1.5">
                  <li className="flex items-start gap-2"><span className="text-emerald-500 shrink-0">•</span> Solve problems one by one</li>
                  <li className="flex items-start gap-2"><span className="text-emerald-500 shrink-0">•</span> Wrong submissions reduce your score</li>
                  <li className="flex items-start gap-2"><span className="text-emerald-500 shrink-0">•</span> Skip if stuck, but it affects rank</li>
                  <li className="flex items-start gap-2"><span className="text-emerald-500 shrink-0">•</span> Run ends when time is up or done</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
                <h3 className="text-sm font-black text-amber-400 mb-3 flex items-center gap-2">🏆 Scoring</h3>
                <ul className="text-xs text-gray-400 space-y-1.5">
                  <li className="flex justify-between"><span>Accepted</span><span className="text-emerald-400 font-bold">+100 pts</span></li>
                  <li className="flex justify-between"><span>First Try Bonus</span><span className="text-emerald-400 font-bold">+50 pts</span></li>
                  <li className="flex justify-between"><span>Wrong Answer</span><span className="text-red-400 font-bold">−50 pts</span></li>
                  <li className="flex justify-between"><span>Skipped</span><span className="text-orange-400 font-bold">−10 pts</span></li>
                </ul>
              </div>
            </div>

            {/* Start Button */}
            <button 
              onClick={handleStart}
              disabled={loading}
              className={`w-full py-5 rounded-2xl text-white font-black text-lg tracking-widest shadow-[0_0_40px_-5px_rgba(139,92,246,0.4)] hover:shadow-[0_0_60px_-5px_rgba(139,92,246,0.5)] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 ${
                !handle.trim() || !password.trim()
                  ? "bg-gray-700 cursor-not-allowed"
                  : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500"
              }`}
            >
              {loading ? (
                <>
                  <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  CONFIGURING...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  START ENDLESS RUN
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
