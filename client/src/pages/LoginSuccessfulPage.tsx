import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginSuccessfulPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate("/home"), 2000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#010103] flex items-center justify-center">
      <div className="fixed inset-0 bg-gradient-to-b from-cyan-900/15 to-transparent pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 text-center">
        <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
          <svg className="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-white mb-2">Welcome Back!</h1>
        <p className="text-gray-400 mb-6">Successfully logged in. Redirecting…</p>
        <div className="flex items-center justify-center gap-2">
          <div className="animate-spin w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full" />
          <span className="text-gray-500 text-sm">Taking you home</span>
        </div>
      </div>
    </div>
  );
}