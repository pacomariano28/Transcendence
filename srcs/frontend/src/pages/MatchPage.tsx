import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/auth-context";
import { socket } from "../api/socket";
import type { SpotifySearchTrack } from "../api/spotify";
import { searchSpotifyTracks } from "../api/spotify";
import { useActiveMatch } from "../context/active.match.context";
import { getMatchState } from "../api/state";
import type {
  MatchPhasePayload,
  MatchStatePayload,
  ScoreEntry,
} from "../types/socket.payloads";
import {
  activateCooldownOnResume,
  clearPendingCooldown,
  clearStoredCooldown,
  readPendingCooldown,
  readStoredCooldown,
  readStoredCooldownEnd,
  shouldClearCooldownForRound,
  startCooldownPenalty,
  writePendingCooldown,
} from "../utils/matchCooldown";
import NotFoundPage from "./NotFoundPage";
import MatchPageHeader from "../match/components/MatchPageHeader";
import MatchPlaySection from "../match/components/MatchPlaySection";
import MatchGuessSection from "../match/components/MatchGuessSection";
import MatchScoreboardSection from "../match/components/MatchScoreboardSection";
import { useAudioVisualizer } from "../match/hooks/useAudioVisualizer";
import { SECOND_MS } from "../match/constants";
import { isMatchNotFoundError, normalizeCode } from "../match/utils";
import type {
  GuessSelectedTrack,
  GuessStatus,
  MatchEndPayload,
  RoundCountdownPayload,
  RoundGuessResultPayload,
  RoundLockPayload,
  RoundResumePayload,
  RoundSyncPayload,
} from "../match/types";

export default function MatchPage() {
  const nav = useNavigate();
  const { code: codeParam } = useParams();
  const { user } = useAuth();

  const { setActiveMatch } = useActiveMatch();

  const code = useMemo(() => normalizeCode(codeParam ?? ""), [codeParam]);

  const [matchState, setMatchState] = useState<MatchStatePayload | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roundInfo, setRoundInfo] = useState<RoundSyncPayload | null>(null);
  const [roundPhase, setRoundPhase] = useState("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioReady, setAudioReady] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [guessSeconds, setGuessSeconds] = useState<number | null>(null);
  const [songRemainingSeconds, setSongRemainingSeconds] = useState<
    number | null
  >(null);
  const [lockOwnerId, setLockOwnerId] = useState<string | null>(null);
  const [guessEndsAt, setGuessEndsAt] = useState<number | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [finalScores, setFinalScores] = useState<ScoreEntry[] | null>(null);
  const [lockRequested, setLockRequested] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<SpotifySearchTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<SpotifySearchTrack | null>(
    null,
  );
  const [showVisualizer, setShowVisualizer] = useState(false);

  const [cooldownEndsAt, setCooldownEndsAt] = useState<number | null>(() =>
    readStoredCooldownEnd(normalizeCode(codeParam ?? "")),
  );
  const [cooldownUiTick, setCooldownUiTick] = useState(0);

  const [guessStatus, setGuessStatus] = useState<GuessStatus>("countdown");
  const [showResultText, setShowResultText] = useState(false);
  const [guessResultTrack, setGuessResultTrack] =
    useState<GuessSelectedTrack | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const readyRoundRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackSyncRef = useRef<{ anchorAt: number; offsetSec: number } | null>(
    null,
  );

  const [showAudioRestoreNotice, setShowAudioRestoreNotice] = useState(false);
  const showAudioRestoreNoticeRef = useRef(false);

  useAudioVisualizer(analyserRef, canvasRef);

  useEffect(() => {
    showAudioRestoreNoticeRef.current = showAudioRestoreNotice;
    if (showAudioRestoreNotice) {
      setSongRemainingSeconds(null);
    }
  }, [showAudioRestoreNotice]);

  const myUserId = user ? String(user.id) : null;

  const updateTrackTimerDisplay = useCallback((offsetSec: number) => {
    playbackSyncRef.current = { anchorAt: Date.now(), offsetSec };
    const duration = audioRef.current?.duration;
    if (!duration || isNaN(duration)) return;
    setSongRemainingSeconds(Math.max(0, Math.ceil(duration - offsetSec)));
  }, []);

  const applySyncedPlaybackPosition = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const sync = playbackSyncRef.current;
    const elapsed = sync ? (Date.now() - sync.anchorAt) / SECOND_MS : 0;
    const position = sync ? sync.offsetSec + elapsed : audio.currentTime;
    const duration = audio.duration;
    const playbackTime =
      duration && !isNaN(duration)
        ? Math.min(Math.max(0, position), duration)
        : Math.max(0, position);

    audio.currentTime = playbackTime;
    updateTrackTimerDisplay(playbackTime);
  }, [updateTrackTimerDisplay]);

  const tryPlayAudio = useCallback(
    (resumeTime: number | null) => {
      const audio = audioRef.current;

      if (resumeTime !== null) {
        playbackSyncRef.current = { anchorAt: Date.now(), offsetSec: resumeTime };
        if (audio) {
          audio.currentTime = resumeTime;
        }
      }

      if (!audio) return;

      audio
        .play()
        .then(() => {
          setShowAudioRestoreNotice(false);
          applySyncedPlaybackPosition();
        })
        .catch(() => setShowAudioRestoreNotice(true));
    },
    [applySyncedPlaybackPosition],
  );

  const resumeAudioFromUserGesture = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    const ctx = audioContextRef.current;
    if (ctx?.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        setShowAudioRestoreNotice(true);
        return;
      }
    }

    applySyncedPlaybackPosition();

    try {
      await audio.play();
      setShowAudioRestoreNotice(false);
      setShowVisualizer(true);
    } catch {
      setShowAudioRestoreNotice(true);
    }
  }, [applySyncedPlaybackPosition]);

  const myUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    myUserIdRef.current = myUserId;
  }, [myUserId]);

  const lockOwnerIdRef = useRef<string | null>(null);
  useEffect(() => {
    lockOwnerIdRef.current = lockOwnerId;
  }, [lockOwnerId]);

  const lockOwnerName = useMemo(() => {
    if (!matchState || !lockOwnerId) return "";
    return (
      matchState.players.find((player) => player.userId === lockOwnerId)
        ?.displayName ?? ""
    );
  }, [matchState, lockOwnerId]);

  const scoreboard = useMemo(() => {
    if (!matchState) return [];
    return matchState.players.map((player) => {
      const backupScore =
        (player as any).score ??
        (player as any).totalScore ??
        (player as any).points ??
        0;
      const liveScore = scores[player.userId];

      return {
        userId: player.userId,
        displayName: player.displayName,
        score: liveScore || backupScore || 0,
        connected: player.connected,
      };
    });
  }, [matchState, scores]);

  const { isCooldownActive, cooldownSeconds } = useMemo(() => {
    const active =
      cooldownEndsAt !== null && cooldownEndsAt > Date.now();
    return {
      isCooldownActive: active,
      cooldownSeconds: active
        ? Math.ceil((cooldownEndsAt - Date.now()) / SECOND_MS)
        : 0,
    };
  }, [cooldownEndsAt, cooldownUiTick]);

  const showCooldownUi = isCooldownActive && roundPhase === "playing";

  const canLock =
    roundPhase === "playing" && audioReady && !lockOwnerId && !isCooldownActive;
  const canGuess =
    roundPhase === "guessing" &&
    Boolean(lockOwnerId && lockOwnerId === myUserId);

  const roundLabel = roundInfo
    ? `Round ${roundInfo.roundIndex + 1} / ${roundInfo.roundsTotal}`
    : "Waiting for round";

  useEffect(() => {
    if (!code) {
      setCooldownEndsAt(null);
      return;
    }
    setCooldownEndsAt(readStoredCooldownEnd(code));
  }, [code]);

  useEffect(() => {
    if (!code || cooldownEndsAt === null) return undefined;

    const tick = () => {
      const now = Date.now();
      if (now >= cooldownEndsAt) {
        clearStoredCooldown(code);
        setCooldownEndsAt(null);
        return;
      }
      setCooldownUiTick((value) => value + 1);
    };

    if (Date.now() >= cooldownEndsAt) {
      clearStoredCooldown(code);
      setCooldownEndsAt(null);
      return undefined;
    }

    tick();
    const timerId = window.setInterval(tick, SECOND_MS);
    return () => window.clearInterval(timerId);
  }, [code, cooldownEndsAt]);

  useEffect(() => {
    if (notFound) {
      setActiveMatch(null);
      return;
    }

    const isFinished =
      Boolean(finalScores) ||
      matchState?.phase === "finished" ||
      roundPhase === "finished";

    if (isFinished) {
      setActiveMatch(null);
      return;
    }

    if (matchState) {
      setActiveMatch({
        code: code,
        roundLabel: roundInfo
          ? `R ${roundInfo.roundIndex + 1}/${roundInfo.roundsTotal}`
          : undefined,
      });
    }
  }, [
    code,
    roundInfo,
    setActiveMatch,
    matchState,
    notFound,
    roundPhase,
    finalScores,
  ]);

  const leaveFinishedMatch = useCallback(() => {
    setActiveMatch(null);
    nav("/");
  }, [nav, setActiveMatch]);

  useEffect(() => {
    setNotFound(false);

    if (!code) {
      setNotFound(true);
      return;
    }

    async function hydrateMatch() {
      try {
        const match = await getMatchState({ matchId: code });

        if (match) {
          setMatchState(match);
          setScores((prev) => {
            const next = { ...prev };

            if (match.scores) {
              if (Array.isArray(match.scores)) {
                match.scores.forEach((entry: any) => {
                  const s = entry.score ?? entry.totalScore ?? entry.points;
                  if (entry.userId && s !== undefined && s !== null)
                    next[entry.userId] = s;
                });
              } else {
                Object.keys(match.scores).forEach((key) => {
                  const s = (match.scores as any)[key];
                  if (s !== undefined && s !== null) next[key] = s;
                });
              }
            }

            if (match.players) {
              match.players.forEach((player) => {
                const serverScore =
                  player.score ?? player.totalScore ?? (player as any).points;
                if (serverScore !== undefined && serverScore !== null) {
                  next[player.userId] = serverScore;
                } else if (next[player.userId] === undefined) {
                  next[player.userId] = 0;
                }
              });
            }
            return next;
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        if (isMatchNotFoundError(message)) {
          setNotFound(true);
          return;
        }
        console.error(
          "Error al sincronizar puntuaciones por HTTP al montar:",
          err,
        );
      }
    }

    hydrateMatch();
  }, [code]);

  useEffect(() => {
    if (!user || !code) return;

    if (!socket.connected) {
      socket.connect();
    }

    const joinMatch = () => {
      socket.emit("match:join", {
        matchId: code,
        displayName: user.username ?? user.email ?? "Guest",
      });
    };

    if (socket.connected) {
      joinMatch();
    }

    socket.on("connect", joinMatch);

    socket.on("match:state", (payload: MatchStatePayload) => {
      setMatchState(payload);
      setError(null);
      setScores((prev) => {
        const next = { ...prev };

        if (payload.scores) {
          if (Array.isArray(payload.scores)) {
            payload.scores.forEach((entry: any) => {
              const s = entry.score ?? entry.totalScore ?? entry.points;
              if (entry.userId && s !== undefined && s !== null)
                next[entry.userId] = s;
            });
          } else {
            Object.keys(payload.scores).forEach((key) => {
              const s = (payload.scores as any)[key];
              if (s !== undefined && s !== null) next[key] = s;
            });
          }
        }

        payload.players.forEach((player) => {
          const serverScore =
            player.score ?? player.totalScore ?? (player as any).points;

          if (serverScore !== undefined && serverScore !== null) {
            next[player.userId] = serverScore;
          } else if (next[player.userId] === undefined) {
            next[player.userId] = 0;
          }
        });
        return next;
      });

      if (payload.phase === "finished") {
        setRoundPhase("finished");
        setActiveMatch(null);
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
        setActiveMatch(null);
      }
    });

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
      readyRoundRef.current = null;
      setAudioReady(false);
      setError(payload.playlistError ?? null);
      setSearchTerm("");
      setSearchResults([]);
      setSearching(false);
      setSearchError(null);
      setSelectedTrack(null);
      setGuessResultTrack(null);

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

      const updateCountdown = () => {
        const now = Date.now();
        const remainingMs = endsAt - now;

        if (remainingMs <= 0) {
          clearCountdownTimer();
          setShowVisualizer(true);
          setTimeout(() => setCountdownSeconds(null), 400);
          setRoundPhase("playing");
          const delaySeconds = Math.abs(remainingMs) / 1000;
          tryPlayAudio(delaySeconds);
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
      setRoundPhase("guessing");
      setGuessStatus("countdown");
      setShowResultText(false);
      setGuessResultTrack(null);
      setLockOwnerId(payload.lockOwnerId);
      setGuessEndsAt(payload.guessEndsAt ?? null);
      setLockRequested(false);

      if (audioRef.current) {
        if (payload.lockAt !== null) {
          audioRef.current.currentTime = payload.lockAt;
          updateTrackTimerDisplay(payload.lockAt);
        }
        audioRef.current.pause();
      }
    });

    socket.on("round:guess_result", (payload: RoundGuessResultPayload) => {
      if (payload.matchId !== code) return;

      setShowResultText(false);
      setGuessResultTrack(payload.selectedTrack ?? null);

      if (payload.correct) {
        setGuessStatus("correct");
      } else {
        if (payload.reason === "timeout") {
          setGuessStatus("expired");
        } else {
          setGuessStatus("wrong");
        }
      }

      setRoundPhase(payload.correct ? "resolution-win" : "resolution-fail");
      setGuessEndsAt(null);
      setLockOwnerId(payload.lockOwnerId);
      setScores((prev) => ({
        ...prev,
        [payload.lockOwnerId]: payload.totalScore,
      }));
      setLockRequested(false);

      if (
        !payload.correct &&
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

      tryPlayAudio(payload.resumeTime);
    });

    socket.on("match:end", (payload: MatchEndPayload) => {
      if (payload.matchId !== code) return;
      setFinalScores(payload.scores);
      setRoundPhase("finished");
      setMatchState((prev) =>
        prev ? { ...prev, phase: "finished" } : prev,
      );
      setActiveMatch(null);
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
    });

    return () => {
      socket.off("connect", joinMatch);
      socket.off("match:state");
      socket.off("match:phase");
      socket.off("round:sync");
      socket.off("round:countdown");
      socket.off("round:lock_confirmed");
      socket.off("round:guess_result");
      socket.off("round:resume");
      socket.off("match:end");
      socket.off("match:error");
      clearCountdownTimer();
    };
  }, [code, nav, user, tryPlayAudio, updateTrackTimerDisplay, setActiveMatch]);

  useEffect(() => {
    if (!audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
        audioRef.current.load();
        audioRef.current = null;
      }
      return;
    }

    const audio = new Audio(audioUrl);
    audio.preload = "auto";

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    const source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;

    const handleReady = () => {
      setAudioReady(true);
      if (roundInfo && readyRoundRef.current !== roundInfo.roundIndex) {
        socket.emit("round:ready");
        readyRoundRef.current = roundInfo.roundIndex;
      }
    };

    const handleEnded = () => {
      setShowVisualizer(false);
      if (!roundInfo || !code) return;
      socket.emit("round:preview_ended", {
        matchId: code,
        roundIndex: roundInfo.roundIndex,
      });
    };

    const handleError = () => {
      setError("AUDIO_LOAD_FAILED");
    };

    const handleTimeUpdate = () => {
      if (showAudioRestoreNoticeRef.current) return;

      const remaining = Math.max(
        0,
        Math.ceil(audio.duration - audio.currentTime),
      );
      if (!isNaN(remaining)) {
        setSongRemainingSeconds(remaining);
      }
    };

    audio.addEventListener("canplaythrough", handleReady);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleTimeUpdate);
    audio.load();
    audioRef.current = audio;

    return () => {
      audio.removeEventListener("canplaythrough", handleReady);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleTimeUpdate);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();

      if (audioRef.current === audio) {
        audioRef.current = null;
      }
      audioContextRef.current?.close();
      audioContextRef.current = null;
      analyserRef.current = null;
    };
  }, [audioUrl, roundInfo, code]);

  useEffect(() => {
    if (!guessEndsAt) return undefined;

    const update = () => {
      const remainingMs = Math.max(0, guessEndsAt - Date.now());
      const remaining = Math.ceil(remainingMs / SECOND_MS);

      if (remainingMs > 0) {
        setGuessSeconds(remaining);
      }
    };

    update();
    const timerId = window.setInterval(update, 200);

    return () => window.clearInterval(timerId);
  }, [guessEndsAt]);

  useEffect(() => {
    const isLocked =
      roundPhase === "guessing" &&
      Boolean(lockOwnerId && lockOwnerId === myUserId);
    if (!isLocked || selectedTrack) return;

    const term = searchTerm.trim();
    if (term.length < 2) return;

    let cancelled = false;

    const timerId = window.setTimeout(() => {
      setSearching(true);
      searchSpotifyTracks(term)
        .then((tracks) => {
          if (cancelled) return;
          setSearchResults(tracks);
          setSearchError(null);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          const message = err instanceof Error ? err.message : "SEARCH_FAILED";
          setSearchError(message);
          setSearchResults([]);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [roundPhase, lockOwnerId, myUserId, searchTerm, selectedTrack]);

  const requestLock = useCallback(() => {
    if (!audioRef.current || !canLock || lockRequested) return;

    const emitLock = () => {
      if (!audioRef.current || lockRequested) return;
      setLockRequested(true);
      socket.emit("round:lock_request", {
        matchId: code,
        time: audioRef.current.currentTime,
      });
    };

    if (showAudioRestoreNotice) {
      void resumeAudioFromUserGesture().then(emitLock);
      return;
    }

    emitLock();
  }, [canLock, code, lockRequested, showAudioRestoreNotice, resumeAudioFromUserGesture]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
      )
        return;

      if (showAudioRestoreNotice && roundPhase === "playing") {
        event.preventDefault();
        void resumeAudioFromUserGesture().then(() => {
          if (canLock && !lockRequested) {
            requestLock();
          }
        });
        return;
      }

      if (!canLock) return;
      event.preventDefault();
      requestLock();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    canLock,
    lockRequested,
    requestLock,
    resumeAudioFromUserGesture,
    roundPhase,
    showAudioRestoreNotice,
  ]);

  function clearGuessSelector() {
    setSelectedTrack(null);
    setSearchTerm("");
    setSearchResults([]);
    setSearchError(null);
    setSearching(false);
  }

  function submitGuess() {
    if (!canGuess || !selectedTrack) return;
    socket.emit("round:guess_submit", {
      matchId: code,
      isrc: selectedTrack.isrc,
      track: selectedTrack.track,
      artist: selectedTrack.artist,
    });
    clearGuessSelector();
  }

  const selectTrack = useCallback((track: SpotifySearchTrack) => {
    setSelectedTrack(track);
    setSearchTerm(`${track.track} - ${track.artist}`);
    setSearchResults([]);
    setSearchError(null);
    setSearching(false);
  }, []);

  const handleSearchTermChange = useCallback(
    (nextValue: string) => {
      setSearchTerm(nextValue);
      if (selectedTrack) {
        setSelectedTrack(null);
      }
      if (nextValue.trim().length < 2) {
        setSearchResults([]);
        setSearchError(null);
        setSearching(false);
      }
    },
    [selectedTrack],
  );

  const handleGuessTransitionEnd = useCallback(() => {
    if (
      (guessStatus === "wrong" ||
        guessStatus === "expired" ||
        guessStatus === "correct") &&
      !showResultText
    ) {
      setShowResultText(true);
    }
  }, [guessStatus, showResultText]);

  const showGuessPanel =
    roundPhase === "guessing" ||
    roundPhase === "resolution-win" ||
    roundPhase === "resolution-fail";

  const showAudioNotice = showAudioRestoreNotice && !showGuessPanel;
  const showCountdown = !showGuessPanel && !showVisualizer && !showAudioNotice;
  const showEq = !showGuessPanel && showVisualizer && !showAudioNotice;
  const showTrackTimer =
    !showAudioRestoreNotice &&
    songRemainingSeconds !== null &&
    (roundPhase === "playing" ||
      roundPhase === "guessing" ||
      roundPhase === "resolution-win" ||
      roundPhase === "resolution-fail");

  const isMatchFinished =
    matchState?.phase === "finished" || roundPhase === "finished";

  const playersList = matchState?.players || [];
  const resultsData = useMemo(() => {
    const entries = finalScores
      ? finalScores
      : playersList.map((player) => ({
          userId: player.userId,
          displayName:
            (player as any).username ||
            (player as any).displayName ||
            "Jugador",
          score: scores[player.userId] || (player as any).score || 0,
        }));

    return [...entries].sort((a, b) => b.score - a.score);
  }, [finalScores, playersList, scores]);

  if (!code || notFound) {
    return (
      <NotFoundPage
        title="MATCH NOT FOUND!"
      />
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col items-center px-4 py-10 fade-in sm:px-6 lg:px-8">
      <div className="w-full space-y-6">
        <MatchPageHeader
          code={code}
          roundLabel={roundLabel}
          roundIndex={roundInfo?.roundIndex}
          isMatchFinished={isMatchFinished}
        />

        {error && (
          <div className="rounded-lg border border-rose-500/50 bg-rose-500/10 p-4 text-rose-200">
            {error}
          </div>
        )}

        <div
          className={`flex flex-col ${
            isMatchFinished ? "gap-0" : "gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:grid-rows-[auto_auto] lg:gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]"
          }`}
        >
          <MatchPlaySection
            isMatchFinished={isMatchFinished}
            canvasRef={canvasRef}
            showTrackTimer={showTrackTimer}
            songRemainingSeconds={songRemainingSeconds}
            roundPhase={roundPhase}
            showAudioNotice={showAudioNotice}
            resumeAudioFromUserGesture={resumeAudioFromUserGesture}
            showCountdown={showCountdown}
            countdownSeconds={countdownSeconds}
            showEq={showEq}
            showGuessPanel={showGuessPanel}
            guessStatus={guessStatus}
            showResultText={showResultText}
            guessSeconds={guessSeconds}
            guessResultTrack={guessResultTrack}
            onGuessTransitionEnd={handleGuessTransitionEnd}
            showCooldownUi={showCooldownUi}
            cooldownSeconds={cooldownSeconds}
            canLock={canLock}
            lockRequested={lockRequested}
            requestLock={requestLock}
            playlistError={roundInfo?.playlistError}
          />

          <MatchGuessSection
            isMatchFinished={isMatchFinished}
            roundPhase={roundPhase}
            lockOwnerId={lockOwnerId}
            lockOwnerName={lockOwnerName}
            canGuess={canGuess}
            searchTerm={searchTerm}
            onSearchTermChange={handleSearchTermChange}
            selectedTrack={selectedTrack}
            searchResults={searchResults}
            searching={searching}
            searchError={searchError}
            onSelectTrack={selectTrack}
            onSubmitGuess={submitGuess}
          />

          <MatchScoreboardSection
            isMatchFinished={isMatchFinished}
            resultsData={resultsData}
            myUserId={myUserId}
            onLeaveFinishedMatch={leaveFinishedMatch}
            scoreboard={scoreboard}
            lockOwnerId={lockOwnerId}
            roundPhase={roundPhase}
          />
        </div>
      </div>
    </div>
  );
}
