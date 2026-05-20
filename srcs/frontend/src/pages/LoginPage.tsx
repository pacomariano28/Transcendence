import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register } from "../api/auth";
import { useAuth } from "../auth/auth-context";
import { loginSchema, registerSchema } from "../validation/authSchemas";
import { handleMouseMoveToSetFillOrigin } from "../utils/buttonHover";
import SpotifyIcon from "../components/icons/SpotifyIcon";
import TypingText from "../components/TypingText";

export default function LoginPage() {
  const nav = useNavigate();
  const { reload } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const title = useMemo(
    () => (mode === "login" ? "Welcome back" : "Create account"),
    [mode],
  );

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function loginWithSpotify() {
    window.location.href = "/api/auth/spotify/login";
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const parsed =
      mode === "login"
        ? loginSchema.safeParse({ email, password })
        : registerSchema.safeParse({ email, username, password });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      setError(firstIssue?.message ?? "Invalid input");
      setSubmitting(false);
      return;
    }

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, username, password);
        await login(email, password);
      }

      await reload();
      nav("/dashboard", { replace: true });
    } catch (err: unknown) {
      const message: string =
        err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-page py-8 sm:py-10 lg:py-12">
      <div className="mx-auto grid w-full max-w-3xl gap-6 lg:max-w-4xl lg:grid-cols-2">
        <section className="fade-in">
          <div className="max-w-xl">
            <h1 key={mode} className="page-title pop-in">
              {title}
            </h1>

            <div className="pb-1 font-mono text-xs sm:text-sm tracking-[0.35em] text-[#f7d046] mb-3">
              <TypingText
                text="SONGUESS"
                className="drop-shadow-[0_0_14px_rgba(247,208,70,0.16)]"
                typingDelays={[220, 300, 180, 260, 200, 340, 170, 280]}
                typoChance={0.22}
                pauseAfterCompleteMs={2200}
                pauseAfterDeleteMs={700}
                cursorBlinkMs={550}
              />
            </div>
          </div>
        </section>

        <section className="fade-in">
          <div className="page-card">
            <button
              className="btn-glow w-full"
              style={{ "--btn-color": "#1DB954" } as React.CSSProperties}
              onClick={loginWithSpotify}
              type="button"
              onMouseMove={handleMouseMoveToSetFillOrigin}
            >
              <span className="flex items-center gap-2">
                Continue with
                <SpotifyIcon className="h-6 w-6" />
              </span>
            </button>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-zinc-500">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form className="space-y-4" onSubmit={onSubmit}>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-zinc-400">
                  Email
                </span>
                <input
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </label>

              {mode === "register" && (
                <label className="block pop-in">
                  <span className="mb-1 block text-xs font-medium text-zinc-400">
                    Username
                  </span>
                  <input
                    className="input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="paco"
                    autoComplete="username"
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-zinc-400">
                  Password
                </span>
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                />
              </label>

              {error && (
                <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200 nudge">
                  {error}
                </div>
              )}

              <button
                className="btn-glow w-full"
                style={{ "--btn-color": "#f7d046" } as React.CSSProperties}
                disabled={submitting}
                type="submit"
                onMouseMove={handleMouseMoveToSetFillOrigin}
              >
                <span>
                  {submitting
                    ? "Working…"
                    : mode === "login"
                      ? "Login"
                      : "Create account"}
                </span>
              </button>

              <button
                className="btn-ghost w-full"
                type="button"
                onClick={() =>
                  setMode((m) => (m === "login" ? "register" : "login"))
                }
              >
                {mode === "login"
                  ? "Create an account"
                  : "I already have an account"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
