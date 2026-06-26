import { useRef } from "react";
import Editor from "@monaco-editor/react";
import { useBattleStore } from "../store/battle.store";

const LANGUAGE_LABELS: Record<string, string> = {
  python: "Python 3",
  javascript: "JavaScript",
  cpp: "C++",
};

const MONACO_LANG: Record<string, string> = {
  python: "python",
  javascript: "javascript",
  cpp: "cpp",
};

interface CodeEditorProps {
  onRun: () => void;
  onSubmit: () => void;
  isRunning: boolean;
  isSubmitting: boolean;
  /** When true the editor is read-only and both action buttons are disabled */
  isEliminated?: boolean;
}

export default function CodeEditor({
  onRun,
  onSubmit,
  isRunning,
  isSubmitting,
  isEliminated = false,
}: CodeEditorProps) {
  const { language, code, problem, setLanguage, setCode } = useBattleStore();
  const editorRef = useRef<any>(null);

  const changeLanguage = (lang: "python" | "javascript" | "cpp") => {
    if (isEliminated) return;
    setLanguage(lang);
    if (problem?.templates) {
      setCode(problem.templates[lang] ?? "");
    }
  };

  const buttonsDisabled = isRunning || isSubmitting || isEliminated;

  return (
    <div className="flex flex-col h-full relative">

      {/* ── Eliminated overlay ────────────────────────────────────────── */}
      {isEliminated && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-sm rounded-b-xl pointer-events-none">
          <span className="text-5xl">☠</span>
          <p className="text-red-400 font-bold text-lg tracking-wide">You have been eliminated</p>
          <p className="text-text-muted text-sm">You can still watch the problem and leaderboard</p>
        </div>
      )}

      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/8 bg-bg-surface/60 shrink-0">
        {/* Language selector */}
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
          </svg>
          <div className="flex gap-1">
            {(["python", "javascript", "cpp"] as const).map((lang) => (
              <button
                key={lang}
                id={`lang-${lang}`}
                onClick={() => changeLanguage(lang)}
                disabled={isEliminated}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                  language === lang
                    ? "bg-primary text-white shadow-glow"
                    : "text-text-muted hover:text-text-secondary hover:bg-white/5"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {LANGUAGE_LABELS[lang]}
              </button>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            id="run-code-btn"
            onClick={onRun}
            disabled={buttonsDisabled}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 text-xs font-semibold text-text-secondary hover:text-text-primary hover:border-white/30 hover:bg-white/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin text-accent" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Running…
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Run Code
              </>
            )}
          </button>

          <button
            id="submit-code-btn"
            onClick={onSubmit}
            disabled={buttonsDisabled}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success text-white text-xs font-bold hover:bg-success/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-glow-green"
          >
            {isSubmitting ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Judging…
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                Submit
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Monaco Editor ─────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={MONACO_LANG[language]}
          value={code}
          onChange={(val) => { if (!isEliminated) setCode(val ?? ""); }}
          theme="vs-dark"
          onMount={(editor) => { editorRef.current = editor; }}
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            minimap: { enabled: false },
            lineNumbers: "on",
            automaticLayout: true,
            scrollBeyondLastLine: false,
            tabSize: 4,
            insertSpaces: true,
            wordWrap: "off",
            renderLineHighlight: "line",
            cursorBlinking: "smooth",
            smoothScrolling: true,
            padding: { top: 8, bottom: 8 },
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            readOnly: isEliminated,
          }}
        />
      </div>
    </div>
  );
}
