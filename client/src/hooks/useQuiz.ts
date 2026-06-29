import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuizStore } from "../store/quiz.store";
import { useRoomStore } from "../store/room.store";
import { useAuthStore } from "../store/auth.store";
import { gameClient } from "../colyseus/client";
import type { LeaderboardEntry, QuizQuestion } from "../types";

/**
 * useQuiz — manages the Colyseus QuizRoom connection and all quiz lifecycle.
 *
 * Design:
 * - Questions (with correct answers) are received once via "questions" message.
 * - Answer evaluation is instant (client-side) for zero latency.
 * - Answer submission is also sent to server for score verification.
 * - Leaderboard syncs via Colyseus delta state (schema).
 * - Activity feed comes from broadcast "activity" messages.
 */
export function useQuiz() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const quizRoomId = useRoomStore((s) => s.quizRoomId);

  const {
    quizRoom,
    questions,
    questionIndex,
    selectedOption,
    phase,
    leaderboard,
    activityFeed,
    roundEndsAt,
    phaseStartsAt,
    roundDuration,
    connected,
    finalLeaderboard,
    setQuizRoom,
    setQuestions,
    setQuestionIndex,
    setSelectedOption,
    setPhase,
    setLeaderboard,
    addActivity,
    setRoundEndsAt,
    setPhaseStartsAt,
    setRoundDuration,
    setConnected,
    setFinalLeaderboard,
    reset,
  } = useQuizStore();

  // expose a local reset for selected option (UI may need to clear optimistic state)
  const resetSelectedOption = useCallback(() => {
    setSelectedOption(-1);
  }, [setSelectedOption]);

  const roomRef = useRef<any>(quizRoom);
  useEffect(() => {
    roomRef.current = quizRoom;
  }, [quizRoom]);

  // ── Connect to quiz room ─────────────────────────────────────────────
  useEffect(() => {
    if (!quizRoomId || !user) return;
    if (quizRoom) return; // already connected

    let cancelled = false;

    (async () => {
      try {
        console.log("[useQuiz] Joining quiz room:", quizRoomId);
        const room = await gameClient.joinById(quizRoomId, {
          username: user.username,
        });

        if (cancelled) {
          room.leave();
          return;
        }

        setQuizRoom(room);
        roomRef.current = room;
        localStorage.setItem("hashnet_reconnect_token", room.reconnectionToken);
        setConnected(true);

        // ── One-shot: receive all questions (with answers) ──────────
        room.onMessage("questions", (data: QuizQuestion[]) => {
          setQuestions(data);
        });

        // ── Phase sync for late joiners ─────────────────────────────
        room.onMessage(
          "phaseSync",
          (data: {
            phase: string;
            questionIndex: number;
            roundEndsAt: number;
            phaseStartsAt: number;
          }) => {
            setPhase(data.phase as any);
            setQuestionIndex(data.questionIndex);
            setRoundEndsAt(data.roundEndsAt);
            setPhaseStartsAt(data.phaseStartsAt);
          }
        );

        // ── Activity feed ───────────────────────────────────────────
        room.onMessage(
          "activity",
          (data: { username: string; correct: boolean; points: number }) => {
            addActivity(data);
          }
        );

        // ── Final leaderboard ───────────────────────────────────────
        room.onMessage(
          "gameOver",
          (data: {
            leaderboard: {
              id: string;
              username: string;
              score: number;
              streak: number;
            }[];
          }) => {
            setFinalLeaderboard(data.leaderboard);
            setPhase("finished");
          }
        );

        // ── Colyseus state delta sync (schema) ──────────────────────
        room.onStateChange((state: any) => {
          // Phase
          setPhase(state.phase);

          // Question index
          setQuestionIndex(state.questionIndex);

          // Timer
          setRoundEndsAt(state.roundEndsAt);
          setPhaseStartsAt(state.phaseStartsAt);
          setRoundDuration(state.roundDuration);

          // Leaderboard — build sorted array from MapSchema
          const entries: LeaderboardEntry[] = Array.from(
            state.players.values() as Iterable<any>
          )
            .map((p: any) => ({
              id: p.id,
              username: p.username,
              score: p.score,
              answered: p.answered,
              lastAnswerCorrect: p.lastAnswerCorrect,
              streak: p.streak,
              isHost: p.isHost,
            }))
            .sort((a, b) => b.score - a.score);

          setLeaderboard(entries);
        });

        room.onLeave(() => {
          setConnected(false);
          console.log("[useQuiz] Disconnected from quiz room");
        });

        room.onError((code: number, msg?: string) => {
          console.error("[useQuiz] Error:", code, msg);
        });
      } catch (err) {
        console.error("[useQuiz] Failed to join quiz room:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [quizRoomId, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cleanup on unmount ───────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.leave();
      }
      reset();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ──────────────────────────────────────────────────────────

  /**
   * Submit answer for the current question.
   * Instant local feedback via selectedOption → local question.correctIndex.
   * Server verifies and updates scores.
   */
  const submitAnswer = useCallback(
    (optionIndex: number) => {
      if (selectedOption !== -1) return; // already answered
      if (phase !== "question") return;

      setSelectedOption(optionIndex);
      roomRef.current?.send("submitAnswer", { optionIndex });
    },
    [selectedOption, phase, setSelectedOption]
  );

  const leaveQuiz = useCallback(() => {
    roomRef.current?.send("leaveRoom");
    roomRef.current?.leave(true);
    localStorage.removeItem("hashnet_reconnect_token");
    reset();
    navigate("/home");
  }, [navigate, reset]);

  const currentQuestion: QuizQuestion | null = questions[questionIndex] ?? null;
  const myEntry = leaderboard.find((e) => e.id === roomRef.current?.sessionId);

  return {
    questions,
    currentQuestion,
    questionIndex,
    selectedOption,
    phase,
    leaderboard,
    activityFeed,
    roundEndsAt,
    phaseStartsAt,
    roundDuration,
    connected,
    finalLeaderboard,
    myEntry,
    submitAnswer,
    resetSelectedOption,
    leaveQuiz,
  };
}
