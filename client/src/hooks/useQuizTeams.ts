import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuizTeamsStore } from "../store/quizTeams.store";
import type { QuizTeamsPlayerEntry } from "../store/quizTeams.store";
import { useRoomStore } from "../store/room.store";
import { useAuthStore } from "../store/auth.store";
import { gameClient } from "../colyseus/client";

export function useQuizTeams() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const quizTeamsRoomId = useRoomStore((s) => s.quizTeamsRoomId);
  // Read the lobby player list so we can pass preferredTeam to the game room
  const lobbyPlayers = useRoomStore((s) => s.players);
  const store = useQuizTeamsStore();

  const roomRef = useRef<any>(null);

  const resetRoom = useRoomStore((s) => s.reset);

  useEffect(() => {
    if (!quizTeamsRoomId || !user) return;
    if (store.connected && roomRef.current) return;

    let mounted = true;
    let room: any;

    async function connect() {
      try {
        // Find this user's preferred team from the lobby player list
        const myLobbyPlayer = lobbyPlayers.find((p) => p.username === user!.username);
        const preferredTeam = myLobbyPlayer?.preferredTeam ?? "";

        room = await gameClient.joinById(quizTeamsRoomId!, {
          username: user!.username,
          preferredTeam: preferredTeam || undefined,
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
          store.setTeamAlphaScore(state.teamAlphaScore);
          store.setTeamBetaScore(state.teamBetaScore);

          const playersMap: Record<string, QuizTeamsPlayerEntry> = {};
          state.players.forEach((p: any, id: string) => {
            playersMap[id] = {
              id,
              username: p.username,
              team: p.team,
              score: p.score,
              answered: p.answered,
              lastAnswerCorrect: p.lastAnswerCorrect,
              streak: p.streak,
              isHost: p.isHost,
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

        room.onMessage("activity", (data: any) => {
          store.addActivity({
            username: data.username,
            correct: data.correct,
            points: data.points,
          });
        });

      } catch (err) {
        console.error("[useQuizTeams] Connect error:", err);
      }
    }

    connect();

    return () => {
      mounted = false;
      if (room) {
        room.leave();
      }
    };
  }, [quizTeamsRoomId, user]);

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
    submitAnswer,
    leaveRoom,
  };
}
