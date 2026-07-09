import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/auth-context";
import { handleMouseMoveToSetFillOrigin } from "../utils/buttonHover";
import TypingText from "../components/TypingText";
import LinkIcon from "../components/icons/LinkIcon";
import { socket } from "../api/socket";
import { getState } from "../api/state";
import {
  ensureEnoughSongsForMatch,
  getAvailableSongCount,
  MATCH_ROUNDS_TOTAL,
  NOT_ENOUGH_SONGS_MESSAGE,
} from "../api/playlist";

async function ensureSocketConnected() {
  if (!socket.connected) {
    await new Promise<void>((resolve, reject) => {
      const handleConnect = () => {
        cleanup();
        resolve();
      };

      const handleConnectError = (err: unknown) => {
        cleanup();
        console.error("Failed to connect socket:", err);
        reject(err);
      };

      const cleanup = () => {
        socket.off("connect", handleConnect);
        socket.off("connect_error", handleConnectError);
      };

      socket.once("connect", handleConnect);
      socket.once("connect_error", handleConnectError);
      socket.connect();
    });
  }
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string>("");
  const [songsAvailable, setSongsAvailable] = useState<number | null>(null);

  const hasEnoughSongs =
    songsAvailable === null || songsAvailable >= MATCH_ROUNDS_TOTAL;

  useEffect(() => {
    let cancelled = false;

    async function loadAvailableSongs() {
      try {
        const count = await getAvailableSongCount();
        if (!cancelled) {
          setSongsAvailable(count);
        }
      } catch {
        if (!cancelled) {
          setSongsAvailable(null);
        }
      }
    }

    loadAvailableSongs();

    return () => {
      cancelled = true;
    };
  }, []);

  const disabledReason = useMemo(() => {
    if (!user) return "Login required";
    if (isCreating) return "Creating room...";
    if (songsAvailable !== null && !hasEnoughSongs) {
      return NOT_ENOUGH_SONGS_MESSAGE;
    }
    return "";
  }, [user, isCreating, songsAvailable, hasEnoughSongs]);

  async function createRoom() {
    if (!user || isCreating || !hasEnoughSongs) return;

    setIsCreating(true);
    setError("");

    try {
      const res = await getState();

      if (!res.ok) throw new Error("User already in game");

      await ensureEnoughSongsForMatch();
      await ensureSocketConnected();

      let matchId = "";
      const playerName = user.username ?? user.email ?? "Guest";

      await new Promise<void>((resolve, reject) => {
        const handleCreated = (payload: { matchId: string }) => {
          console.log("Event received: match:created", payload);
          if (payload.matchId) {
            matchId = payload.matchId;
            cleanup();
            resolve();
          }
        };

        const handleError = (payload: { message?: string }) => {
          console.error("Event received: match:error", payload);
          cleanup();
          reject(new Error(payload.message || "MATCH_CREATE_FAILED"));
        };

        const cleanup = () => {
          socket.off("match:created", handleCreated);
          socket.off("match:error", handleError);
        };

        socket.on("match:created", handleCreated);
        socket.on("match:error", handleError);

        socket.emit("match:create", {
          displayName: playerName,
          roundsTotal: 3,
        });
      });

      navigate(`/room/${matchId}`);
    } catch (error) {
      console.error("Error creating room:", error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsCreating(false);
    }
  }

  async function joinRoom() {
    if (!user || isCreating || !hasEnoughSongs) return;

    setIsCreating(true);
    setError("");

    try {
      const res = await getState();

      if (!res.ok) throw new Error("User already in game");

      await ensureEnoughSongsForMatch();

      navigate(`/join`);
    } catch (error) {
      console.error("Error joining room:", error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="container-page py-8 sm:py-10 lg:py-12 fade-in">
      <div className="mx-auto max-w-4xl flex flex-col gap-14">
        <div className="page-card">
          <div className="section-stack">
            <div className="space-y-3">
              <h1 className="page-title">Guess the song.</h1>

              <TypingText text="SONGUESS" size="md" className="ms-1" />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                className="btn-glow w-full sm:flex-1 p-10"
                style={{ "--btn-color": "#f7d046" } as React.CSSProperties}
                onMouseMove={handleMouseMoveToSetFillOrigin}
                onClick={createRoom}
                disabled={!user || isCreating || !hasEnoughSongs}
                title={disabledReason}
              >
                <span>{isCreating ? "Creating..." : "Create room"}</span>
              </button>

              <button
                type="button"
                className="btn-glow w-full sm:flex-1 p-10"
                style={{ "--btn-color": "#ede9db" } as React.CSSProperties}
                onMouseMove={handleMouseMoveToSetFillOrigin}
                onClick={joinRoom}
                disabled={!user || isCreating || !hasEnoughSongs}
                title={disabledReason}
              >
                <span>Join room</span>
              </button>
            </div>

            {(error || (songsAvailable !== null && !hasEnoughSongs)) && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200 nudge">
                <strong>{error || NOT_ENOUGH_SONGS_MESSAGE}</strong>
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300 transition-colors duration-200 hover:border-white/15 hover:bg-white/5">
              {loading ? (
                <span className="animate-pulse text-zinc-400">
                  Checking session…
                </span>
              ) : user ? (
                <span>
                  You’re signed in as{" "}
                  <span className="text-zinc-100">
                    {user.username ?? user.email}
                  </span>
                  . Go to{" "}
                  <Link className="link" to="/profile">
                    Profile
                  </Link>
                  .
                </span>
              ) : (
                <span>
                  You’re not signed in.{" "}
                  <Link className="link" to="/login">
                    Login
                  </Link>{" "}
                  to keep your session across refreshes.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <TypingText text="MADE BY" size="md" className="ms-1" />
          <div className="grid grid-cols-2 gap-3 sm:gap-5">
            <a
              href="https://github.com/pacomariano28"
              target="blank"
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300 transition-colors duration-200 hover:border-white/15 hover:bg-white/5 group"
            >
              <span>frmarian</span>
              <span className="transform transition-transform duration-200 ease-out group-hover:scale-125 motion-reduce:transform-none">
                <LinkIcon />
              </span>
            </a>

            <a
              href="https://github.com/seilanmoore"
              target="blank"
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300 transition-colors duration-200 hover:border-white/15 hover:bg-white/5 group"
            >
              <span>smoore-a</span>
              <span className="transform transition-transform duration-200 ease-out group-hover:scale-125 motion-reduce:transform-none">
                <LinkIcon />
              </span>
            </a>

            <a
              href="https://github.com/jortiz-m/jortiz-m"
              target="blank"
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300 transition-colors duration-200 hover:border-white/15 hover:bg-white/5 group"
            >
              <span>jortiz-m</span>
              <span className="transform transition-transform duration-200 ease-out group-hover:scale-125 motion-reduce:transform-none">
                <LinkIcon />
              </span>
            </a>

            <a
              href="https://github.com/svetameanssun"
              target="blank"
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300 transition-colors duration-200 hover:border-white/15 hover:bg-white/5 group"
            >
              <span>stitovsk</span>
              <span className="transform transition-transform duration-200 ease-out group-hover:scale-125 motion-reduce:transform-none">
                <LinkIcon />
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
