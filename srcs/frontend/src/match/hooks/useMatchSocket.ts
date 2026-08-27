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
 *   round:playing — server confirms play-start timeline (startedAt)
 *   round:lock_confirmed — pause audio, open guess window
 *   round:guess_typing — live guesser input text for spectators (text only)
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
  RoundGuessTypingPayload,
  RoundLockPayload,
  RoundPlayingPayload,
  RoundResumePayload,
  RoundSkipCompletePayload,
  RoundSkipUpdatePayload,
  RoundSyncPayload,
} from "../types";
import { isMatchNotFoundError, normalizeCode } from "../utils";
import { mergeScoresFromPayload } from "../utils/scoreUtils";
import {
  noteServerNow,
  startClockSync,
  stopClockSync,
  syncedNow,
} from "../utils/serverClock";
import i18n from "../../i18n/i18n";
import { toGameServiceErrorCode } from "../gameServiceErrors";

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
  setPlayingStartedAt: (startedAt: number | null) => void;
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
  setGuessTypingText: Dispatch<SetStateAction<string>>;
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
  setPlayingStartedAt,
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
  setGuessTypingText,
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
  const isGuessingRef = useRef(false);
  const roundIndexRef = useRef<number | null>(null);
  // Refs for callback props: keeps the main effect's deps to just
  // [code, nav, user] so socket listeners don't tear down and rebind on
  // every render where the parent passes a new function identity for
  // these (they're not guaranteed stable unless memoized upstream).
  const tryPlayAudioRef = useRef(tryPlayAudio);
  const updateTrackTimerDisplayRef = useRef(updateTrackTimerDisplay);
  const setPlayingStartedAtRef = useRef(setPlayingStartedAt);
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
    setPlayingStartedAtRef.current = setPlayingStartedAt;
    setActiveMatchRef.current = setActiveMatch;
    onRematchReceivedRef.current = onRematchReceived;
    fadeOutAudioRef.current = fadeOutAudio;
  });

  useEffect(() => {
    if (!user || !code) return;

    if (!socket.connected) {
      socket.connect();
    }

    startClockSync(socket);

    const joinMatch = () => {
      setError(null);
      startClockSync(socket);
      socket.emit("match:join", {
        matchId: code,
        displayName:
          user.username ?? user.email ?? i18n.t("match.user.guest"),
      });
    };

    if (socket.connected) {
      joinMatch();
    }

    const handleDisconnect = () => {
      setError("GAME_CONNECTION_LOST");
    };

    const handleConnectError = (err: unknown) => {
      setError(toGameServiceErrorCode(err));
    };

    socket.on("connect", joinMatch);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

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

    function clearGuessTyping() {
      isGuessingRef.current = false;
      setGuessTypingText("");
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
      roundIndexRef.current = payload.roundIndex;
      clearGuessTyping();
      setCountdownSeconds(null);
      setGuessSeconds(null);
      setSongRemainingSeconds(null);
      setGuessEndsAt(null);
      setLockOwnerId(null);
      setLockRequested(false);
      setSkipUserIds([]);
      setSkipRequested(false);
      setPlayingStartedAtRef.current(null);
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
      // endsAt is the absolute server play-start; keep it as the timeline anchor.
      setPlayingStartedAtRef.current(endsAt);

      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }

      // Uses absolute `endsAt` + syncedNow so countdown survives clock skew / tab throttling
      const updateCountdown = () => {
        const now = syncedNow();
        const remainingMs = endsAt - now;

        if (remainingMs <= 0) {
          clearCountdownTimer();
          setShowVisualizer(true);
          setTimeout(() => setCountdownSeconds(null), 400);
          setRoundPhase("playing");
          const delaySeconds = Math.abs(remainingMs) / SECOND_MS;
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
      noteServerNow(payload.serverNow);
      startCountdown(payload.seconds, payload.endsAt);
    });

    socket.on("round:playing", (payload: RoundPlayingPayload) => {
      if (payload.matchId !== code) return;
      noteServerNow(payload.serverNow);
      setPlayingStartedAtRef.current(payload.startedAt);
      if (roundIndexRef.current !== payload.roundIndex) {
        roundIndexRef.current = payload.roundIndex;
      }
      // Clients usually already transitioned via local countdown; reinforce phase/audio.
      if (audioRef.current?.paused) {
        const delaySeconds = Math.max(
          0,
          (syncedNow() - payload.startedAt) / SECOND_MS,
        );
        setRoundPhase("playing");
        setShowVisualizer(true);
        tryPlayAudioRef.current(delaySeconds);
      }
    });

    socket.on("round:lock_confirmed", (payload: RoundLockPayload) => {
      if (payload.matchId !== code) return;
      noteServerNow(payload.serverNow);
      clearGuessPanelClearTimer();
      setRoundPhase("guessing");
      isGuessingRef.current = true;
      roundIndexRef.current = payload.roundIndex;
      setGuessTypingText("");
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
      clearGuessTyping();
      setShowVisualizer(false);
      void fadeOutAudioRef.current();
    });

    socket.on("round:guess_typing", (payload: RoundGuessTypingPayload) => {
      if (payload.matchId !== code) return;
      if (!isGuessingRef.current) return;
      if (
        payload.roundIndex !== undefined &&
        roundIndexRef.current !== null &&
        payload.roundIndex !== roundIndexRef.current
      ) {
        return;
      }
      if (typeof payload.text !== "string") return;
      setGuessTypingText(payload.text);
    });

    socket.on("round:guess_result", (payload: RoundGuessResultPayload) => {
      if (payload.matchId !== code) return;

      clearGuessPanelClearTimer();
      clearGuessTyping();
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
      noteServerNow(payload.serverNow);

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
      clearGuessTyping();

      setShowVisualizer(true);

      if (
        typeof payload.startedAt === "number" &&
        Number.isFinite(payload.startedAt)
      ) {
        setPlayingStartedAtRef.current(payload.startedAt);
      }

      tryPlayAudioRef.current(payload.resumeTime);
    });

    socket.on("match:rematch", (payload: RematchPayload) => {
      if (payload.previousMatchId !== code) return;
      setRematchPending(false);
      onRematchReceivedRef.current(payload);
    });

    socket.on("match:end", (payload: MatchEndPayload) => {
      if (payload.matchId !== code) return;
      clearGuessTyping();
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
      setError(toGameServiceErrorCode(err.message));
      setLockRequested(false);
      setSkipRequested(false);
      setRematchPending(false);
    });

    return () => {
      socket.off("connect", joinMatch);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("match:state");
      socket.off("match:phase");
      socket.off("round:sync");
      socket.off("round:countdown");
      socket.off("round:playing");
      socket.off("round:lock_confirmed");
      socket.off("round:skip_update");
      socket.off("round:skip_complete");
      socket.off("round:guess_typing");
      socket.off("round:guess_result");
      socket.off("round:resume");
      socket.off("match:rematch");
      socket.off("match:end");
      socket.off("match:error");
      clearCountdownTimer();
      clearGuessPanelClearTimer();
      stopClockSync();
    };
    // tryPlayAudio, updateTrackTimerDisplay, setActiveMatch, and
    // onRematchReceived are intentionally excluded — read via refs above so
    // a new function identity from the parent each render doesn't tear down
    // and rebind all socket listeners.
    // The remaining setters are React-stable or intentionally accessed through
    // refs above; rebinding all socket listeners on each render is incorrect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, nav, user]);
}
