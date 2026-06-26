import { useState } from "react";

interface RoomCodeDisplayProps {
  code: string;
}

/**
 * RoomCodeDisplay — shows the 6-char room code in a large monospace
 * font with a click-to-copy button. Shows brief feedback on copy.
 */
export default function RoomCodeDisplay({ code }: RoomCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments without clipboard API
      const el = document.createElement("textarea");
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
        Room Code
      </p>

      <button
        onClick={handleCopy}
        title="Click to copy room code"
        className={`
          group relative flex items-center gap-3 px-6 py-3 rounded-2xl
          border transition-all duration-300 cursor-pointer
          ${copied
            ? "border-success/60 bg-success/10 shadow-glow-green"
            : "border-primary/40 bg-primary/10 hover:border-primary/70 hover:bg-primary/15 hover:shadow-glow"
          }
        `}
      >
        {/* Code characters */}
        <span className="font-mono text-3xl font-bold tracking-[0.3em] text-text-primary select-all">
          {code}
        </span>

        {/* Copy icon / check */}
        <span
          className={`
            transition-all duration-200
            ${copied ? "text-success" : "text-text-muted group-hover:text-primary"}
          `}
        >
          {copied ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </span>
      </button>

      <p className="text-xs text-text-muted">
        {copied ? "✓ Copied to clipboard!" : "Click to copy · Share with friends"}
      </p>
    </div>
  );
}
