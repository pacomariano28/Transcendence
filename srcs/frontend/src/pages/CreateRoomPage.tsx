import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/auth-context";
import { socket } from "../api/socket";
import { handleMouseMoveToSetFillOrigin } from "../utils/buttonHover";
// import { generateMatchCode } from "../api/lobby";

// function generateRoomCode() {
//   const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
//   let code = "";

//   for (let index = 0; index < 6; index += 1) {
//     code += alphabet[Math.floor(Math.random() * alphabet.length)];
//   }

//   return code;
// }

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

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [roundsTotal, setRoundsTotal] = useState(3);
  const [isCreating, setIsCreating] = useState(false);

  const clampToRange = (value: number, min: number, max: number) =>
    Math.min(max, Math.max(min, value));

  const disabledReason = useMemo(() => {
    if (!user) return "Login required";
    return "";
  }, [user]);

  async function createRoom() {
    if (!user || isCreating) {
      return;
    }

    setIsCreating(true);

    try {
      await ensureSocketConnected();

      let matchId: string = "";
      const playerName = user.username ?? user.email;

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
          matchId,
          displayName: playerName,
          expectedPlayers: 5,
          roundsTotal,
        });
      });

      navigate(`/room/${matchId}`);
    } catch (error) {
      console.error("Error creating room:", error);
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="container-page py-10 fade-in">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Create room
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Configure your lobby. Creation will be enabled when backend rooms
              exist.
            </p>
          </div>

          <Link className="btn-ghost" to="/">
            Back
          </Link>
        </div>

        <div className="card p-6">
          <div className="flex justify-center">
            <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs font-medium text-zinc-400">
                Number of rounds
              </div>

              <div className="mt-3 flex items-center gap-3">
                <input
                  className="input"
                  type="number"
                  min={1}
                  max={5}
                  value={roundsTotal}
                  onChange={(e) =>
                    setRoundsTotal(clampToRange(Number(e.target.value), 1, 5))
                  }
                />
                <div className="text-xs text-zinc-500 w-24 text-right">
                  {roundsTotal} rounds
                </div>
              </div>

              <div className="mt-2 text-xs text-zinc-500">
                Shorter matches keep the pace fast.
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              className="btn-glow flex-1"
              style={{ "--btn-color": "#f7d046" } as React.CSSProperties}
              type="button"
              title={disabledReason}
              disabled={!user || isCreating}
              onClick={createRoom}
              onMouseMove={handleMouseMoveToSetFillOrigin}
            >
              <span>{isCreating ? "Creating..." : "Create"}</span>
            </button>
            <Link className="btn-ghost flex-1" to="/join">
              I have a code
            </Link>
          </div>

          {!user && (
            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-100 fade-in">
              You need to login to create rooms.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
