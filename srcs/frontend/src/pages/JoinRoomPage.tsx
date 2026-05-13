import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

function normalizeCode(raw: string) {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export default function JoinRoomPage() {
  const [code, setCode] = useState("");
  const [touched, setTouched] = useState(false);

  const normalized = useMemo(() => normalizeCode(code), [code]);
  const isValid = normalized.length >= 4 && normalized.length <= 8;

  const disabledReason = "Rooms API not implemented yet";

  async function pasteFromClipboard() {
    try {
      const t = await navigator.clipboard.readText();
      setCode(normalizeCode(t).slice(0, 8));
      setTouched(true);
    } catch {
      // ignore: clipboard permissions
    }
  }

  const nav = useNavigate();

  function onJoin() {
    setTouched(true);
    if (!isValid) return;
    nav(`/room/${normalized}`);
  }

  return (
    <div className="container-page py-10 fade-in">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Join room
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Enter a code to join a private room.
            </p>
          </div>

          <Link className="btn-ghost" to="/">
            Back
          </Link>
        </div>

        <div className="card p-6">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-medium text-zinc-400">Room code</div>
              <button
                type="button"
                className="btn-ghost px-3 py-1.5 text-xs"
                onClick={pasteFromClipboard}
              >
                Paste
              </button>
            </div>

            <input
              className={[
                "input mt-3 font-mono tracking-widest",
                touched && !isValid
                  ? "ring-2 ring-rose-500/20 border-rose-500/30"
                  : "",
              ].join(" ")}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="AB12CD"
              maxLength={16}
              onBlur={() => setTouched(true)}
            />

            <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
              <span>
                {touched && !isValid ? (
                  <span className="text-rose-200 nudge">
                    Code must be 4–8 chars (A–Z, 0–9).
                  </span>
                ) : (
                  <span>Use 4–8 characters.</span>
                )}
              </span>
              <span>{normalized.length}/8</span>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              className="btn-primary flex-1"
              type="button"
              onClick={onJoin}
              title={disabledReason}
            >
              Join
            </button>

            <Link className="btn-ghost flex-1" to="/create">
              Create instead
            </Link>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-zinc-400">
            Tip: we’ll auto-normalize to{" "}
            <span className="text-zinc-200">UPPERCASE</span>.
          </div>
        </div>
      </div>
    </div>
  );
}
