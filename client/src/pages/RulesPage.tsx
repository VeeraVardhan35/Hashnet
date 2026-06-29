import { useNavigate, useSearchParams } from "react-router-dom";

type Rule = { icon: string; title: string; desc: string };
type ModeRules = { title: string; subtitle: string; color: string; gradient: string; icon: string; overview: string; rules: Rule[]; tips: string[] };

const RULES: Record<string, ModeRules> = {
  quiz: {
    title: "Quiz Battle",
    subtitle: "1v1 Brain Duel",
    color: "text-violet-400",
    gradient: "from-violet-600 to-indigo-600",
    icon: "🧠",
    overview: "A 1v1 real-time quiz battle where both players answer the same questions simultaneously. The fastest correct answer earns more points. Win the most rounds to claim victory.",
    rules: [
      { icon: "⏱", title: "Time Limit", desc: "Each question has a time limit set by the host (15–60 seconds). Unanswered questions score 0 points." },
      { icon: "⚡", title: "Speed Bonus", desc: "Answering faster earns more points. The first correct answer in under 5 seconds earns maximum points." },
      { icon: "✓", title: "Correct Answers", desc: "Only the correct option scores points. Wrong answers never deduct points." },
      { icon: "🏆", title: "Winning", desc: "The player with the highest score after all questions wins the match." },
      { icon: "🔄", title: "Rounds", desc: "Questions are shown one at a time. Both players see the same question simultaneously." },
      { icon: "📂", title: "Topics", desc: "The host selects a topic or category. All questions are drawn from that pool." },
    ],
    tips: ["Read the question quickly — speed matters!", "If unsure, eliminate wrong answers first.", "Don't overthink easy questions."],
  },
  quiz_teams: {
    title: "Quiz Teams",
    subtitle: "Team Knowledge Battle",
    color: "text-teal-400",
    gradient: "from-teal-500 to-emerald-600",
    icon: "👥",
    overview: "Team-based quiz battle where two teams compete simultaneously. Each correct answer by a team member adds to the team's total score. Coordinate with your team to maximize points.",
    rules: [
      { icon: "👥", title: "Team Formation", desc: "Players are split into two teams. Each team member answers independently." },
      { icon: "➕", title: "Score Pooling", desc: "All team members' scores are added together. The team with the higher total wins each round." },
      { icon: "⏱", title: "Simultaneous Play", desc: "All players answer at the same time. Coordinate your strategy with your team." },
      { icon: "🎯", title: "Team Score", desc: "The cumulative team score determines the winner at the end of all rounds." },
      { icon: "💬", title: "Strategy", desc: "Different team members may excel at different topics — use this to your advantage." },
      { icon: "🔒", title: "No Switching", desc: "Teams are fixed at the start of the match. Choose wisely!" },
    ],
    tips: ["Focus on your strong topics.", "Speed still counts — answer fast!", "Don't let your team down on easy questions."],
  },
  quiz_boss_raid: {
    title: "Quiz Boss Raid",
    subtitle: "Defeat the Knowledge Boss",
    color: "text-fuchsia-400",
    gradient: "from-fuchsia-600 to-pink-600",
    icon: "👾",
    overview: "All players team up to defeat a powerful AI Boss by answering quiz questions. Every correct answer deals damage to the Boss. The Boss can also attack players, reducing their HP. Work together to defeat the Boss before it defeats you all!",
    rules: [
      { icon: "❤️", title: "Player HP", desc: "Every player has HP. Wrong answers or Boss attacks reduce your HP. Reach 0 HP and you are eliminated." },
      { icon: "⚔️", title: "Damage", desc: "Correct answers deal damage to the Boss based on your score and the question's point value." },
      { icon: "💀", title: "Boss Attacks", desc: "At intervals, the Boss unleashes abilities that attack players and apply status effects." },
      { icon: "🌊", title: "Waves", desc: "The raid has multiple waves. The Boss gets stronger each wave. Survive all waves to win!" },
      { icon: "🌀", title: "Boss Abilities", desc: "Abilities include Silence (can't submit), Stun (delayed actions), and Doom Mark (extra damage taken)." },
      { icon: "🏆", title: "Victory", desc: "Reduce the Boss HP to 0 to win. If all players are eliminated first, the Boss wins." },
    ],
    tips: ["Submit fast for max damage.", "Watch the Boss ability countdown.", "Keep your HP above 50% if possible."],
  },
  battle: {
    title: "Battle Royale",
    subtitle: "Code to Survive",
    color: "text-red-400",
    gradient: "from-red-600 to-orange-600",
    icon: "⚡",
    overview: "A coding battle where all players solve the same coding problems. Solve problems to earn points, and the player with the least points gets eliminated each round. Last coder standing wins!",
    rules: [
      { icon: "💻", title: "Coding Problems", desc: "All players receive the same coding problem to solve in the given time limit." },
      { icon: "✅", title: "Scoring", desc: "Passing all test cases gives full points. Partial solutions may give partial credit depending on test cases passed." },
      { icon: "☠️", title: "Elimination", desc: "After each round, the player with the lowest score may be eliminated. Difficulty increases each round." },
      { icon: "⏰", title: "Time Pressure", desc: "Each problem has a strict time limit. Code efficiently!" },
      { icon: "🔤", title: "Languages", desc: "Choose from Python, JavaScript, or C++. Use the language you know best." },
      { icon: "🏆", title: "Winner", desc: "The last player remaining wins the Battle Royale!" },
    ],
    tips: ["Start with working brute force, then optimize.", "Test your solution with edge cases.", "Speed matters as much as correctness."],
  },
  teams: {
    title: "Code Teams",
    subtitle: "Collaborate & Conquer",
    color: "text-emerald-400",
    gradient: "from-emerald-600 to-cyan-600",
    icon: "⚔️",
    overview: "Team-based coding battle where two teams solve the same problems. The team that solves more problems or scores higher points wins. Collaborate, divide tasks, and conquer!",
    rules: [
      { icon: "👥", title: "Teams", desc: "Players are split into two teams at the start of the match." },
      { icon: "💻", title: "Shared Problems", desc: "Both teams face the same set of coding problems in each round." },
      { icon: "📊", title: "Team Score", desc: "Each correct submission adds points to the team's total. The team with higher total wins." },
      { icon: "🤝", title: "Collaboration", desc: "Teammates can divide problems — one player can focus on speed, another on accuracy." },
      { icon: "⏱", title: "Round Timer", desc: "All rounds are time-limited. Incomplete solutions score 0." },
      { icon: "🏆", title: "Victory", desc: "Win the majority of rounds or have the highest combined score to win the match." },
    ],
    tips: ["Divide and conquer — assign problems by expertise.", "Communicate with your team.", "Partial credit is better than no submission."],
  },
  boss_raid: {
    title: "Code Boss Raid",
    subtitle: "Defeat the Coding Boss",
    color: "text-purple-400",
    gradient: "from-purple-600 to-fuchsia-600",
    icon: "👹",
    overview: "All players team up to defeat the Coding Boss by solving progressively harder coding problems. Every accepted solution deals damage to the Boss. Survive the Boss's counterattacks and defeat it before time runs out!",
    rules: [
      { icon: "❤️", title: "Player HP", desc: "You have HP. The Boss attacks after each wave, reducing your HP. Reach 0 and you're eliminated." },
      { icon: "⚔️", title: "Damage Dealing", desc: "Each accepted submission deals damage to the Boss equal to the problem's point value multiplied by your role's damage modifier." },
      { icon: "🎭", title: "Roles", desc: "Each player has a role: DPS (high damage), Tank (high HP), or Support (heals teammates). Roles are assigned at the start." },
      { icon: "🌊", title: "Waves", desc: "The Boss Raid has multiple waves with increasingly difficult problems. Clear all waves to win!" },
      { icon: "🌀", title: "Abilities", desc: "The Boss uses special abilities periodically. Watch the countdown and prepare!" },
      { icon: "🏆", title: "Victory", desc: "Drain the Boss's HP to zero before all players are eliminated to win the raid!" },
    ],
    tips: ["DPS players should focus on submitting quickly.", "Tanks should tank boss attacks — don't die!", "Support players: prioritize healing when HP drops."],
  },
};

export default function RulesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "quiz";
  const data = RULES[mode] || RULES["quiz"];

  return (
    <div className="min-h-screen bg-[#010103] text-white font-sans p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/8 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-semibold mb-8 group">
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back
        </button>

        {/* Header */}
        <div className={`rounded-3xl bg-gradient-to-r ${data.gradient} p-8 mb-8 relative overflow-hidden shadow-lg`}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
          <div className="relative z-10 flex items-center gap-6">
            <div className="text-6xl">{data.icon}</div>
            <div>
              <p className="text-white/70 font-bold text-sm uppercase tracking-widest mb-1">{data.subtitle}</p>
              <h1 className="text-4xl font-black text-white">{data.title}</h1>
              <p className="text-white/80 text-sm mt-2">GAME RULES & HOW TO PLAY</p>
            </div>
          </div>
        </div>

        {/* Overview */}
        <div className="rounded-2xl border border-white/10 bg-[#12121a] p-6 mb-6">
          <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3">Overview</h2>
          <p className="text-gray-300 leading-relaxed">{data.overview}</p>
        </div>

        {/* Rules */}
        <div className="rounded-2xl border border-white/10 bg-[#12121a] p-6 mb-6">
          <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Rules</h2>
          <div className="space-y-4">
            {data.rules.map((rule, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-xl bg-[#010103] border border-white/5 hover:border-white/10 transition-colors">
                <div className="text-2xl shrink-0 w-10 text-center">{rule.icon}</div>
                <div>
                  <p className={`font-black text-sm mb-1 ${data.color}`}>{rule.title}</p>
                  <p className="text-gray-400 text-sm leading-relaxed">{rule.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="rounded-2xl border border-white/10 bg-[#12121a] p-6 mb-6">
          <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">💡 Pro Tips</h2>
          <div className="space-y-3">
            {data.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className={`font-black text-sm shrink-0 ${data.color}`}>{i + 1}.</span>
                <p className="text-gray-300 text-sm">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => navigate("/create-room")} className={`w-full py-4 rounded-2xl font-black text-white bg-gradient-to-r ${data.gradient} hover:opacity-90 transition-all text-sm shadow-lg`}>
          Create a {data.title} Room →
        </button>
      </div>
    </div>
  );
}
