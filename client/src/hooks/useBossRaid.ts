import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { gameClient } from "../colyseus/client";
import { useAuthStore } from "../store/auth.store";
import { useRoomStore } from "../store/room.store";
import { useBossRaidStore } from "../store/bossRaid.store";
import type { RaidPlayerEntry } from "../store/bossRaid.store";

export function useBossRaid() {
  const navigate       = useNavigate();
  const user           = useAuthStore((s) => s.user);
  const bossRaidRoomId = useRoomStore((s) => s.bossRaidRoomId);
  const resetRoom      = useRoomStore((s) => s.reset);
  const store          = useBossRaidStore();
  const roomRef        = useRef<any>(null);
  const joinedRef      = useRef(false);

  useEffect(() => {
    if (!bossRaidRoomId || !user || joinedRef.current) return;
    joinedRef.current = true;

    (async () => {
      try {
        const room = await gameClient.joinById(bossRaidRoomId, { username: user.username });
        roomRef.current = room;
        store.setConnected(true);

        room.onStateChange((state: any) => {
          store.setPhase(state.phase);
          store.setWaveNumber(state.waveNumber);
          store.setTotalWaves(state.totalWaves);
          store.setRoundEndsAt(state.roundEndsAt);
          store.setRoundDuration(state.roundDuration);
          store.setPhaseStartsAt(state.phaseStartsAt);
          store.setBossStats({
            bossName: state.bossName,
            bossLevel: state.bossLevel,
            bossHp: state.bossHp,
            bossMaxHp: state.bossMaxHp,
            bossPhase: state.bossPhase,
            nextAbilityName: state.nextAbilityName,
            nextAbilityAt: state.nextAbilityAt,
            activeAbilities: JSON.parse(state.activeAbilitiesJson || "[]"),
            playersWon: state.playersWon,
          });

          const arr: RaidPlayerEntry[] = Array.from(state.players.values() as Iterable<any>)
            .map((p: any) => ({
              id: p.id, username: p.username, role: p.role,
              hp: p.hp, maxHp: p.maxHp, score: p.score,
              solved: p.solved, damageDealt: p.damageDealt,
              isAlive: p.isAlive, isHost: p.isHost,
              submissionStatus: p.submissionStatus,
              silencedUntil: p.silencedUntil, stunnedUntil: p.stunnedUntil,
              isDoomMarked: p.isDoomMarked,
            }))
            .sort((a, b) => b.damageDealt - a.damageDealt);
          store.setPlayers(arr);

          const me = arr.find((p) => p.id === room.sessionId) ?? null;
          store.setMyEntry(me);
        });

        room.onMessage("problem", (data: any) => {
          store.setProblem(data);
          // setProblem auto-extracts body from python template via splitTemplate
        });

        room.onMessage("phaseSync", (data: any) => {
          if (data.phase) store.setPhase(data.phase);
          if (data.waveNumber) store.setWaveNumber(data.waveNumber);
          if (data.totalWaves) store.setTotalWaves(data.totalWaves);
          if (data.roundEndsAt) store.setRoundEndsAt(data.roundEndsAt);
          if (data.phaseStartsAt) store.setPhaseStartsAt(data.phaseStartsAt);
          if (data.bossHp !== undefined) store.setBossStats({
            bossHp: data.bossHp, bossMaxHp: data.bossMaxHp,
            bossPhase: data.bossPhase, bossName: data.bossName, bossLevel: data.bossLevel,
          });
        });

        room.onMessage("liveEvent", (data: any) => {
          store.addLiveEvent({ username: data.username, type: data.type, message: data.message, color: data.color });
        });

        room.onMessage("abilityWarning", (data: { name: string; firesInMs: number }) => {
          store.setBossStats({ nextAbilityName: data.name, nextAbilityAt: Date.now() + data.firesInMs });
          store.addLiveEvent({ username: "Boss", type: "ability", message: `preparing ${data.name}…`, color: "purple" });
        });

        room.onMessage("runCodeResult", (data: any) => {
          store.setIsRunning(false);
          if (data.results) store.setRunResults(data.results);
          else if (data.error) store.setRunResults([{ passed: false, verdict: "error", stderr: data.error, input: "", expectedOutput: "", actualOutput: "" }]);
        });

        room.onMessage("submitResult", (data: any) => {
          store.setIsSubmitting(false);
          store.setLastVerdict(data.verdict, data.details ?? "");
          if (data.damage) store.setLastDamage(data.damage);
          store.addSubmission(data.verdict, useBossRaidStore.getState().language);
        });

        room.onMessage("gameOver", (data: any) => {
          store.setFinalResult(data);
          store.setPhase("finished");
        });

        room.onLeave(() => { store.setConnected(false); });

        room.send("ready");
      } catch (err) {
        console.error("[useBossRaid] Failed to join room:", err);
        navigate("/home");
      }
    })();

    return () => {
      roomRef.current?.leave();
      store.reset();
    };
  }, [bossRaidRoomId, user]);

  const runCode = useCallback(() => {
    const s = useBossRaidStore.getState();
    if (!roomRef.current || s.isRunning || s.isSubmitting) return;
    store.setIsRunning(true);
    store.setRunResults([]);
    roomRef.current.send("runCode", { code: s.getFullCode(), language: s.language });
  }, []);

  const submitCode = useCallback(() => {
    const s = useBossRaidStore.getState();
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
    problem:          useBossRaidStore((s) => s.problem),
    phase:            useBossRaidStore((s) => s.phase),
    waveNumber:       useBossRaidStore((s) => s.waveNumber),
    totalWaves:       useBossRaidStore((s) => s.totalWaves),
    roundEndsAt:      useBossRaidStore((s) => s.roundEndsAt),
    roundDuration:    useBossRaidStore((s) => s.roundDuration),
    phaseStartsAt:    useBossRaidStore((s) => s.phaseStartsAt),
    bossName:         useBossRaidStore((s) => s.bossName),
    bossLevel:        useBossRaidStore((s) => s.bossLevel),
    bossHp:           useBossRaidStore((s) => s.bossHp),
    bossMaxHp:        useBossRaidStore((s) => s.bossMaxHp),
    bossPhase:        useBossRaidStore((s) => s.bossPhase),
    nextAbilityName:  useBossRaidStore((s) => s.nextAbilityName),
    nextAbilityAt:    useBossRaidStore((s) => s.nextAbilityAt),
    activeAbilities:  useBossRaidStore((s) => s.activeAbilities),
    players:          useBossRaidStore((s) => s.players),
    liveEvents:       useBossRaidStore((s) => s.liveEvents),
    runResults:       useBossRaidStore((s) => s.runResults),
    isRunning:        useBossRaidStore((s) => s.isRunning),
    isSubmitting:     useBossRaidStore((s) => s.isSubmitting),
    lastVerdict:      useBossRaidStore((s) => s.lastVerdict),
    lastVerdictDetails: useBossRaidStore((s) => s.lastVerdictDetails),
    lastDamage:       useBossRaidStore((s) => s.lastDamage),
    connected:        useBossRaidStore((s) => s.connected),
    finalResult:      useBossRaidStore((s) => s.finalResult),
    submissionHistory: useBossRaidStore((s) => s.submissionHistory),
    language:         useBossRaidStore((s) => s.language),
    code:             useBossRaidStore((s) => s.code),
    activeTab:        useBossRaidStore((s) => s.activeTab),
    myEntry:          useBossRaidStore((s) => s.myEntry),
    runCode,
    submitCode,
    leaveRoom,
    setActiveTab:    useBossRaidStore.getState().setActiveTab,
    setLanguage:     useBossRaidStore.getState().setLanguage,
    setCode:         useBossRaidStore.getState().setCode,
  };
}
