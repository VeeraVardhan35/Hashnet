import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { gameClient } from "../colyseus/client";
import { useAuthStore } from "../store/auth.store";
import { useRoomStore } from "../store/room.store";
import { useTeamsStore } from "../store/teams.store";
import type { TeamsPlayerEntry } from "../store/teams.store";

export function useTeams() {
  const navigate      = useNavigate();
  const user          = useAuthStore((s) => s.user);
  const teamsRoomId   = useRoomStore((s) => s.teamsRoomId);
  const resetRoom     = useRoomStore((s) => s.reset);
  const store         = useTeamsStore();
  const roomRef       = useRef<any>(null);
  const joinedRef     = useRef(false);

  // ── Join the TeamsRoom ────────────────────────────────────────────────────
  useEffect(() => {
    if (!teamsRoomId || !user || joinedRef.current) return;
    joinedRef.current = true;

    (async () => {
      try {
        const room = await gameClient.joinById(teamsRoomId, { username: user.username });
        roomRef.current = room;
        store.setConnected(true);

        // Register all listeners BEFORE sending ready
        room.onStateChange((state: any) => {
          store.setPhase(state.phase);
          store.setRoundNumber(state.roundNumber);
          store.setTotalRounds(state.totalRounds);
          store.setRoundEndsAt(state.roundEndsAt);
          store.setRoundDuration(state.roundDuration);
          store.setPhaseStartsAt(state.phaseStartsAt);
          store.setTeamAlphaScore(state.teamAlphaScore);
          store.setTeamBetaScore(state.teamBetaScore);

          const arr: TeamsPlayerEntry[] = Array.from(state.players.values() as Iterable<any>)
            .map((p: any) => ({
              id: p.id, username: p.username, team: p.team,
              score: p.score, solved: p.solved,
              submissionStatus: p.submissionStatus,
              submissions: p.submissions, isHost: p.isHost,
            }))
            .sort((a, b) => b.score - a.score);
          store.setPlayers(arr);
        });

        room.onMessage("problem", (data: any) => {
          store.setProblem(data);
          // setProblem auto-extracts body from python template via splitTemplate
        });

        room.onMessage("phaseSync", (data: any) => {
          if (data.phase) store.setPhase(data.phase);
          if (data.roundNumber) store.setRoundNumber(data.roundNumber);
          if (data.totalRounds) store.setTotalRounds(data.totalRounds);
          if (data.roundEndsAt) store.setRoundEndsAt(data.roundEndsAt);
          if (data.phaseStartsAt) store.setPhaseStartsAt(data.phaseStartsAt);
        });

        room.onMessage("liveEvent", (data: any) => {
          store.addLiveEvent({ username: data.username, team: data.team ?? "", type: data.type, message: data.message, color: data.color });
        });

        room.onMessage("runCodeResult", (data: any) => {
          store.setIsRunning(false);
          if (data.results) store.setRunResults(data.results);
          else if (data.error) store.setRunResults([{ passed: false, verdict: "error", stderr: data.error, input: "", expectedOutput: "", actualOutput: "" }]);
        });

        room.onMessage("submitResult", (data: any) => {
          store.setIsSubmitting(false);
          store.setLastVerdict(data.verdict, data.details ?? "");
          if (data.earned) store.setLastEarned(data.earned);
          store.addSubmission(data.verdict, useTeamsStore.getState().language);
        });

        room.onMessage("roundResult", (data: any) => {
          store.addLiveEvent({
            username: "System",
            team: "",
            type: "system",
            message: `Round ${data.roundNumber} ended — ${data.roundWinner === "tie" ? "TIE!" : `Team ${data.roundWinner.toUpperCase()} leads!`}`,
            color: "yellow",
          });
        });

        room.onMessage("gameOver", (data: any) => {
          store.setFinalResult(data);
          store.setPhase("finished");
        });

        room.onLeave(() => {
          store.setConnected(false);
        });

        // Signal server we're ready
        room.send("ready");
      } catch (err) {
        console.error("[useTeams] Failed to join room:", err);
        navigate("/home");
      }
    })();

    return () => {
      roomRef.current?.leave();
      store.reset();
    };
  }, [teamsRoomId, user]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const runCode = useCallback(() => {
    const s = useTeamsStore.getState();
    if (!roomRef.current || s.isRunning || s.isSubmitting) return;
    store.setIsRunning(true);
    store.setRunResults([]);
    roomRef.current.send("runCode", { code: s.getFullCode(), language: s.language });
  }, []);

  const submitCode = useCallback(() => {
    const s = useTeamsStore.getState();
    if (!roomRef.current || s.isRunning || s.isSubmitting) return;
    store.setIsSubmitting(true);
    store.setLastVerdict("", "");
    roomRef.current.send("submitCode", { code: s.getFullCode(), language: s.language });
  }, []);

  const leaveRoom = useCallback(() => {
    roomRef.current?.leave();
    store.reset();
    resetRoom();
    navigate("/home");
  }, [navigate, resetRoom]);

  return {
    ...useTeamsStore.getState(),
    // Live subscriptions (use hook-based selectors for reactivity):
    problem:         useTeamsStore((s) => s.problem),
    phase:           useTeamsStore((s) => s.phase),
    roundNumber:     useTeamsStore((s) => s.roundNumber),
    totalRounds:     useTeamsStore((s) => s.totalRounds),
    roundEndsAt:     useTeamsStore((s) => s.roundEndsAt),
    roundDuration:   useTeamsStore((s) => s.roundDuration),
    phaseStartsAt:   useTeamsStore((s) => s.phaseStartsAt),
    teamAlphaScore:  useTeamsStore((s) => s.teamAlphaScore),
    teamBetaScore:   useTeamsStore((s) => s.teamBetaScore),
    players:         useTeamsStore((s) => s.players),
    liveEvents:      useTeamsStore((s) => s.liveEvents),
    runResults:      useTeamsStore((s) => s.runResults),
    isRunning:       useTeamsStore((s) => s.isRunning),
    isSubmitting:    useTeamsStore((s) => s.isSubmitting),
    lastVerdict:     useTeamsStore((s) => s.lastVerdict),
    lastVerdictDetails: useTeamsStore((s) => s.lastVerdictDetails),
    lastEarned:      useTeamsStore((s) => s.lastEarned),
    connected:       useTeamsStore((s) => s.connected),
    finalResult:     useTeamsStore((s) => s.finalResult),
    submissionHistory: useTeamsStore((s) => s.submissionHistory),
    language:        useTeamsStore((s) => s.language),
    body:            useTeamsStore((s) => s.body),
    fullTemplate:    useTeamsStore((s) => s.fullTemplate),
    activeTab:       useTeamsStore((s) => s.activeTab),
    runCode,
    submitCode,
    leaveRoom,
  };
}
