import { useRef, useEffect, useCallback } from "react";
import Editor from "@monaco-editor/react";

// ─────────────────────────────────────────────────────────────────────────────
// Template splitting
//
// Templates in the DB contain marker lines:
//   # USER_CODE_START
//   # Write your solution here
//   # USER_CODE_END
//
// Everything before USER_CODE_START = prefix (read-only top)
// Everything after  USER_CODE_END   = suffix (read-only bottom)
// Content between the markers       = editable body
// ─────────────────────────────────────────────────────────────────────────────

export const SPLIT_MARKERS: Record<string, { start: string; end: string }> = {
  python:     { start: "# USER_CODE_START",   end: "# USER_CODE_END"   },
  javascript: { start: "// USER_CODE_START",  end: "// USER_CODE_END"  },
  cpp:        { start: "// USER_CODE_START",  end: "// USER_CODE_END"  },
};

export interface SplitTemplate {
  prefix: string;   // read-only top shown as static code
  body: string;     // editable in Monaco
  suffix: string;   // read-only bottom shown as static code
}

export function splitTemplate(fullTemplate: string, language: string): SplitTemplate {
  const markers = SPLIT_MARKERS[language];
  if (!markers) return { prefix: "", body: fullTemplate, suffix: "" };

  const startIdx = fullTemplate.indexOf(markers.start);
  const endIdx   = fullTemplate.indexOf(markers.end);

  if (startIdx === -1 || endIdx === -1) {
    // No markers found — entire template is editable (backward compat)
    return { prefix: "", body: fullTemplate, suffix: "" };
  }

  const prefix = fullTemplate.slice(0, startIdx).replace(/\n$/, "");
  const body   = fullTemplate
    .slice(startIdx + markers.start.length, endIdx)
    .replace(/^\n/, "")
    .replace(/\n$/, "");
  const suffix = fullTemplate.slice(endIdx + markers.end.length).replace(/^\n/, "");

  return { prefix, body, suffix };
}

/** Reconstruct the full submission code from parts */
export function assembleCode(prefix: string, body: string, suffix: string, language: string): string {
  const markers = SPLIT_MARKERS[language];
  if (!markers) return body;
  const parts: string[] = [];
  if (prefix) parts.push(prefix);
  parts.push(markers.start);
  parts.push(body);
  parts.push(markers.end);
  if (suffix) parts.push(suffix);
  return parts.join("\n");
}
