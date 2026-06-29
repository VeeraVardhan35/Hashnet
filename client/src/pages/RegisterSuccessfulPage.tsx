import { useNavigate } from "react-router-dom";

export default function RegisterSuccessfulPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#010103] flex items-center justify-center">
      <div className="fixed inset-0 bg-gradient-to-b from-violet-900/15 to-transparent pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-violet-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 text-center max-w-sm px-6">
        <div className="w-24 h-24 rounded-full bg-violet-500/20 border-2 border-violet-500/40 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(139,92,246,0.3)]">
          <svg className="w-12 h-12 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-white mb-3">Account Created!</h1>
        <p className="text-gray-400 mb-8 leading-relaxed">Your account has been created successfully. You're ready to code, compete, and conquer!</p>
        
        <button
          onClick={() => navigate("/login")}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-base shadow-lg shadow-violet-500/25 transition-all active:scale-[0.98]"
        >
          Sign In Now
        </button>
      </div>
    </div>
  );
}