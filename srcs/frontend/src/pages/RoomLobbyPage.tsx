import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/auth-context";
import { socket } from "../api/socket";

function normalizeCode(raw: string) {
  return (raw ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
}

// Map the backend payload type
type MatchStatePayload = {
  matchId: string;
  expectedPlayers: number;
  phase: "lobby" | "countdown" | "playing" | "finished";
  players: Array<{
    playerId: string;
    playerName: string;
    ready: boolean;
  }>;
};

export default function RoomLobbyPage() {
  const nav = useNavigate();
  const { code: codeParam } = useParams();
  const { user } = useAuth();

  const code = useMemo(() => normalizeCode(codeParam ?? ""), [codeParam]);

  const [copied, setCopied] = useState(false);
  const [matchState, setMatchState] = useState<MatchStatePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Identify the current user in the player list
  const me = useMemo(() => {
    if (!matchState || !user) return null;
    return matchState.players.find((p) => p.playerId === String(user.id)); // Adjust to match your user ID property
  }, [matchState, user]);

  useEffect(() => {
    if (!user || !code) return;

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
    });

    socket.on("match:error", (err: { message: string }) => {
      setError(err.message);
    });

    socket.on("match:countdown", (payload: { seconds: number }) => {
      // Future feature: Transition to the game view or show a countdown overlay
      console.log(`Game starts in ${payload.seconds}s`);
    });

    return () => {
      socket.off("connect", joinMatch);
      socket.off("match:state");
      socket.off("match:error");
      socket.off("match:countdown");
      // Cleanly disconnect when leaving the page so the backend's "disconnect" handler triggers
      socket.disconnect();
    };
  }, [code, user]);

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
    socket.disconnect(); // Fire immediate disconnect
    nav("/", { replace: true });
  }

  return (
    <div className="container-page py-10 fade-in">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Lobby
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Waiting for players. Game starts when everyone is ready.
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

        <div className="grid gap-4 md:grid-cols-3">
          {/* Left: room info */}
          <div className="card p-6 md:col-span-1">
            <div className="text-xs font-medium text-zinc-400">Room code</div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div
                className={[
                  "rounded-xl border border-white/10 bg-black/20 px-3 py-2 font-mono text-lg tracking-widest text-zinc-100",
                  copied ? "code-flash" : "",
                ].join(" ")}
              >
                {code || "—"}
              </div>
              <button
                className="btn-ghost"
                type="button"
                onClick={copyCode}
                disabled={!code || copied}
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <button
                className="btn-glow"
                style={
                  {
                    "--btn-color": me?.ready ? "#4ade80" : "#f7d046",
                  } as React.CSSProperties
                }
                type="button"
                onClick={toggleReady}
                disabled={!matchState}
              >
                <span>{me?.ready ? "Ready!" : "Click to Ready"}</span>
              </button>
              <button className="btn-ghost" type="button" onClick={leave}>
                Leave room
              </button>
            </div>
          </div>

          {/* Right: players */}
          <div className="card p-6 md:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-zinc-400">Players</div>
                <div className="mt-1 text-sm text-zinc-300">
                  {matchState ? matchState.players.length : 0} connected
                  {matchState && ` / ${matchState.expectedPlayers} max`}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300">
                {matchState?.phase.toUpperCase() || "CONNECTING..."}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {!matchState ? (
                <div className="text-sm text-zinc-500">
                  Connecting to socket...
                </div>
              ) : (
                matchState.players.map((p) => (
                  <div
                    key={p.playerId}
                    className="rounded-2xl border border-white/10 bg-black/20 p-4 transition duration-200 ease-out hover:border-white/20 hover:bg-white/[0.07]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-zinc-100">
                        {p.playerName}{" "}
                        {p.playerId === String(user?.id) ? (
                          <span className="text-zinc-500">(you)</span>
                        ) : null}
                      </div>
                      <div
                        className={`h-2 w-2 rounded-full ${
                          p.ready ? "bg-emerald-400" : "bg-rose-400"
                        }`}
                      />
                    </div>
                    <div className="mt-2 text-xs text-zinc-500">
                      {p.ready ? "Ready to play" : "Waiting..."}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
