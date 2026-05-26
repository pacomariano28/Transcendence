import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/auth-context";
import { socket } from "../api/socket";

function normalizeCode(raw: string) {
  return (raw ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

// Map the backend payload type
type MatchStatePayload = {
  matchId: string;
  expectedPlayers: number;
  phase: "lobby" | "countdown" | "in-game" | "playing" | "finished";
  players: Array<{
    playerId: string;
    playerName: string;
    ready: boolean;
  }>;
};

const phaseMeta: Record<
  MatchStatePayload["phase"],
  {
    title: string;
    caption: string;
    accent: string;
  }
> = {
  lobby: {
    title: "Lobby open",
    caption: "Waiting for every player to lock in before the match begins.",
    accent: "#f7d046",
  },
  countdown: {
    title: "Countdown live",
    caption: "The match is about to start. Final checks are in progress.",
    accent: "#fb7185",
  },
  "in-game": {
    title: "Match running",
    caption: "The arena is active. Gameplay can be dropped in here later.",
    accent: "#4ade80",
  },
  playing: {
    title: "Match running",
    caption: "The arena is active. Gameplay can be dropped in here later.",
    accent: "#4ade80",
  },
  finished: {
    title: "Match finished",
    caption: "The round is over. Results can be shown here in a later pass.",
    accent: "#93c5fd",
  },
};

function getPhaseKey(phase?: MatchStatePayload["phase"] | null) {
  if (!phase) return "lobby";
  if (phase === "playing") return "in-game";
  return phase;
}

export default function RoomLobbyPage() {
  const nav = useNavigate();
  const { code: codeParam } = useParams();
  const { user } = useAuth();
  const countdownTimerRef = useRef<number | null>(null);

  const code = useMemo(() => normalizeCode(codeParam ?? ""), [codeParam]);

  const [copied, setCopied] = useState(false);
  const [matchState, setMatchState] = useState<MatchStatePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);

  // Identify the current user in the player list
  const me = useMemo(() => {
    if (!matchState || !user) return null;
    return matchState.players.find((p) => p.playerId === String(user.id));
  }, [matchState, user]);

  const phaseKey = getPhaseKey(matchState?.phase);
  const meta = phaseMeta[phaseKey];

  const readyCount = useMemo(() => {
    if (!matchState) return 0;
    return matchState.players.filter((player) => player.ready).length;
  }, [matchState]);

  const progress = useMemo(() => {
    if (!matchState || !matchState.expectedPlayers) return 0;
    return Math.min(
      100,
      (matchState.players.length / matchState.expectedPlayers) * 100,
    );
  }, [matchState]);

  const allReady = Boolean(
    matchState &&
      matchState.players.length > 0 &&
      matchState.players.length === matchState.expectedPlayers &&
      matchState.players.every((entry) => entry.ready),
  );

  useEffect(() => {
    if (!user || !code) return;

    const clearCountdownTimer = () => {
      if (countdownTimerRef.current !== null) {
        window.clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
    };

    // Connect if the socket is currently disconnected
    if (!socket.connected) {
      socket.connect();
    }

    const joinMatch = () => {
      socket.emit("match:join", {
        matchId: code,
        playerId: String(user.id), // Ensure string mapping matches your backend
        playerName: user.username ?? user.email ?? "Guest",
      });
    };

    if (socket.connected) {
      joinMatch();
    }

    socket.on("connect", joinMatch);

    socket.on("match:state", (payload: MatchStatePayload) => {
      setMatchState(payload);
      setError(null);
      if (payload.phase !== "countdown") {
        setCountdownSeconds(null);
        clearCountdownTimer();
      }
    });

    socket.on("match:error", (err: { message: string }) => {
      setError(err.message);
    });

    socket.on("match:countdown", (payload: { seconds: number }) => {
      setCountdownSeconds(payload.seconds);
      clearCountdownTimer();

      let remaining = payload.seconds;
      countdownTimerRef.current = window.setInterval(() => {
        remaining -= 1;

        if (remaining <= 0) {
          clearCountdownTimer();
          nav(`/match/${code}`, { replace: true });
          return;
        }

        setCountdownSeconds(remaining);
      }, 1000);
    });

    window.addEventListener("beforeunload", clearCountdownTimer);

    return () => {
      socket.off("connect", joinMatch);
      socket.off("match:state");
      socket.off("match:error");
      socket.off("match:countdown");
      window.removeEventListener("beforeunload", clearCountdownTimer);
      clearCountdownTimer();
    };
  }, [code, user, nav]);

  async function copyCode() {
    if (!code || copied) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(false);
      requestAnimationFrame(() => setCopied(true));
      window.setTimeout(() => setCopied(false), 3800);
    } catch (err) {
      console.error("Copy failed", err);
      setError("Could not copy the room code. Please try manually.");
    }
  }

  function toggleReady() {
    socket.emit("match:ready");
  }

  function leave() {
    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    nav("/", { replace: true });
  }

  const displayName = user?.username ?? user?.email ?? "Guest";
  const currentStateLabel =
    phaseKey === "countdown" && countdownSeconds !== null
      ? `Starting in ${countdownSeconds}s`
      : meta.title;

  return (
    <div className="container-page py-10 fade-in">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.28em] text-zinc-300">
              Match room
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {phaseKey === "countdown"
                ? "The match is about to start"
                : "Prepare the arena"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              {meta.caption}
            </p>
          </div>
          <button className="btn-ghost" onClick={leave}>
            Back
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-500/50 bg-rose-500/10 p-4 text-rose-200">
            {error}
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[1.45fr_0.85fr]">
          <section className="page-card overflow-hidden p-0">
            <div className="border-b border-white/10 bg-white/[0.03] px-5 py-4 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-400">
                    Arena status
                  </div>
                  <div className="mt-1 flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-white sm:text-2xl">
                      {currentStateLabel}
                    </h2>
                    <span
                      className="rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.22em]"
                      style={{
                        borderColor: `${meta.accent}40`,
                        color: meta.accent,
                        background: `${meta.accent}10`,
                      }}
                    >
                      {phaseKey}
                    </span>
                  </div>
                </div>
                <div className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs text-zinc-300">
                  {displayName}
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(247,208,70,0.16),_rgba(20,20,22,0.95)_55%)] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.26em] text-zinc-400">
                      Match room
                    </div>
                    <div className="mt-2 font-mono text-4xl font-semibold tracking-[0.35em] text-white sm:text-5xl">
                      {code || "———"}
                    </div>
                    <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400">
                      Share this code with the other players. The room stays aligned with the current socket state and will move forward automatically when everyone is ready.
                    </p>
                  </div>

                  <button
                    className="btn-ghost shrink-0"
                    type="button"
                    onClick={copyCode}
                    disabled={!code || copied}
                  >
                    {copied ? "Copied" : "Copy code"}
                  </button>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                      Players
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-white">
                      {matchState ? matchState.players.length : 0}
                    </div>
                    <div className="mt-1 text-sm text-zinc-400">
                      Connected to the match
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                      Ready
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-white">
                      {readyCount}
                    </div>
                    <div className="mt-1 text-sm text-zinc-400">
                      Players locked in
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                      Progress
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-white">
                      {Math.round(progress)}%
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full transition-all duration-300 ease-out"
                        style={{
                          width: `${progress}%`,
                          background: `linear-gradient(90deg, ${meta.accent}, rgba(255,255,255,0.9))`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                      Live prompt
                    </div>
                    <div className="mt-1 text-lg font-medium text-white">
                      {phaseKey === "countdown"
                        ? "Get ready"
                        : phaseKey === "in-game"
                          ? "Arena active"
                          : "Hold position"}
                    </div>
                  </div>
                  <div
                    className="rounded-2xl border px-4 py-2 text-sm font-medium"
                    style={{
                      borderColor: `${meta.accent}35`,
                      color: meta.accent,
                      background: `${meta.accent}10`,
                    }}
                  >
                    {matchState ? `${matchState.expectedPlayers} player room` : "Connecting"}
                  </div>
                </div>

                <div className="mt-6 flex min-h-64 flex-col items-center justify-center rounded-[1.4rem] border border-dashed border-white/10 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.06),_rgba(0,0,0,0)_65%)] p-6 text-center">
                  {phaseKey === "countdown" ? (
                    <>
                      <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                        Countdown
                      </div>
                      <div className="mt-4 text-7xl font-semibold tracking-tight text-white sm:text-8xl">
                        {countdownSeconds ?? "5"}
                      </div>
                      <p className="mt-4 max-w-xs text-sm leading-relaxed text-zinc-400">
                        The match is being staged. This area can become the actual game board later.
                      </p>
                    </>
                  ) : phaseKey === "in-game" ? (
                    <>
                      <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                        Match active
                      </div>
                      <div className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
                        Gameplay shell ready
                      </div>
                      <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-400">
                        The match page is ready for a future playfield or canvas without changing the current room structure.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                        Waiting for readiness
                      </div>
                      <div className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
                        {allReady ? "Ready to launch" : "Awaiting players"}
                      </div>
                      <p className="mt-4 max-w-sm text-sm leading-relaxed text-zinc-400">
                        {allReady
                          ? "Everyone is locked in. The backend will move the room into countdown automatically."
                          : "Use the ready action to move the room toward the countdown state."}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>

          <aside className="section-stack">
            <div className="card p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
                    Your state
                  </div>
                  <div className="mt-1 text-lg font-semibold text-white">
                    {me?.ready ? "Ready" : "Not ready"}
                  </div>
                </div>
                <div className={`h-3 w-3 rounded-full ${me?.ready ? "bg-emerald-400" : "bg-rose-400"}`} />
              </div>

              <div className="mt-5 flex flex-col gap-3">
                <button
                  className="btn-glow"
                  style={
                    {
                      "--btn-color": me?.ready ? "#4ade80" : meta.accent,
                    } as React.CSSProperties
                  }
                  type="button"
                  onClick={toggleReady}
                  disabled={!matchState}
                >
                  <span>{me?.ready ? "Ready locked" : "Mark ready"}</span>
                </button>
                <button className="btn-ghost" type="button" onClick={leave}>
                  Leave room
                </button>
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
                Phase: <span className="text-zinc-100">{meta.title}</span>
                <div className="mt-1">
                  {phaseKey === "countdown"
                    ? `Starting in ${countdownSeconds ?? 5}s`
                    : "Socket-driven match state is live."}
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
                    Players
                  </div>
                  <div className="mt-1 text-sm text-zinc-400">
                    {matchState
                      ? `${readyCount} ready / ${matchState.players.length} connected`
                      : "Connecting to socket..."}
                  </div>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                  {matchState ? `${matchState.players.length}/${matchState.expectedPlayers}` : "..."}
                </div>
              </div>

              <div className="mt-4 grid gap-3">
                {!matchState ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-500">
                    Connecting to the match service.
                  </div>
                ) : (
                  matchState.players.map((p) => (
                    <div
                      key={p.playerId}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4 transition duration-200 ease-out hover:border-white/20 hover:bg-white/[0.07]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-medium text-zinc-100">
                          {p.playerName}
                          {p.playerId === String(user?.id) ? (
                            <span className="text-zinc-500"> (you)</span>
                          ) : null}
                        </div>
                        <div
                          className={`h-2.5 w-2.5 rounded-full ${
                            p.ready ? "bg-emerald-400" : "bg-rose-400"
                          }`}
                        />
                      </div>
                      <div className="mt-2 text-xs text-zinc-500">
                        {p.ready ? "Ready to play" : "Waiting on ready signal"}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
