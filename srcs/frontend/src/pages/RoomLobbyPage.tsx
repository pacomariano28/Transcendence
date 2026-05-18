import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

function normalizeCode(raw: string) {
  return (raw ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
}

export default function RoomLobbyPage() {
  const nav = useNavigate();
  const { code: codeParam } = useParams();
  const { user } = useAuth();

  const code = useMemo(() => normalizeCode(codeParam ?? ""), [codeParam]);

  const players = useMemo(() => {
    const me = user
      ? { name: user.username ?? user.email, you: true }
      : { name: "Guest", you: true };

    // mock list
    return [{ name: "Host", you: false }, me, { name: "Player 3", you: false }];
  }, [user]);

  const [copied, setCopied] = useState(false);

  async function copyCode() {
    if (!code || copied) return;

    try {
      await navigator.clipboard.writeText(code);

      // reinicia y dispara la animación
      setCopied(false);
      requestAnimationFrame(() => setCopied(true));

      // bloquea el botón mientras dura la animación
      window.setTimeout(() => setCopied(false), 3800);
    } catch {
      // ignore
    }
  }

  function leave() {
    // cuando haya backend: call leave endpoint
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
              Waiting for players. Game starts when backend is ready.
            </p>
          </div>

          <Link className="btn-ghost" to="/">
            Back
          </Link>
        </div>

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
                title={
                  !code ? "No code" : copied ? "Copied" : "Copy to clipboard"
                }
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-xs text-zinc-400">
              Share the code with friends to join.
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <button
                className="btn-glow"
                style={{ "--btn-color": "#f7d046" } as React.CSSProperties}
                type="button"
                disabled
                title="Game not implemented yet"
              >
                <span>Start game</span>
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
                  {players.length} connected (mock)
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300">
                Lobby
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {players.map((p) => (
                <div
                  key={p.name}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4 transition duration-200 ease-out hover:border-white/20 hover:bg-white/[0.07]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-zinc-100">
                      {p.name}{" "}
                      {p.you ? (
                        <span className="text-zinc-500">(you)</span>
                      ) : null}
                    </div>
                    <div className="h-2 w-2 rounded-full bg-emerald-400/80" />
                  </div>
                  <div className="mt-2 text-xs text-zinc-500">
                    Ready state will appear here later.
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-zinc-400">
              Next integration: WebSocket presence + room state.
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-zinc-500">
          Try:{" "}
          <Link className="link" to={`/room/${code || "AB12CD"}`}>
            /room/{code || "AB12CD"}
          </Link>
        </div>
      </div>
    </div>
  );
}
