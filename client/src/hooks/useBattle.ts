import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useBattleStore } from "../store/battle.store";
import { useRoomStore } from "../store/room.store";
import { useAuthStore } from "../store/auth.store";
import { gameClient } from "../colyseus/client";
import type {
  BattleProblem,
  BattlePlayerEntry,
  RunCodeTestResult,
} from "../types";

/**
 * useBattle — manages the Colyseus BattleRoom WebSocket connection.
 *
 * Race-condition fix: The server now HOLDS initial messages ("problem", "phaseSync")
 * until the client sends "ready". This guarantees all onMessage listeners are
 * registered before any messages arrive.
 *
 * React Strict Mode fix: `isJoiningRef` prevents the double-invocation of the
 * join effect from opening two simultaneous WebSocket sessions.
 */
export function useBattle() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const battleRoomId = useRoomStore((s) => s.battleRoomId);

  const store = useBattleStore();
  const {
    battleRoom,
    language,
    code,
    setBattleRoom,
    setProblem,
    setRoundNumber,
    setTotalRounds,
    setPhase,
    setRoundEndsAt,
    setRoundDuration,
    setPhaseStartsAt,
    setLeaderboard,
    addLiveEvent,
    setRunResults,
    setIsRunning,
    setIsSubmitting,
    setLastVerdict,
    setConnected,
    setFinalLeaderboard,
    addSubmissionToHistory,
    reset,
  } = store;

  const roomRef = useRef<any>(null);
  /** Guards against React Strict Mode double-invocation of the join effect. */
  const isJoiningRef = useRef(false);

  // ── Connect to BattleRoom ──────────────────────────────────────────────────
  useEffect(() => {
    if (!battleRoomId || !user) return;
    // Prevent double-join from React Strict Mode or rapid re-renders
    if (isJoiningRef.current) return;

    isJoiningRef.current = true;

    // Track the local room so the cleanup can leave it even if it arrived
    // after the effect was scheduled for cleanup.
    let localRoom: any = null;
    let cleaned = false;

    (async () => {
      try {
        console.log("[useBattle] Joining battle room:", battleRoomId);
        const room = await gameClient.joinById(battleRoomId, {
          username: user.username,
        });

        if (cleaned) {
          // Component unmounted while we were awaiting the connection
          room.leave();
          return;
        }

        localRoom = room;
        roomRef.current = room;

        // ── Register ALL onMessage handlers BEFORE sending "ready" ───────────
        // The server will not push "problem" / "phaseSync" until it receives
        // the "ready" signal, so there is no window where messages can be lost.

        room.onMessage("problem", (data: BattleProblem) => {
          setProblem(data);
        });

        room.onMessage(
          "liveEvent",
          (data: {
            username: string;
            type: "accepted" | "eliminated";
            message: string;
            color: "green" | "red";
          }) => {
            addLiveEvent(data);
          }
        );

        room.onMessage(
          "runCodeResult",
          (data: { results?: RunCodeTestResult[]; error?: string }) => {
            setIsRunning(false);
            if (data.results) {
              setRunResults(data.results);
            } else if (data.error) {
              // Server-side error (Piston unavailable etc.) — show as a failed entry
              setRunResults([
                {
                  input: "",
                  expectedOutput: "",
                  actualOutput: "",
                  passed: false,
                  verdict: "error",
                  stderr: data.error,
                } as any,
              ]);
            }
          }
        );

        room.onMessage(
          "submitResult",
          (data: {
            verdict: string;
            details: string;
            score?: number;
            earned?: number;
          }) => {
            setIsSubmitting(false);
            setLastVerdict(data.verdict, data.details, data.earned ?? 0);
            // Use the store's current language at call time
            addSubmissionToHistory(data.verdict, useBattleStore.getState().language);
          }
        );

        room.onMessage(
          "gameOver",
          (data: {
            leaderboard: {
              id: string;
              username: string;
              score: number;
              solved: number;
              isAlive: boolean;
            }[];
          }) => {
            setFinalLeaderboard(data.leaderboard);
            setPhase("finished");
          }
        );

        room.onMessage(
          "phaseSync",
          (data: {
            phase: string;
            roundNumber: number;
            totalRounds: number;
            roundEndsAt: number;
            phaseStartsAt: number;
          }) => {
            setPhase(data.phase as any);
            setRoundNumber(data.roundNumber);
            setTotalRounds(data.totalRounds);
            setRoundEndsAt(data.roundEndsAt);
            setPhaseStartsAt(data.phaseStartsAt);
          }
        );

        // ── Schema delta sync ────────────────────────────────────────────────
        room.onStateChange((state: any) => {
          setPhase(state.phase);
          setRoundNumber(state.roundNumber);
          setTotalRounds(state.totalRounds);
          setRoundEndsAt(state.roundEndsAt);
          setRoundDuration(state.roundDuration);
          setPhaseStartsAt(state.phaseStartsAt);

          const entries: BattlePlayerEntry[] = Array.from(
            state.players.values() as Iterable<any>
          )
            .map((p: any) => ({
              id: p.id,
              username: p.username,
              score: p.score,
              isAlive: p.isAlive,
              solved: p.solved,
              submissionStatus: p.submissionStatus,
              isHost: p.isHost,
              submissions: p.submissions,
            }))
            .sort((a, b) => {
              if (a.isAlive !== b.isAlive) return a.isAlive ? -1 : 1;
              return b.score - a.score;
            });

          setLeaderboard(entries);
        });

        room.onLeave(() => {
          setConnected(false);
          console.log("[useBattle] Disconnected");
        });

        room.onError((code: number, msg: string) => {
          console.error("[useBattle] Room error:", code, msg);
        });

        // ── All listeners registered — signal server we are ready ─────────────
        // The server will now push "problem" and "phaseSync" to this client.
        room.send("ready");

        // Update store AFTER sending "ready" so any immediate server responses
        // that fire synchronously still have handlers attached.
        setBattleRoom(room);
        setConnected(true);

        console.log("[useBattle] Ready signal sent, connection established");
      } catch (err) {
        console.error("[useBattle] Failed to join battle room:", err);
        isJoiningRef.current = false;
      }
    })();

    // Cleanup: runs on unmount OR when battleRoomId/user changes
    return () => {
      cleaned = true;
      isJoiningRef.current = false;
      if (localRoom) {
        localRoom.leave();
        localRoom = null;
      }
      roomRef.current = null;
      reset();
    };
  }, [battleRoomId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ────────────────────────────────────────────────────────────────

  const runCode = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;
    const { code, language } = useBattleStore.getState();
    setIsRunning(true);
    setRunResults([]);
    room.send("runCode", { code, language });
  }, [setIsRunning, setRunResults]);

  const submitCode = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;
    const { code, language } = useBattleStore.getState();
    setIsSubmitting(true);
    setLastVerdict("", "");
    room.send("submitCode", { code, language });
  }, [setIsSubmitting, setLastVerdict]);

  const leaveRoom = useCallback(() => {
    const room = roomRef.current;
    if (room) {
      room.leave();
      roomRef.current = null;
    }
    reset();
    navigate("/home");
  }, [navigate, reset]);

  const myEntry = store.leaderboard.find(
    (e) => e.id === roomRef.current?.sessionId
  );

  return {
    ...store,
    myEntry,
    runCode,
    submitCode,
    leaveRoom,
  };
}
