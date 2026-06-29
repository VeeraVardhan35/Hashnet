import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { useCompetitive } from "../hooks/useCompetitive";

const MONACO_LANG: Record<string, string> = {
  cpp: "cpp",
  python: "python",
  javascript: "javascript"
};

const TEMPLATES: Record<string, string> = {
  cpp: `// write from scratch\n`,
  python: `# write from scratch\n`,
  javascript: `// write from scratch\n`
};

export default function CompetitiveArenaPage() {
  const navigate = useNavigate();
  const { activeRun, submitSolution, skipProblem, quitRun, fetchActiveRun, getProblemHtml } = useCompetitive();
  
  const [language, setLanguage] = useState<string>("cpp");
  const [code, setCode] = useState<string>(TEMPLATES["cpp"]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [problemHtml, setProblemHtml] = useState<string>("<div class='p-4 text-gray-500'>Loading problem...</div>");

  const [customInput, setCustomInput] = useState<string>("");
  const [output, setOutput] = useState<{ stdout: string, stderr: string, runtimeError: boolean } | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const { executeCode } = useCompetitive();

  useEffect(() => {
    fetchActiveRun();
  }, []);

  useEffect(() => {
    if (activeRun) {
      if (!activeRun.isActive) {
        navigate("/competitive/result");
      } else {
        const currentProblem = activeRun.problems[activeRun.currentProblemIndex];
        if (currentProblem) {
          getProblemHtml(currentProblem.id).then(setProblemHtml);
        }
      }
    }
  }, [activeRun, navigate]);

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setCode(TEMPLATES[lang]);
  };

  const handleSubmit = async () => {
    if (!activeRun) return;
    setIsSubmitting(true);
    try {
      const currentProblem = activeRun.problems[activeRun.currentProblemIndex];
      const result = await submitSolution(currentProblem.id);
      
      if (!result.success) {
        alert(result.message || "Could not verify submission.");
      } else {
        navigate("/competitive/result", { state: { verdict: result } });
      }
    } catch (err) {
      alert(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunCode = async () => {
    if (!activeRun) return;
    setIsRunning(true);
    setOutput(null);
    try {
      const result = await executeCode(code, language, customInput);
      setOutput({
        stdout: result.stdout,
        stderr: result.stderr,
        runtimeError: result.runtimeError || result.compileError
      });
      setShowCustomInput(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSkip = async () => {
    await skipProblem();
  };

  const handleQuit = async () => {
    await quitRun();
    navigate("/home");
  };

  if (!activeRun) return (
    <div className="min-h-screen bg-[#010103] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-400 font-medium">Loading arena...</p>
      </div>
    </div>
  );

  const currentProblem = activeRun.problems[activeRun.currentProblemIndex];

  return (
    <div className="min-h-screen bg-[#010103] flex flex-col font-sans" style={{ height: "100vh" }}>
      
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-[#010103]/90 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.5)]">
            <span className="text-sm">⚡</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold tracking-widest uppercase">
            <span className="text-gray-600">CONFIGURE</span>
            <span className="text-gray-700">›</span>
            <span className="text-violet-400">CODE</span>
            <span className="text-gray-700">›</span>
            <span className="text-gray-600">RESULTS</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">Score:</span>
            <span className="text-white font-black text-lg">{activeRun.runStats.xpEarned}</span>
          </div>
          <div className="text-xs text-gray-500 font-mono px-3 py-1 rounded-lg bg-white/5 border border-white/5">
            Problem {activeRun.currentProblemIndex + 1} / {activeRun.settings.infiniteMode ? "∞" : activeRun.problems.length}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* Left Panel: Problem */}
        <div className="w-1/2 flex flex-col border-r border-white/5 bg-[#010103]">
          <div className="p-5 border-b border-white/5 bg-[#0d0d14]">
            <div className="text-xs text-gray-600 mb-2">📊 Codeforces · {currentProblem.id}</div>
            <h1 className="text-xl font-black text-white mb-3">{currentProblem.name}</h1>
            <div className="flex flex-wrap gap-2">
              {currentProblem.tags && currentProblem.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded-lg bg-white/5 text-gray-500 text-xs border border-white/5">{tag}</span>
              ))}
              <span className="px-2 py-0.5 rounded-lg bg-violet-500/10 text-violet-400 text-xs font-bold border border-violet-500/20">
                {currentProblem.rating || 'Unrated'} ⚙
              </span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <div 
              className="prose prose-invert prose-sm text-gray-300 leading-relaxed max-w-none cf-problem-content"
              dangerouslySetInnerHTML={{ __html: problemHtml }}
            />
          </div>

          <div className="p-4 border-t border-white/5 bg-[#0d0d14] flex gap-3">
            <button
              onClick={handleQuit}
              className="px-4 py-2 text-sm text-gray-500 hover:text-white transition-colors rounded-xl hover:bg-white/5"
            >
              ← Quit
            </button>
            <div className="flex-1" />
            <button
              onClick={handleSkip}
              className="px-5 py-2 text-sm text-orange-400 border border-orange-500/30 rounded-xl hover:bg-orange-500/10 transition-colors flex items-center gap-2 font-bold"
            >
              ⏱ SKIP <span className="text-orange-500/60 font-normal">(−10 pts)</span>
            </button>
          </div>
        </div>

        {/* Right Panel: Editor */}
        <div className="w-1/2 flex flex-col bg-[#1e1e1e]">
          {/* Editor toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-[#0d0d14] shrink-0">
            <select 
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-[#010103] border border-white/10 rounded-xl px-3 py-1.5 text-xs font-bold text-white outline-none focus:border-violet-500 cursor-pointer"
            >
              <option value="cpp">C++ (GCC 17)</option>
              <option value="python">Python 3</option>
              <option value="javascript">JavaScript</option>
            </select>

            <button
              onClick={() => setCode(TEMPLATES[language])}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
            >
              RESET
            </button>
          </div>

          {/* Editor */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            <div className={showCustomInput ? "flex-1 min-h-0" : "flex-1"}>
              <Editor
                height="100%"
                language={MONACO_LANG[language]}
                value={code}
                onChange={(val) => setCode(val || "")}
                theme="vs-dark"
                options={{
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  padding: { top: 16, bottom: 16 },
                  lineNumbers: "on",
                  renderLineHighlight: "line",
                }}
              />
            </div>
            
            {/* Custom Input & Output Panel */}
            {showCustomInput && (
              <div className="h-56 border-t border-white/10 bg-[#12121a] flex shrink-0">
                <div className="w-1/2 flex flex-col border-r border-white/10">
                  <div className="px-4 py-2 border-b border-white/5 text-xs font-bold text-gray-500 bg-[#010103] flex justify-between items-center">
                    <span>CUSTOM INPUT</span>
                    <button onClick={() => setShowCustomInput(false)} className="hover:text-white text-gray-600">✕</button>
                  </div>
                  <textarea 
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    className="flex-1 bg-transparent text-sm font-mono text-white p-4 resize-none outline-none placeholder:text-gray-700"
                    placeholder="Enter custom test input here..."
                  />
                </div>
                <div className="w-1/2 flex flex-col">
                  <div className="px-4 py-2 border-b border-white/5 text-xs font-bold text-gray-500 bg-[#010103]">OUTPUT</div>
                  <div className="flex-1 overflow-auto p-4 font-mono text-sm">
                    {!output ? (
                      <span className="text-gray-700 italic">Run code to see output...</span>
                    ) : output.runtimeError ? (
                      <pre className="text-red-400 whitespace-pre-wrap">{output.stderr || "Runtime Error"}</pre>
                    ) : (
                      <>
                        <pre className="text-emerald-400 whitespace-pre-wrap">{output.stdout}</pre>
                        {output.stderr && <pre className="text-yellow-400 whitespace-pre-wrap mt-2">{output.stderr}</pre>}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="p-4 border-t border-white/5 bg-[#0d0d14] flex items-center justify-between shrink-0">
            <button 
              onClick={() => setShowCustomInput(!showCustomInput)}
              className={`text-xs px-4 py-2.5 border rounded-xl transition-colors font-bold ${
                showCustomInput
                  ? "bg-white/10 text-white border-white/20"
                  : "text-gray-500 hover:text-white border-white/10 hover:border-white/20"
              }`}
            >
              {showCustomInput ? "Hide Input" : "Custom Input"}
            </button>

            <div className="flex gap-3">
              <button 
                onClick={handleRunCode}
                disabled={isRunning}
                className="px-5 py-2.5 rounded-xl border border-white/20 text-white text-xs font-bold hover:bg-white/5 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isRunning ? (
                  <><svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>RUNNING...</>
                ) : "RUN CODE"}
              </button>

              <button 
                onClick={handleSubmit}
                disabled={isSubmitting || isRunning}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-[0_0_20px_-3px_rgba(16,185,129,0.4)] flex items-center gap-2 transition-all active:scale-[0.97] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <><svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>VERIFYING...</>
                ) : "✓ VERIFY ON CF"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
