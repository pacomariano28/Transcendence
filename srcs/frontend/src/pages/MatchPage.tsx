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

function normalizeCode(raw: string) {
  return (raw ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

type MatchStatePayload = {
  matchId: string;
  roundsTotal: number;
  phase: "lobby" | "countdown" | "in-game" | "playing" | "finished";
  players: Array<{
    userId: string;
    displayName: string;
    ready: boolean;
    connected: boolean;
    disconnectedAt: string | null;
    score?: number;
    totalScore?: number;
  }>;
  scores?: Record<string, number>;
};

type MatchPhasePayload = {
  matchId: string;
  phase: MatchStatePayload["phase"];
  previousPhase?: MatchStatePayload["phase"];
  reason?: string;
};

type ScoreEntry = {
  userId: string;
  displayName: string;
  score: number;
};

type RoundPreview = {
  trackId: string;
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
  id: string;
  track: string;
  artist: string;
};

type RoundGuessResultPayload = {
  matchId: string;
  roundIndex: number;
  lockOwnerId: string;
  correct: boolean;
  reason: "wrong" | "timeout" | null;
  trackId: string | null;
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
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const myUserId = user ? String(user.id) : null;

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
    if (code) {
      setActiveMatch({
        code: code,
        roundLabel: roundInfo
          ? `R ${roundInfo.roundIndex + 1}/${roundInfo.roundsTotal}`
          : undefined,
      });
    }
  }, [code, roundInfo, setActiveMatch]);

  useEffect(() => {
    if (
      finalScores ||
      matchState?.phase === "finished" ||
      roundPhase === "finished"
    ) {
      setActiveMatch(null);
    }
  }, [finalScores, matchState?.phase, roundPhase, setActiveMatch]);

  useEffect(() => {
    if (!code) return;

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
        console.error(
          "Error al sincronizar puntuaciones por HTTP al montar:",
          err,
        );
      }
    }

    hydrateMatch();
  }, [code]);

  useEffect(() => {
    if (code) {
      setActiveMatch({
        code: code,
        roundLabel: roundInfo
          ? `R ${roundInfo.roundIndex + 1}/${roundInfo.roundsTotal}`
          : undefined,
      });
    }
  }, [code, roundInfo, setActiveMatch]);

  useEffect(() => {
    if (finalScores) {
      setActiveMatch(null);
    }
  }, [finalScores, setActiveMatch]);

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

    function startCountdown(initialSeconds: number, endsAt: number) {
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
          audioContextRef.current?.resume();

          if (audioRef.current) {
            const delaySeconds = Math.abs(remainingMs) / 1000;
            audioRef.current.currentTime = delaySeconds;
            audioRef.current.play().catch(() => undefined);
          }
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

      if (audioRef.current) {
        if (payload.resumeTime !== null) {
          audioRef.current.currentTime = payload.resumeTime;
        }
        audioContextRef.current?.resume();
        audioRef.current.play().catch(() => undefined);
      }
    });

    socket.on("match:end", (payload: MatchEndPayload) => {
      if (payload.matchId !== code) return;
      setFinalScores(payload.scores);
      setRoundPhase("finished");
      if (audioRef.current) {
        audioRef.current.pause();
      }
    });

    socket.on("match:error", (err: { message: string }) => {
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
  }, [code, nav, user]);

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
    sourceRef.current = source;

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
      sourceRef.current = null;
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
    setLockRequested(true);
    socket.emit("round:lock_request", {
      matchId: code,
      time: audioRef.current.currentTime,
    });
  }, [canLock, code, lockRequested]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!canLock) return; // Si canLock es false (incluyendo si estás en cooldown), el espacio se ignora
      if (event.code !== "Space") return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
      )
        return;
      event.preventDefault();
      requestLock();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canLock, requestLock]);

  function submitGuess() {
    if (!canGuess || !selectedTrack) return;
    socket.emit("round:guess_submit", {
      matchId: code,
      trackId: selectedTrack.id,
      track: selectedTrack.track,
      artist: selectedTrack.artist,
    });
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

  const showCountdown = !showGuessPanel && !showVisualizer;
  const showEq = !showGuessPanel && showVisualizer;

  const isMatchFinished =
    matchState?.phase === "finished" || roundPhase === "finished";

  const playersList = matchState?.players || [];
  const resultsData =
    finalScores ||
    playersList
      .map((player) => ({
        userId: player.userId,
        displayName:
          (player as any).username || (player as any).displayName || "Jugador",
        score: scores[player.userId] || (player as any).score || 0,
      }))
      .sort((a, b) => b.score - a.score);

  return (
    <div className="flex min-h-screen flex-col items-center container-page py-10 fade-in">
      <style>{`
      @keyframes roundPop {
        0% { transform: scale(0.85); opacity: 0; filter: brightness(1.8); }
        50% { transform: scale(1.18); opacity: 1; filter: brightness(1.4); box-shadow: 0 0 20px rgba(247,208,70,0.4); }
        100% { transform: scale(1); opacity: 1; filter: brightness(1); }
      }
      .animate-round-change {
        animation: roundPop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      }
    `}</style>

      <div className="w-full max-w-4xl space-y-6">
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

        {isMatchFinished ? (
          <section className="card p-6 animate-fade-in">
            <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
              Final results
            </div>
            <div className="mt-4 grid gap-3">
              {resultsData.map((entry) => (
                <div
                  key={entry.userId}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="text-sm font-medium text-zinc-100">
                    {entry.displayName}
                    {entry.userId === myUserId ? (
                      <span className="text-zinc-500"> (you)</span>
                    ) : null}
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {entry.score}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <button
                className="btn-glow px-6"
                style={{ "--btn-color": "#f7d046" } as React.CSSProperties}
                type="button"
                onClick={() => nav("/")}
                onMouseMove={handleMouseMoveToSetFillOrigin}
              >
                <span>back</span>
              </button>
            </div>
          </section>
        ) : (
          <section className="card p-6">
            <div className="flex flex-col sm:flex-row items-stretch gap-4">
              <div className="flex-1 min-w-0">
                <div className="relative h-60 w-full overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                  {songRemainingSeconds !== null &&
                    (roundPhase === "playing" ||
                      roundPhase === "guessing" ||
                      roundPhase === "resolution-win" ||
                      roundPhase === "resolution-fail") && (
                      <div className="absolute top-4 left-4 z-30 flex h-7 items-center gap-2 rounded-xl border border-white/10 bg-black/60 px-3 font-mono text-xs font-medium text-zinc-300 backdrop-blur-md transition-opacity animate-fade-in">
                        <span className="relative h-2 w-2 shrink-0">
                          <span
                            className={`absolute inset-0 rounded-full bg-amber-400 opacity-75 ${roundPhase === "playing" ? "animate-ping" : ""}`}
                          ></span>
                          <span className="relative block h-2 w-2 rounded-full bg-[#f7d046]"></span>
                        </span>
                        <span className="relative transform translate-y-[1px]">
                          Track: {songRemainingSeconds}s
                        </span>
                      </div>
                    )}

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
                      className="h-52 w-full"
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
              </div>

              {/* ⏱️ MODIFICADO: LOCK BUTTON CON SOPORTE PARA COOLDOWN VISUAL */}
              <div className="flex items-center justify-center sm:justify-start">
                <button
                  className="btn-glow h-16 sm:h-60 w-full sm:w-44 transition-all duration-500 disabled:opacity-40"
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
            </div>

            {roundInfo?.playlistError && (
              <div className="mt-4 rounded-lg border border-rose-500/50 bg-rose-500/10 p-4 text-rose-200">
                {roundInfo.playlistError}
              </div>
            )}
          </section>
        )}

        {!isMatchFinished && (
          <section className="card p-6 overflow-hidden">
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
        )}

        {!isMatchFinished && (
          <section className="card p-6">
            <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
              Scoreboard
            </div>
            <div className="mt-4 grid gap-3">
              {scoreboard.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-500">
                  Waiting for players.
                </div>
              ) : (
                scoreboard.map((entry) => {
                  const isCurrentLockOwner = entry.userId === lockOwnerId;
                  const isWinRow =
                    roundPhase === "resolution-win" && isCurrentLockOwner;
                  const isFailRow =
                    roundPhase === "resolution-fail" && isCurrentLockOwner;

                  return (
                    <div
                      key={entry.userId}
                      className={`flex items-center justify-between rounded-2xl border p-4 transition-all duration-500 ease-in-out
                      ${
                        isWinRow
                          ? "border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)] scale-[1.01]"
                          : isFailRow
                            ? "border-rose-500/40 bg-rose-500/10 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
                            : "border-white/10 bg-black/20"
                      }`}
                    >
                      <div className="text-sm font-medium text-zinc-100 flex items-center gap-2">
                        {entry.displayName}
                        {entry.userId === myUserId ? (
                          <span className="text-zinc-500 font-normal">
                            {" "}
                            (you)
                          </span>
                        ) : null}
                        {!entry.connected ? (
                          <span className="text-zinc-500 font-normal text-xs">
                            {" "}
                            (offline)
                          </span>
                        ) : null}
                      </div>

                      <div
                        className={`text-lg font-semibold transition-all duration-300
                        ${isWinRow ? "text-emerald-400 scale-125 font-bold" : "text-white"}`}
                      >
                        {entry.score}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
