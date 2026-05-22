import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/auth-context";
import { socket } from "../api/socket";

function normalizeCode(raw: string) {
  return (raw ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

type MatchStatePayload = {
  matchId: string;
  expectedPlayers: number;
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

const phaseMeta: Record<
  MatchStatePayload["phase"],
  {
    title: string;
    caption: string;
    accent: string;
  }
> = {
  lobby: {
    title: "Match staging",
    caption:
      "The room is still syncing. The active board will appear once the match begins.",
    accent: "#f7d046",
  },
  countdown: {
    title: "Transitioning",
    caption: "The lobby handoff is still in progress.",
    accent: "#fb7185",
  },
  "in-game": {
    title: "In play",
    caption: "The arena is live. This page is the external match view.",
    accent: "#4ade80",
  },
  playing: {
    title: "In play",
    caption: "The arena is live. This page is the external match view.",
    accent: "#4ade80",
  },
  finished: {
    title: "Round finished",
    caption: "Results can be placed here once match resolution is wired up.",
    accent: "#93c5fd",
  },
};

function getPhaseKey(phase?: MatchStatePayload["phase"] | null) {
  if (!phase) return "lobby";
  if (phase === "playing") return "in-game";
  return phase;
}

export default function MatchPage() {
  const nav = useNavigate();
  const { code: codeParam } = useParams();
  const { user } = useAuth();

  const code = useMemo(() => normalizeCode(codeParam ?? ""), [codeParam]);

  const [matchState, setMatchState] = useState<MatchStatePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const phaseKey = getPhaseKey(matchState?.phase);
  const meta = phaseMeta[phaseKey];
  const me = useMemo(() => {
    if (!matchState || !user) return null;
    const userId = String(user.id);
    return matchState.players.find((player) => player.userId === userId);
  }, [matchState, user]);

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
    });
    socket.on("match:error", (err: { message: string }) => {
      setError(err.message);
    });

    return () => {
      socket.off("connect", joinMatch);
      socket.off("match:state");
      socket.off("match:phase");
      socket.off("match:error");
    };
  }, [code, user]);

  const readyCount = useMemo(() => {
    if (!matchState) return 0;
    return matchState.players.filter((player) => player.ready).length;
  }, [matchState]);

  const liveCount = matchState
    ? matchState.players.filter((player) => player.connected).length
    : 0;

  return (
    <div className="container-page py-10 fade-in">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.28em] text-zinc-300">
              Match view
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {meta.title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
              {meta.caption}
            </p>
          </div>
          <button
            className="btn-ghost"
            onClick={() => nav(`/room/${code}`, { replace: true })}
          >
            Back to lobby
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-500/50 bg-rose-500/10 p-4 text-rose-200">
            {error}
          </div>
        )}

        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
          <section className="page-card overflow-hidden p-0">
            <div className="border-b border-white/10 bg-white/[0.03] px-5 py-4 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-400">
                    Arena
                  </div>
                  <div className="mt-1 flex items-center gap-3">
                    <h2 className="text-xl font-semibold text-white sm:text-2xl">
                      {phaseKey === "countdown"
                        ? "Waiting for handoff"
                        : "Match active"}
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
                  {code || "———"}
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_rgba(20,20,22,0.96)_60%)] p-6">
                <div className="text-xs uppercase tracking-[0.26em] text-zinc-400">
                  Match board
                </div>
                <div className="mt-3 min-h-80 rounded-[1.4rem] border border-dashed border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.1))] p-6">
                  <div className="flex h-full min-h-64 flex-col items-center justify-center text-center">
                    <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                      External match page
                    </div>
                    <div className="mt-4 text-3xl font-semibold text-white sm:text-4xl">
                      Gameplay shell ready
                    </div>
                    <p className="mt-4 max-w-md text-sm leading-relaxed text-zinc-400">
                      This screen is separated from the lobby and can host the
                      actual game canvas later without changing the room flow.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">
                      Match summary
                    </div>
                    <div className="mt-1 text-lg font-medium text-white">
                      {liveCount} connected
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300">
                    {readyCount} ready
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                      Room
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-white">
                      {code || "—"}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                      Phase
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-white">
                      {meta.title}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">
                      You
                    </div>
                    <div className="mt-2 text-2xl font-semibold text-white">
                      {me?.ready ? "Ready" : "Playing"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="section-stack">
            <div className="card p-6">
              <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
                Players
              </div>
              <div className="mt-1 text-sm text-zinc-400">
                {matchState
                  ? `${readyCount} ready / ${liveCount} connected`
                  : "Connecting to socket..."}
              </div>

              <div className="mt-4 grid gap-3">
                {!matchState ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-500">
                    Waiting for match state.
                  </div>
                ) : (
                  matchState.players.map((player) => (
                    <div
                      key={player.userId}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-medium text-zinc-100">
                          {player.displayName}
                          {player.userId === String(user?.id) ? (
                            <span className="text-zinc-500"> (you)</span>
                          ) : null}
                        </div>
                        <div
                          className={`h-2.5 w-2.5 rounded-full ${
                            player.connected
                              ? player.ready
                                ? "bg-emerald-400"
                                : "bg-rose-400"
                              : "bg-zinc-500"
                          }`}
                        />
                      </div>
                      <div className="mt-2 text-xs text-zinc-500">
                        {!player.connected
                          ? "Disconnected"
                          : player.ready
                            ? "Ready"
                            : "Still loading"}
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
