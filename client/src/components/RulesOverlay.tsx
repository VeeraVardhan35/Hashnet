import { useRoomStore } from "../store/room.store";

interface RulesOverlayProps {
  onClose: () => void;
}

export default function RulesOverlay({ onClose }: RulesOverlayProps) {
  const gameMode = useRoomStore((s) => s.gameMode);

  // We mock the content based on the mockup image, 
  // customizing slightly based on whether it's quiz or code mode.
  const isQuiz = gameMode.startsWith("quiz");
  
  return (
    <div className="absolute inset-0 bg-bg-base z-40 overflow-y-auto animate-fade-in flex flex-col p-6">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onClose}
          className="flex items-center gap-2 text-text-muted hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Lobby
        </button>
        <div className="text-text-muted text-sm flex items-center gap-2">
          Next: {isQuiz ? "Quiz Teams" : "Teams Mode"}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
      </div>

      {/* Title */}
      <div className="flex items-center gap-6 mb-12">
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl border bg-white/5 ${isQuiz ? "border-violet-500/30 text-violet-400" : "border-emerald-500/30 text-emerald-400"}`}>
          {isQuiz ? "🧠" : "⚡"}
        </div>
        <div>
          <h1 className={`text-4xl font-black uppercase tracking-tight mb-2 ${isQuiz ? "text-violet-400" : "text-emerald-400"}`}>
            {isQuiz ? "Quiz Battle" : "Battle Royale"} – RULES
          </h1>
          <p className="text-text-secondary max-w-2xl leading-relaxed">
            {isQuiz 
              ? "Test your knowledge in a 1v1 quiz duel. Answer faster, think smarter, and defeat your opponent!"
              : "Solve DSA problems to survive. Wrong answers risk elimination each round. Last coder standing wins."}
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 max-w-7xl">
        
        {/* Left Col */}
        <div className="flex-1 flex flex-col gap-8">
          
          {/* How It Works */}
          <div className="glass-card p-8 border-white/5 bg-bg-surface/30">
            <h2 className={`text-xs font-bold mb-6 uppercase tracking-widest ${isQuiz ? "text-violet-400" : "text-emerald-400"}`}>HOW IT WORKS</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { step: "1", title: "Matchmaking", desc: "You'll be matched with opponents in this room." },
                { step: "2", title: isQuiz ? "Answer Questions" : "Solve Problems", desc: isQuiz ? "Answer multiple-choice questions across various topics." : "Write correct code to pass hidden test cases." },
                { step: "3", title: "Score Points", desc: "Earn points for correct and fast answers. The faster you answer, the higher you score." },
                { step: "4", title: "Win the Duel", desc: "The player with the highest score at the end wins!" },
              ].map((item) => (
                <div key={item.step}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mb-3 ${isQuiz ? "bg-violet-600" : "bg-emerald-600"}`}>
                    {item.step}
                  </div>
                  <h3 className="font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-text-muted leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Rules */}
          <div className="glass-card p-8 border-white/5 bg-bg-surface/30 flex-1">
            <h2 className={`text-xs font-bold mb-6 uppercase tracking-widest ${isQuiz ? "text-violet-400" : "text-emerald-400"}`}>DETAILED RULES</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="text-2xl mt-1 opacity-80">⚔️</div>
                <div>
                  <h4 className="font-bold text-white mb-1">Gameplay</h4>
                  <p className="text-sm text-text-muted">You will compete against opponents in real-time.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="text-2xl mt-1 opacity-80">📄</div>
                <div>
                  <h4 className="font-bold text-white mb-1">Number of Questions</h4>
                  <p className="text-sm text-text-muted">Each battle consists of {isQuiz ? "10 questions" : "3-5 rounds"}.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="text-2xl mt-1 opacity-80">⏱️</div>
                <div>
                  <h4 className="font-bold text-white mb-1">Time Per Question</h4>
                  <p className="text-sm text-text-muted">You get <strong className="text-accent">15 seconds</strong> to answer each question.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="text-2xl mt-1 opacity-80">🎯</div>
                <div>
                  <h4 className="font-bold text-white mb-1">Scoring System</h4>
                  <ul className="text-sm text-text-muted list-disc list-inside mt-2 space-y-1">
                    <li>Correct Answer: <strong className="text-emerald-400">+10 points</strong></li>
                    <li>Wrong Answer: <strong className="text-text-muted">0 points</strong></li>
                    <li>Unanswered: <strong className="text-text-muted">0 points</strong></li>
                  </ul>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="text-2xl mt-1 opacity-80">⚖️</div>
                <div>
                  <h4 className="font-bold text-white mb-1">Tiebreaker</h4>
                  <p className="text-sm text-text-muted">If players have the same score, the one who answered faster overall wins.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="text-2xl mt-1 opacity-80">🔌</div>
                <div>
                  <h4 className="font-bold text-white mb-1">Disconnects</h4>
                  <p className="text-sm text-text-muted">If a player disconnects, the opponents automatically win.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col */}
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-8">
          
          {/* Quick Info */}
          <div className="glass-card p-6 border-white/5 bg-bg-surface/30">
            <h2 className={`text-xs font-bold mb-6 uppercase tracking-widest ${isQuiz ? "text-violet-400" : "text-emerald-400"}`}>QUICK INFO</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted flex items-center gap-2">👥 Players</span>
                <span className="font-bold">Up to 8</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted flex items-center gap-2">📄 Questions</span>
                <span className="font-bold">10</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted flex items-center gap-2">⏱️ Time / Question</span>
                <span className="font-bold">15 sec</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted flex items-center gap-2">⏳ Total Time</span>
                <span className="font-bold">~2.5 min</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted flex items-center gap-2">📂 Topics</span>
                <span className="font-bold">Mixed</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted flex items-center gap-2">🎯 Scoring</span>
                <span className="font-bold">Speed + Accuracy</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted flex items-center gap-2">🎁 Rewards</span>
                <span className="font-bold">XP, Coins, Points</span>
              </div>
            </div>
          </div>

          {/* How To Win */}
          <div className="glass-card p-6 border-white/5 bg-bg-surface/30">
            <h2 className={`text-xs font-bold mb-6 uppercase tracking-widest ${isQuiz ? "text-violet-400" : "text-emerald-400"}`}>HOW TO WIN</h2>
            <ul className="space-y-4 mb-6">
              <li className="flex items-center gap-3 text-sm text-text-primary font-bold">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">✓</div>
                Answer correctly
              </li>
              <li className="flex items-center gap-3 text-sm text-text-primary font-bold">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">✓</div>
                Answer faster
              </li>
              <li className="flex items-center gap-3 text-sm text-text-primary font-bold">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">✓</div>
                Score higher than your opponent
              </li>
            </ul>
            <p className="text-sm text-text-muted mb-6">Be smart. Be fast. Be unbeatable.</p>
            <button 
              onClick={onClose}
              className={`w-full py-4 rounded-xl font-black text-sm text-white shadow-lg transition-transform active:scale-95 ${
                isQuiz ? "bg-gradient-to-r from-violet-600 to-indigo-600" : "bg-gradient-to-r from-emerald-600 to-teal-600"
              }`}
            >
              ▶ I UNDERSTAND, LET'S PLAY!
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}
