import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuizBossRaidStore } from "../store/quizBossRaid.store";
import type { QuizRaidPlayerEntry } from "../store/quizBossRaid.store";
import { useRoomStore } from "../store/room.store";
import { useAuthStore } from "../store/auth.store";
import { gameClient } from "../colyseus/client";

export function useQuizBossRaid() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const quizBossRaidRoomId = useRoomStore((s) => s.quizBossRaidRoomId);
  const store = useQuizBossRaidStore();

  const roomRef = useRef<any>(null);
  const resetRoom = useRoomStore((s) => s.reset);

  useEffect(() => {
    if (!quizBossRaidRoomId || !user) return;
    if (store.connected && roomRef.current) return;

    let mounted = true;
    let room: any;

    async function connect() {
      try {
        room = await gameClient.joinById(quizBossRaidRoomId!, {
          username: user!.username,
        });
        if (!mounted) {
          room.leave();
          return;
        }

        roomRef.current = room;
        localStorage.setItem("hashnet_reconnect_token", room.reconnectionToken);
        store.setConnected(true);

        room.onStateChange((state: any) => {
          store.setPhase(state.phase);
          store.setQuestionIndex(state.questionIndex); // ← critical: advance question index each round
          store.setRoundEndsAt(state.roundEndsAt);
          store.setRoundDuration(state.roundDuration);
          store.setPhaseStartsAt(state.phaseStartsAt);

          store.setBossState({
            bossName: state.bossName,
            bossLevel: state.bossLevel,
            bossHp: state.bossHp,
            bossMaxHp: state.bossMaxHp,
            bossPhase: state.bossPhase,
            nextAbilityName: state.nextAbilityName,
            nextAbilityAt: state.nextAbilityAt,
            activeAbilities: Array.from(state.activeAbilities || []),
          });

          const playersMap: Record<string, QuizRaidPlayerEntry> = {};
          state.players.forEach((p: any, id: string) => {
            playersMap[id] = {
              id,
              username: p.username,
              role: p.role,
              hp: p.hp,
              maxHp: p.maxHp,
              score: p.score,
              damageDealt: p.damageDealt,
              isAlive: p.isAlive,
              isHost: p.isHost,
              answered: p.answered,
              lastAnswerCorrect: p.lastAnswerCorrect,
              streak: p.streak,
              silencedUntil: p.silencedUntil,
              stunnedUntil: p.stunnedUntil,
              isDoomMarked: p.isDoomMarked,
            };
          });
          store.setPlayers(playersMap);
        });

        room.onMessage("questions", (data: any) => {
          store.setQuestions(data);
        });

        room.onMessage("phaseSync", (data: any) => {
          store.setPhase(data.phase);
          store.setQuestionIndex(data.questionIndex);
          store.setRoundEndsAt(data.roundEndsAt);
          store.setPhaseStartsAt(data.phaseStartsAt);
        });

        room.onMessage("liveEvent", (data: any) => {
          store.addLiveEvent({
            username: data.username,
            type: data.type,
            message: data.message,
          });
        });

      } catch (err) {
        console.error("[useQuizBossRaid] Connect error:", err);
      }
    }

    connect();

    return () => {
      mounted = false;
      if (room) {
        room.leave();
      }
    };
  }, [quizBossRaidRoomId, user]);

  const submitAnswer = useCallback((optionIndex: number) => {
    if (roomRef.current && store.selectedOption === -1) {
      store.setSelectedOption(optionIndex);
      roomRef.current.send("submitAnswer", { optionIndex });
    }
  }, [store.selectedOption]);

  const leaveRoom = useCallback(() => {
    if (roomRef.current) {
      roomRef.current.send("leaveRoom");
      roomRef.current.leave(true);
      localStorage.removeItem("hashnet_reconnect_token");
    }
    store.reset();
    resetRoom();
    navigate("/home");
  }, [navigate, resetRoom, store]);

  return {
    ...store,
    myEntry: store.players[roomRef.current?.sessionId || ""],
    submitAnswer,
    leaveRoom,
  };
}
