/**
 * Subscribes to all match socket events for a single match code.
 *
 * The server drives round transitions; this hook translates events into React
 * state updates. Effect deps are intentionally minimal (see cleanup note below)
 * so handlers always close over the latest refs for user/lock identity without
 * re-subscribing on every render.
 *
 * Event map:
 *   match:state / match:phase — lobby & lifecycle
 *   round:sync — new round, resets client state, sets audio URL
 *   round:countdown — timestamp-based countdown before playback
 *   round:lock_confirmed — pause audio, open guess window
 *   round:guess_result — resolution overlay, score update, cooldown penalty flag
 *   round:resume — resume playback from server-provided offset
 *   match:end — final scores
 */
import { useEffect, useRef, type Dispatch, type RefObject, type SetStateAction } from "react";
import type { NavigateFunction } from "react-router-dom";
import { socket } from "../../api/socket";
import type {
  MatchPhasePayload,
  MatchStatePayload,
  RematchPayload,
  ScoreEntry,
} from "../../types/socket.payloads";
import {
  activateCooldownOnResume,
  clearPendingCooldown,
  clearStoredCooldown,
  readPendingCooldown,
  readStoredCooldown,
  shouldClearCooldownForRound,
  startCooldownPenalty,
  writePendingCooldown,
} from "../../utils/matchCooldown";
import { SECOND_MS } from "../constants";
import type {
  GuessSelectedTrack,
  GuessStatus,
  MatchEndPayload,
  RoundCountdownPayload,
  RoundGuessResultPayload,
  RoundLockPayload,
  RoundResumePayload,
  RoundSkipCompletePayload,
  RoundSkipUpdatePayload,
  RoundSyncPayload,
} from "../types";
import { isMatchNotFoundError, normalizeCode } from "../utils";
import { mergeScoresFromPayload } from "../utils/scoreUtils";
import i18n from "../../i18n/i18n";

type AuthUser = {
  id: string | number;
  username?: string | null;
  email?: string | null;
};

type UseMatchSocketOptions = {
  code: string;
  user: AuthUser | null;
  nav: NavigateFunction;
  setActiveMatch: (value: { code: string; roundLabel?: string } | null) => void;
  audioRef: RefObject<HTMLAudioElement | null>;
  readyRoundRef: RefObject<number | null>;
  myUserId: string | null;
  lockOwnerId: string | null;
  tryPlayAudio: (resumeTime: number | null) => void;
  updateTrackTimerDisplay: (offsetSec: number) => void;
  setMatchState: Dispatch<SetStateAction<MatchStatePayload | null>>;
  setNotFound: (value: boolean) => void;
  setError: Dispatch<SetStateAction<string | null>>;
  setRoundInfo: Dispatch<SetStateAction<RoundSyncPayload | null>>;
  setRoundPhase: Dispatch<SetStateAction<string>>;
  setAudioUrl: Dispatch<SetStateAction<string | null>>;
  setAudioReady: (value: boolean) => void;
  setCountdownSeconds: Dispatch<SetStateAction<number | null>>;
  setGuessSeconds: Dispatch<SetStateAction<number | null>>;
  setSongRemainingSeconds: Dispatch<SetStateAction<number | null>>;
  setGuessEndsAt: Dispatch<SetStateAction<number | null>>;
  setLockOwnerId: Dispatch<SetStateAction<string | null>>;
  setLockRequested: Dispatch<SetStateAction<boolean>>;
  setScores: Dispatch<SetStateAction<Record<string, number>>>;
  setFinalScores: Dispatch<SetStateAction<ScoreEntry[] | null>>;
  setShowVisualizer: (value: boolean) => void;
  setCooldownEndsAt: Dispatch<SetStateAction<number | null>>;
  setGuessStatus: Dispatch<SetStateAction<GuessStatus>>;
  setGuessResultTrack: Dispatch<SetStateAction<GuessSelectedTrack | null>>;
  resetSearch: () => void;
  setRematchPending: Dispatch<SetStateAction<boolean>>;
  onRematchReceived: (payload: RematchPayload) => void;
  fadeOutAudio: (durationMs?: number) => Promise<void>;
  setSkipUserIds: Dispatch<SetStateAction<string[]>>;
  setSkipRequested: Dispatch<SetStateAction<boolean>>;
};

export function useMatchSocket({
  code,
  user,
  nav,
  setActiveMatch,
  audioRef,
  readyRoundRef,
  myUserId,
  lockOwnerId,
  tryPlayAudio,
  updateTrackTimerDisplay,
  setMatchState,
  setNotFound,
  setError,
  setRoundInfo,
  setRoundPhase,
  setAudioUrl,
  setAudioReady,
  setCountdownSeconds,
  setGuessSeconds,
  setSongRemainingSeconds,
  setGuessEndsAt,
  setLockOwnerId,
  setLockRequested,
  setScores,
  setFinalScores,
  setShowVisualizer,
  setCooldownEndsAt,
  setGuessStatus,
  setGuessResultTrack,
  resetSearch,
  setRematchPending,
  onRematchReceived,
  fadeOutAudio,
  setSkipUserIds,
  setSkipRequested,
}: UseMatchSocketOptions) {
  const countdownTimerRef = useRef<number | null>(null);
  const guessPanelClearTimerRef = useRef<number | null>(null);
  // Refs capture lock/user identity for handlers that fire after state is cleared
  const myUserIdRef = useRef<string | null>(null);
  const lockOwnerIdRef = useRef<string | null>(null);
  // Refs for callback props: keeps the main effect's deps to just
  // [code, nav, user] so socket listeners don't tear down and rebind on
  // every render where the parent passes a new function identity for
  // these (they're not guaranteed stable unless memoized upstream).
  const tryPlayAudioRef = useRef(tryPlayAudio);
  const updateTrackTimerDisplayRef = useRef(updateTrackTimerDisplay);
  const setActiveMatchRef = useRef(setActiveMatch);
  const onRematchReceivedRef = useRef(onRematchReceived);
  const fadeOutAudioRef = useRef(fadeOutAudio);

  useEffect(() => {
    myUserIdRef.current = myUserId;
  }, [myUserId]);

  useEffect(() => {
    lockOwnerIdRef.current = lockOwnerId;
  }, [lockOwnerId]);

  useEffect(() => {
    tryPlayAudioRef.current = tryPlayAudio;
    updateTrackTimerDisplayRef.current = updateTrackTimerDisplay;
    setActiveMatchRef.current = setActiveMatch;
    onRematchReceivedRef.current = onRematchReceived;
    fadeOutAudioRef.current = fadeOutAudio;
  });

  useEffect(() => {
    if (!user || !code) return;

    if (!socket.connected) {
      socket.connect();
    }

    const joinMatch = () => {
      socket.emit("match:join", {
        matchId: code,
        displayName:
          user.username ?? user.email ?? i18n.t("match.user.guest"),
      });
    };

    if (socket.connected) {
      joinMatch();
    }

    socket.on("connect", joinMatch);

    socket.on("match:state", (payload: MatchStatePayload) => {
      setMatchState(payload);
      setError(null);
      setScores((prev) => mergeScoresFromPayload(prev, payload));

      if (payload.phase === "finished") {
        setRoundPhase("finished");
        setActiveMatchRef.current(null);
      }
    });

    socket.on("match:phase", (payload: MatchPhasePayload) => {
      if (payload.matchId !== code) return;
      setMatchState((prev) =>
        prev ? { ...prev, phase: payload.phase } : prev,
      );
      setError(null);
      if (payload.phase === "lobby") {
        nav(`/room/${code}`, { replace: true });
      }
      if (payload.phase === "finished") {
        setRoundPhase("finished");
        setActiveMatchRef.current(null);
      }
    });

    function clearGuessPanelClearTimer() {
      if (guessPanelClearTimerRef.current !== null) {
        window.clearTimeout(guessPanelClearTimerRef.current);
        guessPanelClearTimerRef.current = null;
      }
    }

    function scheduleGuessPanelClear() {
      clearGuessPanelClearTimer();
      guessPanelClearTimerRef.current = window.setTimeout(() => {
        setGuessResultTrack(null);
        setGuessStatus("countdown");
        guessPanelClearTimerRef.current = null;
      }, 500);
    }

    socket.on("round:sync", (payload: RoundSyncPayload) => {
      if (payload.matchId !== code) return;
      setShowVisualizer(false);
      setRoundInfo(payload);
      setRoundPhase("sync");
      setCountdownSeconds(null);
      setGuessSeconds(null);
      setSongRemainingSeconds(null);
      setGuessEndsAt(null);
      setLockOwnerId(null);
      setLockRequested(false);
      setSkipUserIds([]);
      setSkipRequested(false);
      readyRoundRef.current = null;
      setAudioReady(false);
      setError(payload.playlistError ?? null);
      resetSearch();
      scheduleGuessPanelClear();

      const storedCooldown = readStoredCooldown(code);
      const pendingRound = readPendingCooldown(code);

      if (
        storedCooldown &&
        shouldClearCooldownForRound(storedCooldown, payload.roundIndex)
      ) {
        clearStoredCooldown(code);
        setCooldownEndsAt(null);
      } else if (storedCooldown) {
        setCooldownEndsAt(storedCooldown.endTime);
      } else {
        setCooldownEndsAt(null);
      }

      if (pendingRound !== null && pendingRound !== payload.roundIndex) {
        clearPendingCooldown(code);
      }

      setAudioUrl(
        payload.preview ? `/media/${payload.preview.fileName}` : null,
      );
    });

    function clearCountdownTimer() {
      if (countdownTimerRef.current !== null) {
        window.clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    }

    function startCountdown(_initialSeconds: number, endsAt: number) {
      clearCountdownTimer();
      setRoundPhase("countdown");

      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }

      // Uses absolute `endsAt` timestamp so countdown stays accurate after tab throttling
      const updateCountdown = () => {
        const now = Date.now();
        const remainingMs = endsAt - now;

        if (remainingMs <= 0) {
          clearCountdownTimer();
          setShowVisualizer(true);
          setTimeout(() => setCountdownSeconds(null), 400);
          setRoundPhase("playing");
          const delaySeconds = Math.abs(remainingMs) / 1000;
          tryPlayAudioRef.current(delaySeconds);
          return;
        }

        setCountdownSeconds(Math.ceil(remainingMs / SECOND_MS));
      };

      updateCountdown();
      countdownTimerRef.current = window.setInterval(updateCountdown, 100);
    }

    socket.on("round:countdown", (payload: RoundCountdownPayload) => {
      if (payload.matchId !== code) return;
      startCountdown(payload.seconds, payload.endsAt);
    });

    socket.on("round:lock_confirmed", (payload: RoundLockPayload) => {
      if (payload.matchId !== code) return;
      clearGuessPanelClearTimer();
      setRoundPhase("guessing");
      setGuessStatus("countdown");
      setGuessResultTrack(null);
      setLockOwnerId(payload.lockOwnerId);
      setGuessEndsAt(payload.guessEndsAt ?? null);
      setLockRequested(false);

      if (audioRef.current) {
        if (payload.lockAt !== null) {
          audioRef.current.currentTime = payload.lockAt;
          updateTrackTimerDisplayRef.current(payload.lockAt);
        }
        audioRef.current.pause();
      }
    });

    socket.on("round:skip_update", (payload: RoundSkipUpdatePayload) => {
      if (payload.matchId !== code) return;
      setSkipUserIds(payload.skipUserIds);
    });

    socket.on("round:skip_complete", (payload: RoundSkipCompletePayload) => {
      if (payload.matchId !== code) return;
      setShowVisualizer(false);
      void fadeOutAudioRef.current();
    });

    socket.on("round:guess_result", (payload: RoundGuessResultPayload) => {
      if (payload.matchId !== code) return;

      clearGuessPanelClearTimer();
      setGuessResultTrack(payload.selectedTrack ?? null);

      if (payload.reason === "skip") {
        setShowVisualizer(false);
        setGuessStatus("skipped");
        setRoundPhase("resolution-win");
      } else if (payload.reason === "no_guess") {
        setShowVisualizer(false);
        setGuessStatus("revealed");
        setRoundPhase("resolution-win");
      } else if (payload.correct) {
        setGuessStatus("correct");
        setRoundPhase("resolution-win");
      } else {
        if (payload.reason === "timeout") {
          setGuessStatus("expired");
        } else {
          setGuessStatus("wrong");
        }
        setRoundPhase("resolution-fail");
      }

      setGuessEndsAt(null);
      setLockOwnerId(payload.lockOwnerId);
      if (payload.lockOwnerId) {
        setScores((prev) => ({
          ...prev,
          [payload.lockOwnerId as string]: payload.totalScore,
        }));
      }
      setLockRequested(false);

      if (
        !payload.correct &&
        payload.reason !== "no_guess" &&
        payload.reason !== "skip" &&
        payload.lockOwnerId &&
        String(payload.lockOwnerId) === String(myUserIdRef.current)
      ) {
        writePendingCooldown(code, payload.roundIndex);
      }
    });

    socket.on("round:resume", (payload: RoundResumePayload) => {
      if (normalizeCode(payload.matchId) !== code) return;

      let endTime: number | null = null;
      if (String(lockOwnerIdRef.current) === String(myUserIdRef.current)) {
        endTime = startCooldownPenalty(code, payload.roundIndex);
      } else {
        endTime = activateCooldownOnResume(code, payload.roundIndex);
      }
      setCooldownEndsAt(endTime);

      setRoundPhase("playing");
      setLockOwnerId(null);
      setGuessSeconds(null);
      setGuessEndsAt(null);
      setLockRequested(false);

      setShowVisualizer(true);

      tryPlayAudioRef.current(payload.resumeTime);
    });

    socket.on("match:rematch", (payload: RematchPayload) => {
      if (payload.previousMatchId !== code) return;
      setRematchPending(false);
      onRematchReceivedRef.current(payload);
    });

    socket.on("match:end", (payload: MatchEndPayload) => {
      if (payload.matchId !== code) return;
      setFinalScores(payload.scores);
      setRoundPhase("finished");
      setMatchState((prev) =>
        prev ? { ...prev, phase: "finished" } : prev,
      );
      setActiveMatchRef.current(null);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    });

    socket.on("match:error", (err: { message: string }) => {
      if (isMatchNotFoundError(err.message)) {
        setNotFound(true);
        return;
      }
      setError(err.message);
      setLockRequested(false);
      setSkipRequested(false);
      setRematchPending(false);
    });

    return () => {
      socket.off("connect", joinMatch);
      socket.off("match:state");
      socket.off("match:phase");
      socket.off("round:sync");
      socket.off("round:countdown");
      socket.off("round:lock_confirmed");
      socket.off("round:skip_update");
      socket.off("round:skip_complete");
      socket.off("round:guess_result");
      socket.off("round:resume");
      socket.off("match:rematch");
      socket.off("match:end");
      socket.off("match:error");
      clearCountdownTimer();
      clearGuessPanelClearTimer();
    };
    // tryPlayAudio, updateTrackTimerDisplay, setActiveMatch, and
    // onRematchReceived are intentionally excluded — read via refs above so
    // a new function identity from the parent each render doesn't tear down
    // and rebind all socket listeners.
  }, [code, nav, user]);
}
