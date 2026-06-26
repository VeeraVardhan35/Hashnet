/**
 * Code execution via Wandbox API (wandbox.org).
 *
 * Completely free, no API key, maintained since 2013.
 * Supports Python 3, Node.js, and GCC C++.
 * Docs: https://wandbox.org/api-doc
 *
 * NOTE: The previous Piston API (emkc.org) became whitelist-only on 2/15/2026.
 * Wandbox is the drop-in replacement with identical calling conventions.
 */

const WANDBOX_URL = "https://wandbox.org/api/compile.json";

/** Maps our language key → Wandbox compiler name. */
const WANDBOX_COMPILER: Record<string, string> = {
    python: "cpython-3.12.7",
    javascript: "nodejs-20.17.0",
    cpp: "gcc-13.2.0",
};

/** Extra compiler flags (e.g. for C++17). */
const COMPILER_OPTIONS: Record<string, string> = {
    cpp: "-std=c++17 -O2",
};

/** Human-readable labels (for logging). */
export const SUPPORTED_LANGUAGES: Record<string, { label: string }> = {
    python: { label: "Python 3" },
    javascript: { label: "JavaScript" },
    cpp: { label: "C++" },
};

// ── Internal Wandbox response shape ──────────────────────────────────────────

interface WandboxResponse {
    status: string;          // "0" = success, non-zero = runtime/compile error
    signal?: string;         // "SIGKILL" on TLE, etc.
    program_output?: string; // stdout
    program_error?: string;  // stderr (runtime)
    compiler_error?: string; // stderr (compile-time)
    compiler_message?: string;
}

// ── Public types (kept compatible with old piston.ts) ────────────────────────

export interface ExecuteResult {
    stdout: string;
    stderr: string;
    exitCode: number | null;
    timedOut: boolean;
    runtimeError: boolean;
    compileError: boolean;
}

// ── Low-level executor ────────────────────────────────────────────────────────

/**
 * Execute code on Wandbox with optional stdin.
 * httpTimeoutMs covers the full HTTP round-trip (including Wandbox's own
 * execution). If this fires first we return a timedOut result.
 */
export async function executeCode(
    language: string,
    code: string,
    stdin: string = "",
    _pistonTimeoutMs: number = 5000,  // kept for API compat, Wandbox enforces its own
    httpTimeoutMs: number = 20_000
): Promise<ExecuteResult> {
    const compiler = WANDBOX_COMPILER[language];
    if (!compiler) {
        throw new Error(`Unsupported language: ${language}`);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), httpTimeoutMs);

    try {
        const payload: Record<string, string> = {
            compiler,
            code,
            stdin,
        };
        if (COMPILER_OPTIONS[language]) {
            payload.options = COMPILER_OPTIONS[language];
        }

        const res = await fetch(WANDBOX_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: controller.signal,
        });

        if (!res.ok) {
            const body = await res.text();
            throw new Error(`Wandbox API error ${res.status}: ${body}`);
        }

        const data: WandboxResponse = await res.json();

        const exitCode = parseInt(data.status ?? "0", 10);
        const stdout = data.program_output ?? "";
        const compileErr = data.compiler_error ?? "";
        const runtimeErr = data.program_error ?? "";
        const stderr = compileErr + runtimeErr;
        const signal = data.signal ?? "";

        const compileError = compileErr.trim().length > 0;
        const timedOut =
            signal === "SIGKILL" ||
            signal === "SIGTERM" ||
            signal === "SIGXCPU";
        const runtimeError =
            !compileError &&
            !timedOut &&
            (exitCode !== 0 || (runtimeErr.trim().length > 0 && stdout.trim().length === 0));

        return {
            stdout,
            stderr,
            exitCode: isNaN(exitCode) ? null : exitCode,
            timedOut,
            runtimeError,
            compileError,
        };
    } catch (err) {
        if ((err as any)?.name === "AbortError") {
            // Our HTTP timeout fired — treat as TLE
            return {
                stdout: "",
                stderr: "Execution timed out (network).",
                exitCode: null,
                timedOut: true,
                runtimeError: false,
                compileError: false,
            };
        }
        throw err;
    } finally {
        clearTimeout(timer);
    }
}

// ── Evaluator (same signature as before) ─────────────────────────────────────

/**
 * Run code against one test case and return a verdict.
 * All exceptions from Wandbox are propagated — callers (BattleRoom) must
 * wrap in try-catch so they can send a graceful error to the client.
 */
export async function evaluateTestCase(
    language: string,
    code: string,
    input: string,
    expectedOutput: string,
    timeoutMs: number = 5000
): Promise<{
    passed: boolean;
    verdict: "accepted" | "wrong_answer" | "runtime_error" | "time_limit_exceeded";
    actualOutput: string;
    expectedOutput: string;
    stderr: string;
}> {
    const result = await executeCode(language, code, input, timeoutMs);

    const actual = result.stdout.trim();
    const expected = expectedOutput.trim();

    if (result.timedOut) {
        return {
            passed: false,
            verdict: "time_limit_exceeded",
            actualOutput: actual,
            expectedOutput: expected,
            stderr: result.stderr || "Time limit exceeded",
        };
    }

    if (result.compileError) {
        return {
            passed: false,
            verdict: "runtime_error",
            actualOutput: "",
            expectedOutput: expected,
            stderr: result.stderr,
        };
    }

    if (result.runtimeError && result.exitCode !== 0) {
        return {
            passed: false,
            verdict: "runtime_error",
            actualOutput: actual,
            expectedOutput: expected,
            stderr: result.stderr,
        };
    }

    if (actual === expected) {
        return {
            passed: true,
            verdict: "accepted",
            actualOutput: actual,
            expectedOutput: expected,
            stderr: "",
        };
    }

    return {
        passed: false,
        verdict: "wrong_answer",
        actualOutput: actual,
        expectedOutput: expected,
        stderr: result.stderr,
    };
}
