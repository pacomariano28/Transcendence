import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/auth-context";
import { socket } from "../api/socket";
import type { SpotifySearchTrack } from "../api/spotify";
import { searchSpotifyTracks } from "../api/spotify";
import { handleMouseMoveToSetFillOrigin } from "../utils/buttonHover";

function normalizeCode(raw: string) {
  return (raw ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

type MatchStatePayload = {
  matchId: string;
  expectedPlayers: number;
  roundsTotal: number;
  phase: "lobby" | "countdown" | "in-game" | "playing" | "finished";
  players: Array<{
    userId: string;
    displayName: string;
    ready: boolean;
    connected: boolean;
    disconnectedAt: string | null;
  }>;
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

type RoundGuessResultPayload = {
  matchId: string;
  roundIndex: number;
  lockOwnerId: string;
  correct: boolean;
  reason: "wrong" | "timeout" | null;
  trackId: string | null;
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

type RoundPhase =
  | "idle"
  | "sync"
  | "countdown"
  | "playing"
  | "guessing"
  | "resolution-win"
  | "resolution-fail"
  | "finished";

const SECOND_MS = 1000;

export default function MatchPage() {
  const nav = useNavigate();
  const { code: codeParam } = useParams();
  const { user } = useAuth();

  const code = useMemo(() => normalizeCode(codeParam ?? ""), [codeParam]);

  const [matchState, setMatchState] = useState<MatchStatePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [roundInfo, setRoundInfo] = useState<RoundSyncPayload | null>(null);
  const [roundPhase, setRoundPhase] = useState<RoundPhase>("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioReady, setAudioReady] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [guessSeconds, setGuessSeconds] = useState<number | null>(null);
  const [lockOwnerId, setLockOwnerId] = useState<string | null>(null);
  const [guessEndsAt, setGuessEndsAt] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<RoundGuessResultPayload | null>(
    null,
  );
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

  const [guessStatus, setGuessStatus] = useState<
    "countdown" | "expired" | "wrong"
  >("countdown");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const readyRoundRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const myUserId = user ? String(user.id) : null;
  const lockOwnerName = useMemo(() => {
    if (!matchState || !lockOwnerId) return "";
    return (
      matchState.players.find((player) => player.userId === lockOwnerId)
        ?.displayName ?? ""
    );
  }, [matchState, lockOwnerId]);

  const scoreboard = useMemo(() => {
    if (!matchState) return [];
    return matchState.players.map((player) => ({
      userId: player.userId,
      displayName: player.displayName,
      score: scores[player.userId] ?? 0,
      connected: player.connected,
    }));
  }, [matchState, scores]);

  const isLockOwner = Boolean(lockOwnerId && lockOwnerId === myUserId);
  const canLock = roundPhase === "playing" && audioReady && !lockOwnerId;
  const canGuess = roundPhase === "guessing" && isLockOwner;

  const roundLabel = roundInfo
    ? `Round ${roundInfo.roundIndex + 1} / ${roundInfo.roundsTotal}`
    : "Waiting for round";

  const roundStatus = useMemo(() => {
    if (roundPhase === "sync") {
      return audioReady ? "Waiting for players" : "Loading preview";
    }
    if (roundPhase === "countdown") {
      return "Starting";
    }
    if (roundPhase === "playing") {
      return "Playing";
    }
    if (roundPhase === "guessing") {
      return "Guessing";
    }
    if (roundPhase === "resolution-win") {
      return "Correct";
    }
    if (roundPhase === "resolution-fail") {
      return "Wrong";
    }
    if (roundPhase === "finished") {
      return "Finished";
    }
    return "Idle";
  }, [roundPhase, audioReady]);

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
        payload.players.forEach((player) => {
          if (next[player.userId] === undefined) {
            next[player.userId] = 0;
          }
        });
        return next;
      });
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
      setGuessStatus("countdown");
      setShowVisualizer(false);
      setRoundInfo(payload);
      setRoundPhase("sync");
      setCountdownSeconds(null);
      setGuessSeconds(null);
      setGuessEndsAt(null);
      setLockOwnerId(null);
      setLastResult(null);
      setLockRequested(false);
      readyRoundRef.current = null;
      setAudioReady(false);
      setError(payload.playlistError ?? null);
      setSearchTerm("");
      setSearchResults([]);
      setSearching(false);
      setSearchError(null);
      setSelectedTrack(null);
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

    function startCountdown(seconds: number) {
      clearCountdownTimer();
      setRoundPhase("countdown");
      setCountdownSeconds(seconds);

      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }

      let remaining = seconds;
      countdownTimerRef.current = window.setInterval(() => {
        remaining -= 1;
        if (remaining <= 0) {
          clearCountdownTimer();

          setShowVisualizer(true);

          setTimeout(() => {
            setCountdownSeconds(null);
          }, 400);

          setRoundPhase("playing");

          audioContextRef.current?.resume();
          audioRef.current?.play().catch(() => undefined);

          return;
        }
        setCountdownSeconds(remaining);
      }, SECOND_MS);
    }

    socket.on("round:countdown", (payload: RoundCountdownPayload) => {
      if (payload.matchId !== code) return;
      startCountdown(payload.seconds);
    });
    socket.on("round:lock_confirmed", (payload: RoundLockPayload) => {
      if (payload.matchId !== code) return;
      setRoundPhase("guessing");
      setGuessStatus("countdown");
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
      setLastResult(payload);

      // Corregido: Evaluamos la razón real que manda el servidor
      if (!payload.correct) {
        if (payload.reason === "timeout") {
          setGuessStatus("expired");
        } else {
          setGuessStatus("wrong");
        }

        // Devolvemos a countdown tras mostrar el mensaje el tiempo correspondiente
        setTimeout(() => {
          setGuessStatus("countdown");
        }, 1200);
      }

      setRoundPhase(payload.correct ? "resolution-win" : "resolution-fail");
      setGuessSeconds(null);
      setGuessEndsAt(null);
      setLockOwnerId(payload.lockOwnerId);
      setScores((prev) => ({
        ...prev,
        [payload.lockOwnerId]: payload.totalScore,
      }));
      setLockRequested(false);
    });
    socket.on("round:resume", (payload: RoundResumePayload) => {
      if (payload.matchId !== code) return;
      setRoundPhase("playing");
      setLockOwnerId(null);
      setGuessSeconds(null);
      setGuessEndsAt(null);
      setLockRequested(false);

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
      socket.disconnect();
    };
  }, [code, nav, user]);

  useEffect(() => {
    if (!audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
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

    audio.addEventListener("canplaythrough", handleReady);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.load();
    audioRef.current = audio;
    return () => {
      audio.removeEventListener("canplaythrough", handleReady);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);

      audio.pause();
      audio.src = "";

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

      // Solo actualizamos los segundos si la fase sigue activa para evitar saltos visuales
      if (remainingMs > 0) {
        setGuessSeconds(remaining);
      }
    };

    update();
    const timerId = window.setInterval(update, 200);

    return () => window.clearInterval(timerId);
  }, [guessEndsAt]);

  useEffect(() => {
    if (!canGuess || selectedTrack) {
      return;
    }

    const term = searchTerm.trim();
    if (term.length < 2) {
      return;
    }

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
          if (!cancelled) {
            setSearching(false);
          }
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [canGuess, searchTerm, selectedTrack]);

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
      if (!canLock) return;
      if (event.code !== "Space") return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
      ) {
        return;
      }
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
    });
  }

  const selectTrack = useCallback((track: SpotifySearchTrack) => {
    setSelectedTrack(track);
    setSearchTerm(`${track.track} - ${track.artist}`);
    setSearchResults([]);
    setSearchError(null);
    setSearching(false);
  }, []);

  function handleBack() {
    nav(`/room/${code}`, { replace: true });
  }

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
    guessStatus === "expired" ||
    guessStatus === "wrong";

  const showCountdown = !showGuessPanel && !showVisualizer;

  const showEq = !showGuessPanel && showVisualizer;

  return (
    <div className="container-page py-10 fade-in">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
              Match
            </div>
            <div className="mt-1 text-2xl font-semibold text-white">
              {roundLabel}
            </div>
            <div className="mt-1 text-sm text-zinc-400">
              Status: {roundStatus}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs text-zinc-300">
              {code || "———"}
            </div>
            <button className="btn-ghost" onClick={handleBack}>
              Back to lobby
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-500/50 bg-rose-500/10 p-4 text-rose-200">
            {error}
          </div>
        )}

        {finalScores ? (
          <section className="card p-6">
            <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
              Final results
            </div>
            <div className="mt-4 grid gap-3">
              {finalScores.map((entry) => (
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
          </section>
        ) : (
          <section className="card p-6">
            <div className="flex items-stretch gap-4">
              {/* VISUALIZER / COUNTDOWN */}

              <div className="flex-1 min-w-0">
                <div className="relative h-60 w-full overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                  {/* COUNTDOWN INICIAL */}

                  <div
                    className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-700 ease-in-out
    ${
      showCountdown
        ? "opacity-100 scale-100"
        : "opacity-0 scale-95 pointer-events-none"
    }`}
                  >
                    <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-400">
                      Starts in
                    </div>

                    <div className="mt-3 text-6xl font-semibold text-white sm:text-7xl">
                      {countdownSeconds ?? ""}
                    </div>
                  </div>

                  {/* VISUALIZER */}

                  <div
                    className={`absolute inset-0 flex items-center justify-center p-4 transition-all duration-700 ease-in-out
    ${
      showEq
        ? "opacity-100 scale-100"
        : "opacity-0 scale-95 pointer-events-none"
    }`}
                  >
                    <canvas
                      ref={canvasRef}
                      width={1200}
                      height={240}
                      className="h-52 w-full"
                    />
                  </div>

                  {/* GUESS COUNTDOWN */}

                  <div
                    className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-500 ease-in-out
                    ${
                      showGuessPanel
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-95 pointer-events-none"
                    }`}
                  >
                    {guessStatus === "countdown" && guessSeconds !== null && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center animate-fade-in">
                        <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-400">
                          Guess time remaining
                        </div>

                        <div
                          className={`mt-3 text-7xl font-bold transition-all duration-500
                          ${
                            guessSeconds <= 5
                              ? "text-red-500 animate-pulse scale-110"
                              : "text-amber-300"
                          }`}
                        >
                          {guessSeconds}
                        </div>

                        <div className="mt-2 text-sm text-zinc-500">
                          seconds
                        </div>
                      </div>
                    )}

                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-all duration-700
                      ${
                        guessStatus === "expired"
                          ? "opacity-100 scale-100"
                          : "opacity-0 scale-95 pointer-events-none"
                      }`}
                    >
                      <div className="text-5xl font-black tracking-wider text-red-500 animate-bounce">
                        TIME EXPIRED!
                      </div>
                    </div>

                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-all duration-700
                      ${
                        guessStatus === "wrong"
                          ? "opacity-100 scale-100"
                          : "opacity-0 scale-95 pointer-events-none"
                      }`}
                    >
                      <div className="text-4xl font-black tracking-wider text-rose-500 animate-shake">
                        WRONG ANSWER!
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* LOCK BUTTON */}

              <div className="flex items-center">
                <button
                  className="btn-glow h-60 w-48 sm:w/44"
                  style={{ "--btn-color": "#f7d046" } as React.CSSProperties}
                  type="button"
                  disabled={!canLock || lockRequested}
                  onClick={requestLock}
                  onMouseMove={handleMouseMoveToSetFillOrigin}
                >
                  <span>{lockRequested ? "Locking..." : "Lock (Space)"}</span>
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

        {!finalScores && (
          <section className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
                  Lock and guess
                </div>
                {isLockOwner ? (
                  <div className="mt-1 text-lg text-zinc-300 fade-in fade-out">
                    Locked by{" "}
                    <span className="font-extrabold tracking-wider">
                      {lockOwnerName || "player"}
                    </span>
                  </div>
                ) : (
                  <div className="mt-1 text-sm text-zinc-400 fade-out">
                    First lock wins
                  </div>
                )}
              </div>
            </div>

            {roundPhase === "guessing" && (
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 border-[#f7d046]">
                {isLockOwner ? (
                  <div className="mt-4">
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input
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
                        className={`btn-glow submit-guess w-48 sm:w/44 ${!canGuess || !selectedTrack ? "" : "animate-bounce scale-90"}`}
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
                      <div className="mt-3 text-xs text-emerald-300">
                        Selected: {selectedTrack.track} - {selectedTrack.artist}
                      </div>
                    )}

                    {searchError && (
                      <div className="mt-3 text-xs text-rose-300">
                        {searchError}
                      </div>
                    )}

                    {searching && (
                      <div className="mt-3 text-xs text-zinc-500">
                        Searching...
                      </div>
                    )}

                    {!searching &&
                      !searchError &&
                      searchTerm.trim().length >= 2 &&
                      searchResults.length === 0 &&
                      !selectedTrack && (
                        <div className="mt-3 text-xs text-zinc-500">
                          No results.
                        </div>
                      )}

                    {searchResults.length > 0 &&
                      !selectedTrack &&
                      searchTerm.trim().length >= 2 && (
                        <div className="mt-3 grid gap-2">
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
                  <div className="mt-4 text-sm text-zinc-400">
                    Waiting for the lock owner to submit a guess.
                  </div>
                )}
              </div>
            )}

            {/* {lastResult && (
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
                  Result
                </div>
                <div className="mt-2 text-lg font-semibold text-white">
                  {lastResult.correct
                    ? "Correct answer"
                    : lastResult.reason === "timeout"
                      ? "Time expired"
                      : "Wrong answer"}
                </div>
                {lastResult.trackId && (
                  <div className="mt-1 text-sm text-zinc-400">
                    Track id: {lastResult.trackId}
                  </div>
                )}
              </div>
            )} */}
          </section>
        )}

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
              scoreboard.map((entry) => (
                <div
                  key={entry.userId}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="text-sm font-medium text-zinc-100">
                    {entry.displayName}
                    {entry.userId === myUserId ? (
                      <span className="text-zinc-500"> (you)</span>
                    ) : null}
                    {!entry.connected ? (
                      <span className="text-zinc-500"> (offline)</span>
                    ) : null}
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {entry.score}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
