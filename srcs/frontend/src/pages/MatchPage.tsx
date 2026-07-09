import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/auth-context";
import { socket } from "../api/socket";
import type { SpotifySearchTrack } from "../api/spotify";
import { searchSpotifyTracks } from "../api/spotify";
import { handleMouseMoveToSetFillOrigin } from "../utils/buttonHover";
import TypingText from "../components/TypingText";
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

function isMatchNotFoundError(message: string) {
  return message === "MATCH_NOT_FOUND" || message === "Match not found";
}

function normalizeCode(raw: string) {
  return (raw ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

type RoundPreview = {
  isrc: string;
  fileName: string;
};

type RoundSyncPayload = {
  matchId: string;
  roundIndex: number;
  roundsTotal: number;
  preview: RoundPreview | null;
  playlistError: string | null;
};

type RoundCountdownPayload = {
  matchId: string;
  roundIndex: number;
  seconds: number;
  endsAt: number;
};

type RoundLockPayload = {
  matchId: string;
  roundIndex: number;
  lockOwnerId: string;
  lockAt: number | null;
  guessEndsAt: number | null;
};

type GuessSelectedTrack = {
  isrc: string;
  track: string;
  artist: string;
};

type RoundGuessResultPayload = {
  matchId: string;
  roundIndex: number;
  lockOwnerId: string;
  correct: boolean;
  reason: "wrong" | "timeout" | null;
  isrc: string | null;
  selectedTrack: GuessSelectedTrack | null;
  scoreDelta: number;
  totalScore: number;
};

type RoundResumePayload = {
  matchId: string;
  roundIndex: number;
  resumeTime: number | null;
};

type MatchEndPayload = {
  matchId: string;
  scores: ScoreEntry[];
};

const SECOND_MS = 1000;

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

  const [guessStatus, setGuessStatus] = useState<
    "countdown" | "expired" | "wrong" | "correct"
  >("countdown");
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

  // Creamos una referencia al ID actual para leerlo de forma segura dentro de closures/eventos de Socket
  const myUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    myUserIdRef.current = myUserId;
  }, [myUserId]);

  // Guardamos también el lockOwnerId en un ref para capturarlo justamente antes de que se limpie en el evento resume
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

  useEffect(() => {
    let animationId: number;

    const draw = () => {
      const analyser = analyserRef.current;
      const canvas = canvasRef.current;

      if (!analyser || !canvas) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animationId = requestAnimationFrame(draw);
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const height = (dataArray[i] / 255) * canvas.height * 0.6;
        ctx.fillStyle = "#f7d046";
        ctx.fillRect(
          x,
          canvas.height - height,
          Math.max(barWidth - 2, 1),
          height,
        );
        x += barWidth;
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

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
      <style>{`
      @keyframes roundPop {
        0% { transform: scale(0.85); opacity: 0; filter: brightness(1.8); }
        50% { transform: scale(1.18); opacity: 1; filter: brightness(1.4); box-shadow: 0 0 20px rgba(247,208,70,0.4); }
        100% { transform: scale(1); opacity: 1; filter: brightness(1); }
      }
      .animate-round-change {
        animation: roundPop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      }
      @keyframes matchPlayExit {
        0% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); max-height: 600px; }
        100% { opacity: 0; transform: scale(0.94) translateY(-12px); filter: blur(6px); max-height: 0; }
      }
      @keyframes matchGuessExit {
        0% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); max-height: 800px; }
        100% { opacity: 0; transform: scale(0.96) translateY(-8px); filter: blur(4px); max-height: 0; }
      }
      @keyframes matchResultsEnter {
        0% { opacity: 0; transform: scale(0.92) translateY(24px); filter: blur(8px); }
        60% { opacity: 1; transform: scale(1.02) translateY(-4px); filter: blur(0); }
        100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
      }
      @keyframes matchTitleReveal {
        0% { opacity: 0; transform: translateY(12px); letter-spacing: 0.1em; }
        100% { opacity: 1; transform: translateY(0); letter-spacing: 0.24em; }
      }
      @keyframes resultRowReveal {
        0% { opacity: 0; transform: translateX(-20px) scale(0.95); }
        70% { opacity: 1; transform: translateX(4px) scale(1.01); }
        100% { opacity: 1; transform: translateX(0) scale(1); }
      }
      @keyframes matchBackReveal {
        0% { opacity: 0; transform: translateY(16px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      @keyframes winnerGlow {
        0%, 100% { box-shadow: 0 0 20px rgba(247,208,70,0.15); }
        50% { box-shadow: 0 0 32px rgba(247,208,70,0.35); }
      }
      .animate-match-play-exit {
        animation: matchPlayExit 0.75s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        pointer-events: none;
      }
      .animate-match-guess-exit {
        animation: matchGuessExit 0.65s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        pointer-events: none;
      }
      .animate-match-results-enter {
        animation: matchResultsEnter 0.85s cubic-bezier(0.34, 1.2, 0.64, 1) both;
      }
      .animate-match-title-reveal {
        animation: matchTitleReveal 0.7s cubic-bezier(0.34, 1.2, 0.64, 1) both;
      }
      .animate-result-row-reveal {
        animation: resultRowReveal 0.6s cubic-bezier(0.34, 1.2, 0.64, 1) both;
      }
      .animate-match-back-reveal {
        animation: matchBackReveal 0.6s cubic-bezier(0.34, 1.2, 0.64, 1) 0.5s both;
      }
      .animate-winner-glow {
        animation: winnerGlow 2.5s ease-in-out infinite;
      }
    `}</style>

      <div className="w-full space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center justify-between w-full">
            <h1 className="font-mono text-3xl font-semibold tracking-[0.35em] text-zinc-500 hover:text-white transition duration-300 ease-in-out sm:text-5xl">
              {code || "———"}
            </h1>

            {!isMatchFinished && (
              <div
                key={roundInfo?.roundIndex ?? "idle"}
                className="animate-round-change flex items-center gap-2 rounded-xl border border-[#f7d046]/30 bg-[#f7d046]/10 px-3 py-1.5 font-mono text-xs font-bold tracking-wider text-[#f7d046] shadow-[0_0_15px_rgba(247,208,70,0.05)]"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f7d046] opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#f7d046]"></span>
                </span>
                {roundLabel}
              </div>
            )}
          </div>
        </header>

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
          <section
            className={`card order-1 overflow-hidden p-6 lg:col-start-1 lg:row-start-1 lg:flex lg:h-[24rem] lg:flex-col ${
              isMatchFinished ? "animate-match-play-exit !m-0 !border-0 !p-0" : ""
            }`}
          >
            <div className="flex flex-col gap-3 lg:min-h-0 lg:flex-1">
              <div className="relative h-48 w-full shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/20 sm:h-52 lg:min-h-0 lg:h-auto lg:flex-1">
                  <div
                    className={`absolute top-4 left-4 z-30 flex h-7 items-center gap-2 rounded-xl border border-white/10 bg-black/60 px-3 font-mono text-xs font-medium text-zinc-300 backdrop-blur-md transition-opacity duration-700 ease-in-out
                    ${showTrackTimer ? "opacity-100" : "pointer-events-none opacity-0"}`}
                  >
                    <span className="relative h-2 w-2 shrink-0">
                      <span
                        className={`absolute inset-0 rounded-full bg-amber-400 opacity-75 ${roundPhase === "playing" ? "animate-ping" : ""}`}
                      ></span>
                      <span className="relative block h-2 w-2 rounded-full bg-[#f7d046]"></span>
                    </span>
                    <span className="relative transform translate-y-[1px]">
                      Track: {songRemainingSeconds ?? 0}s
                    </span>
                  </div>

                  <div
                    role="button"
                    tabIndex={showAudioNotice ? 0 : -1}
                    onClick={() => {
                      if (showAudioNotice) void resumeAudioFromUserGesture();
                    }}
                    onKeyDown={(event) => {
                      if (
                        showAudioNotice &&
                        (event.code === "Enter" || event.code === "Space")
                      ) {
                        event.preventDefault();
                        void resumeAudioFromUserGesture();
                      }
                    }}
                    className={`absolute inset-0 flex flex-col items-center justify-center px-6 text-center transition-all duration-700 ease-in-out
                  ${showAudioNotice ? "cursor-pointer opacity-100 scale-100" : "pointer-events-none opacity-0 scale-95"}`}
                  >
                    <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-400">
                      Audio unavailable
                    </div>
                    <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-300">
                      Audio is unavailable after reloading. Tap
                      here to restore playback.
                    </p>
                  </div>

                  <div
                    className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-700 ease-in-out
                  ${showCountdown ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
                  >
                    <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-400">
                      Starts in
                    </div>
                    <div className="mt-3 text-6xl font-semibold text-white sm:text-7xl">
                      {countdownSeconds ?? ""}
                    </div>
                  </div>

                  <div
                    className={`absolute inset-0 flex items-center justify-center p-4 transition-all duration-700 ease-in-out
                  ${showEq ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
                  >
                    <canvas
                      ref={canvasRef}
                      width={1200}
                      height={240}
                      className="h-full max-h-full w-full"
                    />
                  </div>

                  <div
                    onTransitionEnd={() => {
                      if (
                        (guessStatus === "wrong" ||
                          guessStatus === "expired" ||
                          guessStatus === "correct") &&
                        !showResultText
                      ) {
                        setShowResultText(true);
                      }
                    }}
                    className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-500 ease-in-out
                  ${showGuessPanel ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
                  >
                    <div
                      className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-500 ease-in-out
                    ${guessStatus === "countdown" ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
                    >
                      <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-400">
                        Guess time remaining
                      </div>
                      <div
                        className={`mt-3 text-7xl font-bold transition-all duration-500
                      ${(guessSeconds ?? 10) <= 5 ? "text-red-500 animate-pulse scale-110" : "text-amber-300"}`}
                      >
                        {guessSeconds ?? 0}
                      </div>
                      <div className="mt-2 text-sm text-zinc-500">seconds</div>
                    </div>

                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out
                    ${guessStatus === "expired" ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
                    >
                      {showResultText && guessStatus === "expired" && (
                        <TypingText key="timeout" text="TIMEOUT!" size="md" />
                      )}
                    </div>

                    <div
                      className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-500 ease-in-out
                    ${guessStatus === "wrong" ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
                    >
                      {showResultText && guessStatus === "wrong" && (
                        <>
                          <TypingText
                            key="wrong"
                            text="WRONG ANSWER!"
                            size="md"
                          />
                          {guessResultTrack && (
                            <div className="mt-4 max-w-md px-4 text-sm font-medium text-rose-400">
                              {guessResultTrack.track} - {guessResultTrack.artist}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div
                      className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-500 ease-in-out
                    ${guessStatus === "correct" ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
                    >
                      {showResultText && guessStatus === "correct" && (
                        <>
                          <TypingText
                            key="correct"
                            text="CORRECT ANSWER!"
                            size="md"
                          />
                          {guessResultTrack && (
                            <div className="mt-4 max-w-md px-4 text-sm font-medium text-emerald-400">
                              {guessResultTrack.track} - {guessResultTrack.artist}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

              <button
                className="btn-glow h-14 w-full shrink-0 transition-all duration-500 disabled:opacity-40"
                style={
                  {
                    "--btn-color": showCooldownUi ? "#f43f5e" : "#f7d046",
                  } as React.CSSProperties
                }
                type="button"
                disabled={!canLock || lockRequested}
                onClick={requestLock}
                onMouseMove={handleMouseMoveToSetFillOrigin}
              >
                <span>
                  {lockRequested
                    ? "Locking..."
                    : showCooldownUi
                      ? `Cooldown (${cooldownSeconds}s)`
                      : "Lock (Space)"}
                </span>
              </button>
            </div>

            {roundInfo?.playlistError && (
              <div className="mt-4 rounded-lg border border-rose-500/50 bg-rose-500/10 p-4 text-rose-200">
                {roundInfo.playlistError}
              </div>
            )}
          </section>

          <section
            className={`card order-2 overflow-hidden p-6 lg:col-span-2 lg:row-start-2 ${
              isMatchFinished ? "animate-match-guess-exit !m-0 !border-0 !p-0" : ""
            }`}
          >
            <div className="flex flex-col gap-1">
              <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
                Lock and guess
              </div>

              <div className="relative h-7 mt-1">
                <div
                  className={`absolute inset-0 transition-all duration-500 ease-in-out origin-left
                ${lockOwnerId ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none"} 
                text-lg text-zinc-300`}
                >
                  Locked by{" "}
                  <span className="font-extrabold tracking-wider">
                    {lockOwnerName || "player"}
                  </span>
                </div>
                <div
                  className={`absolute inset-0 transition-all duration-500 ease-in-out origin-left
                ${!lockOwnerId ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 pointer-events-none"} 
                text-sm text-zinc-400`}
                >
                  First lock wins
                </div>
              </div>
            </div>

            <div
              className={`transition-all duration-700 ease-in-out origin-top overflow-hidden
            ${roundPhase === "guessing" ? "opacity-100 scale-100 max-h-[600px] mt-5" : "opacity-0 scale-95 max-h-0 mt-0 pointer-events-none"}`}
            >
              <div className="rounded-2xl bg-black/20 p-4">
                {canGuess ? (
                  <div className="mt-2">
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input
                        autoFocus
                        className="lock-input input flex-1 text-center uppercase"
                        placeholder="Search track"
                        value={searchTerm}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          setSearchTerm(nextValue);
                          if (selectedTrack) {
                            setSelectedTrack(null);
                          }
                          if (nextValue.trim().length < 2) {
                            setSearchResults([]);
                            setSearchError(null);
                            setSearching(false);
                          }
                        }}
                        onKeyDown={(event) => {
                          if (event.key !== "Enter") return;
                          event.preventDefault();
                          submitGuess();
                        }}
                        disabled={!canGuess}
                      />
                      <button
                        className={`btn-glow submit-guess w-full sm:w-44 transition-all duration-300 ${!canGuess || !selectedTrack ? "opacity-50" : "animate-bounce scale-95"}`}
                        style={
                          { "--btn-color": "#4ade80" } as React.CSSProperties
                        }
                        type="button"
                        onClick={submitGuess}
                        disabled={!canGuess || !selectedTrack}
                      >
                        <span>Submit guess</span>
                      </button>
                    </div>

                    {selectedTrack && (
                      <div className="mt-3 text-xs text-emerald-300 transition-opacity animate-fade-in">
                        Selected: {selectedTrack.track} - {selectedTrack.artist}
                      </div>
                    )}

                    {searchError && (
                      <div className="mt-3 text-xs text-rose-300 animate-fade-in">
                        {searchError}
                      </div>
                    )}

                    {searching && (
                      <div className="mt-3 text-xs text-zinc-500 animate-fade-in">
                        Searching...
                      </div>
                    )}

                    {!searching &&
                      !searchError &&
                      searchTerm.trim().length >= 2 &&
                      searchResults.length === 0 &&
                      !selectedTrack && (
                        <div className="mt-3 text-xs text-zinc-500 animate-fade-in">
                          No results.
                        </div>
                      )}

                    {searchResults.length > 0 &&
                      !selectedTrack &&
                      searchTerm.trim().length >= 2 && (
                        <div className="mt-3 grid gap-2 animate-fade-in">
                          {searchResults.map((track) => (
                            <button
                              key={track.id}
                              className="rounded-xl border border-white/10 bg-black/30 p-3 text-left transition hover:border-white/20 hover:bg-black/40"
                              type="button"
                              onClick={() => selectTrack(track)}
                            >
                              <div className="text-sm font-medium text-zinc-100">
                                {track.track}
                              </div>
                              <div className="text-xs text-zinc-400">
                                {track.artist}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-zinc-400">
                    Waiting for the lock owner to submit a guess.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section
            className={`card order-3 p-6 ${
              isMatchFinished
                ? "animate-match-results-enter mx-auto w-full max-w-2xl"
                : "lg:col-start-2 lg:row-start-1 lg:flex lg:h-[24rem] lg:flex-col lg:overflow-hidden"
            }`}
          >
            {isMatchFinished ? (
              <>
                <div className="animate-match-title-reveal">
                  <div className="text-xs font-medium uppercase tracking-[0.24em] text-[#f7d046]">
                    Match complete
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                    Final results
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  {resultsData.map((entry, index) => {
                    const isWinner = index === 0;

                    return (
                      <div
                        key={entry.userId}
                        className={`animate-result-row-reveal flex min-h-[3.5rem] items-center justify-between rounded-2xl border px-4 py-3.5 sm:p-4 ${
                          isWinner
                            ? "animate-winner-glow border-[#f7d046]/50 bg-[#f7d046]/10"
                            : "border-white/10 bg-black/20"
                        }`}
                        style={{ animationDelay: `${250 + index * 100}ms` }}
                      >
                        <div className="flex min-w-0 items-center gap-3 text-sm font-medium text-zinc-100 sm:text-base">
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                              isWinner
                                ? "bg-[#f7d046] text-zinc-950"
                                : "bg-white/10 text-zinc-400"
                            }`}
                          >
                            {index + 1}
                          </span>
                          <span className="truncate">{entry.displayName}</span>
                          {entry.userId === myUserId ? (
                            <span className="shrink-0 text-zinc-500 font-normal">
                              (you)
                            </span>
                          ) : null}
                        </div>

                        <div
                          className={`shrink-0 text-lg font-semibold sm:text-xl ${
                            isWinner ? "text-[#f7d046]" : "text-white"
                          }`}
                        >
                          {entry.score}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="animate-match-back-reveal mt-8 text-center">
                  <button
                    className="btn-glow px-6"
                    style={{ "--btn-color": "#f7d046" } as React.CSSProperties}
                    type="button"
                    onClick={leaveFinishedMatch}
                    onMouseMove={handleMouseMoveToSetFillOrigin}
                  >
                    <span>back</span>
                  </button>
                </div>
              </>
            ) : (
              <>
            <div className="shrink-0 text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
              Scoreboard
            </div>
            {scoreboard.length === 0 ? (
              <div className="mt-4 flex flex-1 items-center justify-center rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-500">
                Waiting for players.
              </div>
            ) : (
              <div className="mt-4 grid gap-2.5 lg:min-h-0 lg:flex-1 lg:grid-rows-5 lg:gap-2">
                {scoreboard.map((entry) => {
                  const isCurrentLockOwner = entry.userId === lockOwnerId;
                  const isWinRow =
                    roundPhase === "resolution-win" && isCurrentLockOwner;
                  const isFailRow =
                    roundPhase === "resolution-fail" && isCurrentLockOwner;
                  const isLockedRow =
                    roundPhase === "guessing" && isCurrentLockOwner;

                  return (
                    <div
                      key={entry.userId}
                      className={`flex min-h-[3.25rem] items-center justify-between rounded-2xl border px-4 py-3.5 lg:min-h-0 lg:py-0 transition-all duration-500 ease-in-out
                      ${
                        isWinRow
                          ? "border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)] scale-[1.01]"
                          : isFailRow
                            ? "border-rose-500/40 bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                            : isLockedRow
                              ? "border-[#f7d046]/40 bg-[#f7d046]/10 shadow-[0_0_15px_rgba(247,208,70,0.15)]"
                              : "border-white/10 bg-black/20"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-zinc-100">
                        <span className="truncate">{entry.displayName}</span>
                        {entry.userId === myUserId ? (
                          <span className="shrink-0 text-zinc-500 font-normal">
                            (you)
                          </span>
                        ) : null}
                        {!entry.connected ? (
                          <span className="shrink-0 text-zinc-500 font-normal text-xs">
                            (offline)
                          </span>
                        ) : null}
                      </div>

                      <div
                        className={`shrink-0 text-lg font-semibold transition-all duration-300
                        ${isWinRow ? "text-emerald-400 scale-125 font-bold" : "text-white"}`}
                      >
                        {entry.score}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
              </>
            )}
          </section>
          </div>
      </div>
    </div>
  );
}
