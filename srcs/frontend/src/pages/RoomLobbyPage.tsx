import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/auth-context";
import { socket } from "../api/socket";
import TypingText from "../components/TypingText";
import { handleMouseMoveToSetFillOrigin } from "../utils/buttonHover";
import type {
  MatchPhasePayload,
  MatchStatePayload,
  RoomLobbyLocationState,
} from "../types/socket.payloads";

function normalizeCode(raw: string) {
  return (raw ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

export default function RoomLobbyPage() {
  const location = useLocation();
  const createdMatch = (location.state as RoomLobbyLocationState | null)
    ?.createdMatch;

  const nav = useNavigate();
  const { code: codeParam } = useParams();
  const { user } = useAuth();

  const code = useMemo(() => normalizeCode(codeParam ?? ""), [codeParam]);

  const [matchState, setMatchState] = useState<MatchStatePayload | null>(
    createdMatch ?? null,
  );
  // console.log("RoomLobby: createdMatch from location.state:", createdMatch);

  const [error, setError] = useState<string | null>(null);
  const me = useMemo(() => {
    if (!matchState || !user) return null;
    const userId = String(user.id);
    return matchState.players.find((p) => p.userId === userId);
  }, [matchState, user]);

  const connectedPlayers = useMemo(() => {
    if (!matchState) return [];
    return matchState.players.filter((player) => player.connected);
  }, [matchState]);

  useEffect(() => {
    if (!user || !code) return;

    // Connect if the socket is currently disconnected
    if (!socket.connected) {
      socket.connect();
    }

    const joinMatch = () => {
      if (createdMatch?.matchId === code) return;
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

      if (payload.phase === "in-game") {
        nav(`/match/${code}`, { replace: true });
      }
    });

    socket.on("match:phase", (payload: MatchPhasePayload) => {
      if (payload.matchId !== code) return;
      setMatchState((prev) =>
        prev ? { ...prev, phase: payload.phase } : prev,
      );
      setError(null);
      if (payload.phase === "in-game") {
        nav(`/match/${code}`, { replace: true });
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
  }, [code, user, nav, createdMatch]);

  function toggleReady() {
    socket.emit("match:ready");
  }

  function leave() {
    if (socket.connected) {
      socket.disconnect();
    }
    nav("/", { replace: true });
  }

  return (
    <div className="container-page py-10 fade-in mt-5">
      <div className="mx-auto max-w-3xl">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
            <TypingText text="Lobby code" size="md" className="ms-1" />
          </div>
          <div className="mt-3 font-mono text-4xl font-semibold tracking-[0.35em] text-white sm:text-5xl">
            {code || "———"}
          </div>

          <div className="mt-6 flex gap-3 sm:flex-row">
            <button
              className="btn-glow flex-5 p-4"
              style={
                {
                  "--btn-color": me?.ready ? "#4ade80" : "#f7d046",
                } as React.CSSProperties
              }
              type="button"
              onClick={toggleReady}
              onMouseMove={handleMouseMoveToSetFillOrigin}
              disabled={!matchState}
            >
              <span>{me?.ready ? "Ready" : "Mark ready"}</span>
            </button>
            <button className="btn-ghost flex-1" type="button" onClick={leave}>
              Leave room
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200 nudge">
              <strong>Error:</strong> {error}
            </div>
          )}

          <div className="mt-8 page-card">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
                Connected players
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
                {matchState ? connectedPlayers.length : 0}
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {connectedPlayers.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-500">
                  Waiting for players to connect.
                </div>
              ) : (
                connectedPlayers.map((player) => (
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
                          player.ready ? "bg-emerald-400" : "bg-rose-400"
                        }`}
                      />
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
