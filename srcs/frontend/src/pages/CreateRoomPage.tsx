import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { handleMouseMoveToSetFillOrigin } from "../utils/buttonHover";

export default function CreateRoomPage() {
  const { user } = useAuth();

  const [isPrivate, setIsPrivate] = useState(true);
  const [maxPlayers, setMaxPlayers] = useState(6);

  const disabledReason = useMemo(() => {
    if (!user) return "Login required";
    return "Rooms API not implemented yet";
  }, [user]);

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
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs font-medium text-zinc-400">Privacy</div>

              <button
                type="button"
                className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left
                           transition duration-150 ease-out hover:bg-white/10 hover:border-white/20 active:scale-[0.99]"
                onClick={() => setIsPrivate((v) => !v)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-200">
                    {isPrivate ? "Private room" : "Public room"}
                  </span>
                  <span
                    className={[
                      "text-xs px-2 py-1 rounded-lg border",
                      isPrivate
                        ? "border-indigo-400/30 bg-indigo-500/10 text-indigo-200"
                        : "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
                    ].join(" ")}
                  >
                    {isPrivate ? "Invite only" : "Open"}
                  </span>
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {isPrivate
                    ? "Players join using a code."
                    : "Visible to everyone (later)."}
                </div>
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs font-medium text-zinc-400">
                Max players
              </div>

              <div className="mt-3 flex items-center gap-3">
                <input
                  className="input"
                  type="number"
                  min={2}
                  max={12}
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                />
                <div className="text-xs text-zinc-500 w-24 text-right">
                  {maxPlayers} players
                </div>
              </div>

              <div className="mt-2 text-xs text-zinc-500">
                We’ll clamp this server-side once rooms exist.
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              className="btn-glow flex-1"
              style={{ "--btn-color": "#f7d046" } as React.CSSProperties}
              type="button"
              title={disabledReason}
              disabled={!user}
              onMouseMove={handleMouseMoveToSetFillOrigin}
            >
              <span>Create</span>
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
