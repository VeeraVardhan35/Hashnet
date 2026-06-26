import { useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import { splitTemplate, assembleCode, SPLIT_MARKERS } from "../utils/templateSplit";

// ─────────────────────────────────────────────────────────────────────────────
// CodeEditor — LeetCode-style
//
// Layout (top → bottom):
//   ┌─────────── Toolbar (language selector + run/submit) ──────────────┐
//   │  [prefix panel]  — read-only, faded, shows class/function header  │
//   │  [Monaco editor] — only the function body is editable             │
//   │  [suffix panel]  — read-only, faded, shows closing braces         │
//   └───────────────────────────────────────────────────────────────────┘
// ─────────────────────────────────────────────────────────────────────────────

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

// Comment char per language for the read-only panels
const COMMENT_COLOR: Record<string, string> = {
  python: "#6a9153",
  javascript: "#6a9955",
  cpp: "#6a9955",
};

interface CodeEditorProps {
  /** The current full template (prefix + markers + body + suffix) for the problem */
  fullTemplate?: string;
  /** Language: python | javascript | cpp */
  language: "python" | "javascript" | "cpp";
  /** Only the editable function body (what the user typed so far) */
  body: string;
  onBodyChange: (newBody: string) => void;
  onLanguageChange: (lang: "python" | "javascript" | "cpp") => void;
  onRun: () => void;
  onSubmit: () => void;
  isRunning: boolean;
  isSubmitting: boolean;
  /** When true the editor is read-only and buttons are disabled */
  isEliminated?: boolean;
}

export default function CodeEditor({
  fullTemplate = "",
  language,
  body,
  onBodyChange,
  onLanguageChange,
  onRun,
  onSubmit,
  isRunning,
  isSubmitting,
  isEliminated = false,
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);

  const split = splitTemplate(fullTemplate, language);
  const prefix = split.prefix;
  const suffix = split.suffix;

  // When template/language changes, reset body to the default body from the template
  // This is handled by the parent when it calls onLanguageChange and sets new template.

  const buttonsDisabled = isRunning || isSubmitting || isEliminated;

  // Prefix/suffix static panel — renders like a code block but not editable
  const StaticCodePanel = ({ text, position }: { text: string; position: "top" | "bottom" }) => {
    if (!text.trim()) return null;
    const lines = text.split("\n");
    return (
      <div
        className={`shrink-0 px-[60px] py-1 font-mono text-[13px] select-none pointer-events-none
          bg-[#1e1e1e] border-white/5
          ${position === "top" ? "border-b" : "border-t"}`}
        style={{
          lineHeight: "19px",
          color: "#d4d4d4",
          opacity: 0.55,
          letterSpacing: "0.01em",
          userSelect: "none",
        }}
      >
        {lines.map((line, i) => (
          <div key={i} className="flex">
            {/* line number gutter */}
            <span
              className="w-[30px] shrink-0 text-right mr-4 text-[12px]"
              style={{ color: "#858585", userSelect: "none" }}
            >
              {i + 1}
            </span>
            {/* line content */}
            <span style={{ whiteSpace: "pre" }}>{line || "\u00a0"}</span>
          </div>
        ))}
      </div>
    );
  };

  // Determine how many lines the prefix occupies so Monaco line numbers are offset correctly
  const prefixLineCount = prefix ? prefix.split("\n").length + 1 : 0; // +1 for the marker line

  return (
    <div className="flex flex-col h-full relative bg-[#1e1e1e]">

      {/* ── Eliminated overlay ────────────────────────────────────────── */}
      {isEliminated && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-sm pointer-events-none">
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
                onClick={() => !isEliminated && onLanguageChange(lang)}
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

        {/* Hint badge */}
        <span className="hidden md:flex items-center gap-1 text-[10px] text-text-muted border border-white/8 px-2.5 py-1 rounded-full">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Write your solution in the highlighted area
        </span>

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

      {/* ── Read-only prefix (class / function signature) ─────────────── */}
      <StaticCodePanel text={prefix} position="top" />

      {/* ── Editable body in Monaco ────────────────────────────────────── */}
      <div className="flex-1 min-h-0 relative">
        {/* Subtle "editable zone" left-border accent */}
        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary/40 z-10" />

        <Editor
          height="100%"
          language={MONACO_LANG[language]}
          value={body}
          onChange={(val) => { if (!isEliminated) onBodyChange(val ?? ""); }}
          theme="vs-dark"
          onMount={(editor, monaco) => {
            editorRef.current = editor;

            // Offset line numbers by the prefix line count so they appear continuous
            if (prefixLineCount > 0) {
              editor.updateOptions({ lineNumbersMinChars: 3 });
              // Override line number display to offset by prefixLineCount
              editor.updateOptions({
                lineNumbers: (lineNumber: number) =>
                  String(lineNumber + prefixLineCount),
              } as any);
            }
          }}
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            minimap: { enabled: false },
            lineNumbers: prefixLineCount > 0
              ? ((n: number) => String(n + prefixLineCount)) as any
              : "on",
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
            // Highlight the editable area with a subtle background
            renderIndentGuides: true,
          }}
        />
      </div>

      {/* ── Read-only suffix (closing braces etc.) ─────────────────────── */}
      <StaticCodePanel text={suffix} position="bottom" />
    </div>
  );
}
