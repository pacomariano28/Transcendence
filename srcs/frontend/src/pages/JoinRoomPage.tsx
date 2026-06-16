import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { handleMouseMoveToSetFillOrigin } from "../utils/buttonHover";
import { useAuth } from "../auth/auth-context";
import TypingText from "../components/TypingText";
import { getMatchState } from "../api/state";
import type { MatchStatePayload } from "../types/socket.payloads";

function normalizeCode(raw: string) {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export default function JoinRoomPage() {
  const [code, setCode] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalized = useMemo(() => normalizeCode(code), [code]);
  const isValid = normalized.length >= 4 && normalized.length <= 8;

  const { user } = useAuth();

  const disabledReason = useMemo(() => {
    if (!user) return "Login required";
    return "";
  }, [user]);

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

  async function onJoin() {
    setTouched(true);
    if (!isValid || disabledReason) return;

    try {
      const match: MatchStatePayload = await getMatchState({
        matchId: normalized,
      });

      console.log(JSON.stringify(match));

      if (match.phase === "finished") throw new Error("match finished");
      nav(`/room/${normalized}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      setError(message);
    }
  }

  return (
    <div className="container-page py-10 fade-in mt-5">
      <div className="mx-auto max-w-3xl">
        <div>
          {/* INDICADOR SUPERIOR CON TYPING EFFECT */}
          <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
            <TypingText text="LOBBY PAGE" size="md" />
          </div>

          {/* CÓDIGO EN TIEMPO REAL (ESTILO LOBBY) */}
          <div className="mt-3 font-mono text-4xl font-semibold tracking-[0.35em] text-zinc-500 sm:text-5xl uppercase">
            {normalized || "———"}
          </div>

          {/* CONTROL DE ERRORES/LOGIN */}
          {disabledReason && (
            <div className="mt-4 rounded-lg border border-rose-500/50 bg-rose-500/10 p-4 text-rose-200 text-sm animate-fade-in">
              {disabledReason}
            </div>
          )}

          {/* PANEL DE CREDENCIALES (ESTILO PAGE-CARD DEL LOBBY) */}
          <div className="mt-8 page-card">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
                Room credentials
              </div>
              <button
                type="button"
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300 transition hover:bg-white/10"
                onClick={pasteFromClipboard}
              >
                Paste
              </button>
            </div>

            <div className="mt-4">
              <input
                autoFocus
                className={[
                  "lock-input input w-full text-center uppercase font-mono tracking-[0.25em] text-xl py-4 transition-all duration-300",
                  touched && !isValid
                    ? "border-rose-500/50 bg-rose-500/10 text-rose-200 focus:border-rose-500"
                    : "border-white/10 bg-black/20 text-white",
                ].join(" ")}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="AB12CD"
                maxLength={16}
                onBlur={() => setTouched(true)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  onJoin();
                }}
              />
            </div>

            {/* ERROR INLINE DE VALIDACIÓN */}
            <div className="mt-3 flex items-center justify-between text-xs font-mono text-zinc-500">
              <div className="relative h-4 flex-1">
                {touched && !isValid ? (
                  <span className="absolute left-0 text-rose-400 animate-fade-in font-sans tracking-wide">
                    Code must be 4–8 chars (A–Z, 0–9).
                  </span>
                ) : (
                  <span className="absolute left-0 text-zinc-500 font-sans tracking-wide">
                    Use 4–8 characters.
                  </span>
                )}
              </div>
              <span className="shrink-0">{normalized.length}/8</span>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 mt-3 text-sm text-rose-200 nudge">
              <strong>{error}</strong>
            </div>
          )}

          {/* FILA DE BOTONES ASIMÉTRICA (ESTILO LOBBY JUEGO) */}
          <div className="mt-6 flex gap-3 sm:flex-row">
            <button
              className="btn-glow flex-5 p-4 transition-all duration-500"
              style={{ "--btn-color": "#f7d046" } as React.CSSProperties}
              type="button"
              disabled={!isValid || !!disabledReason}
              onClick={onJoin}
              title={disabledReason}
              onMouseMove={handleMouseMoveToSetFillOrigin}
            >
              <span>Join room</span>
            </button>

            <Link
              className="btn-ghost flex-1 flex items-center justify-center p-4 text-center"
              to="/"
            >
              Back
            </Link>
          </div>

          {/* COMENTARIO INFERIOR LIMPIO */}
          <div className="mt-8 text-center text-xs text-zinc-500 font-sans">
            Tip: we’ll auto-normalize to{" "}
            <span className="text-zinc-400 font-mono">UPPERCASE</span>.
          </div>
        </div>
      </div>
    </div>
  );
}
