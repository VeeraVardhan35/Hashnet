import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useCompetitive } from "../hooks/useCompetitive";

export default function CompetitiveResultPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, activeRun, nextProblem, quitRun, fetchActiveRun, fetchProfile } = useCompetitive();
  
  const [loadingNext, setLoadingNext] = useState(false);

  useEffect(() => {
    fetchActiveRun();
    fetchProfile();
  }, []);

  const handleNextProblem = async () => {
    setLoadingNext(true);
    await nextProblem();
    setLoadingNext(false);
    navigate("/competitive/arena");
  };

  const handleQuit = async () => {
    await quitRun();
    navigate("/home");
  };

  if (!activeRun || !profile) {
    return (
      <div className="min-h-screen bg-[#010103] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400 font-medium">Loading results...</p>
        </div>
      </div>
    );
  }

  const verdictData = location.state?.verdict || { verdict: "Unknown", timeMs: 0, memoryBytes: 0, passedTestCount: 0 };
  const isAccepted = verdictData.verdict === "Accepted";
  const displayVerdict = verdictData.verdict;
  
  const accuracy = activeRun.runStats.solved + activeRun.runStats.wrong > 0 
    ? Math.round((activeRun.runStats.solved / (activeRun.runStats.solved + activeRun.runStats.wrong)) * 100) 
    : 100;

  return (
    <div className="min-h-screen bg-[#010103] text-white font-sans overflow-hidden">
      
      {/* Background glow */}
      <div className={`fixed inset-0 pointer-events-none ${isAccepted ? "bg-emerald-900/10" : "bg-red-900/10"}`} />
      <div className={`fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] blur-[150px] rounded-full pointer-events-none ${isAccepted ? "bg-emerald-600/15" : "bg-red-600/15"}`} />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-center px-8 py-4 border-b border-white/5 bg-[#010103]/80 backdrop-blur-md">
        <div className="flex items-center gap-3 text-xs font-bold tracking-widest uppercase">
          <span className="text-gray-600">CONFIGURE</span>
          <span className="text-gray-700">›</span>
          <span className="text-gray-600">CODE</span>
          <span className="text-gray-700">›</span>
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse"></span>
          <span className="text-violet-400">RESULTS</span>
        </div>
      </header>

      <main className="relative z-10 flex flex-col items-center py-12 px-6 max-w-2xl mx-auto">
        
        {/* Result Icon */}
        <div className={`w-32 h-32 rounded-full flex items-center justify-center text-6xl mb-6 border ${
          isAccepted
            ? "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_60px_rgba(16,185,129,0.3)]"
            : "bg-red-500/10 border-red-500/30 shadow-[0_0_60px_rgba(239,68,68,0.3)]"
        }`}>
          {isAccepted ? "🏆" : "❌"}
        </div>
        
        <p className="text-gray-500 mb-2 font-medium">Problem {activeRun.currentProblemIndex} Verified!</p>
        <h1 className={`text-5xl font-black uppercase mb-10 tracking-widest ${isAccepted ? "text-emerald-400" : "text-red-400"}`}>
          {displayVerdict}
        </h1>

        {/* Stats Row */}
        <div className="flex gap-4 w-full mb-8">
          <div className={`flex-1 rounded-2xl border p-6 flex flex-col items-center ${isAccepted ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"}`}>
            <span className={`text-4xl font-black mb-1 ${isAccepted ? "text-emerald-400" : "text-red-400"}`}>
              {isAccepted ? "+100" : "−50"}
            </span>
            <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Points Earned</span>
          </div>
          <div className="flex-1 rounded-2xl border border-white/10 bg-[#12121a] p-6 flex flex-col items-center">
            <span className="text-4xl font-black text-white mb-1">{verdictData.timeMs} ms</span>
            <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Time</span>
          </div>
          <div className="flex-1 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6 flex flex-col items-center">
            <span className="text-4xl font-black text-violet-400 mb-1">{Math.round((verdictData.memoryBytes || 0) / 1024 / 1024)} MB</span>
            <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Memory</span>
          </div>
        </div>

        {/* Test Cases */}
        <div className="w-full rounded-2xl border border-white/10 bg-[#12121a] p-6 mb-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Test Case Results</h3>
            <span className="text-sm text-gray-500"><span className="text-white font-bold">{verdictData.passedTestCount || 0}</span> Passed</span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {[...Array(Math.max(1, verdictData.passedTestCount || 1))].map((_, i) => {
              const isLastAndFailed = !isAccepted && i === (verdictData.passedTestCount || 0);
              const pass = !isLastAndFailed;
              if (i > 15) return null;

              return (
                <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-[#010103] border border-white/5">
                  <span className="text-sm text-white flex items-center gap-3">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${pass ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
                      {pass ? "✓" : "✗"}
                    </span>
                    Test Case #{i + 1}
                  </span>
                  <span className={`text-xs font-bold uppercase ${pass ? "text-emerald-400" : "text-red-400"}`}>
                    {pass ? "Accepted" : "Failed"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Standings */}
        <div className="w-full rounded-2xl border border-white/10 bg-[#12121a] p-6 mb-8">
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-5">Session Stats</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Total Score", value: activeRun.runStats.xpEarned, color: "text-cyan-400" },
              { label: "Problems Solved", value: `${activeRun.runStats.solved} / ${activeRun.settings.infiniteMode ? "∞" : activeRun.problems.length}`, color: "text-white" },
              { label: "Accuracy", value: `${accuracy}%`, color: accuracy >= 80 ? "text-emerald-400" : accuracy >= 50 ? "text-amber-400" : "text-red-400" },
              { label: "Global XP", value: profile.xp, color: "text-violet-400" },
            ].map(stat => (
              <div key={stat.label} className="p-4 rounded-xl bg-[#010103] border border-white/5">
                <p className={`text-xl font-black ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 font-medium mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-4">
          <button 
            onClick={handleNextProblem}
            disabled={loadingNext}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-lg tracking-widest shadow-[0_0_40px_-5px_rgba(139,92,246,0.4)] transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loadingNext ? (
              <><svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>LOADING...</>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg>
                NEXT PROBLEM
              </>
            )}
          </button>
          
          <button 
            onClick={handleQuit}
            className="w-full py-4 text-sm font-bold text-gray-500 hover:text-white transition-colors rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10"
          >
            END RUN
          </button>
        </div>
      </main>
    </div>
  );
}
