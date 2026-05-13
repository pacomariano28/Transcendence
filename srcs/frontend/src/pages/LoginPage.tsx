import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login, register } from "../api/auth";
import { useAuth } from "../auth/AuthContext";
import { loginSchema, registerSchema } from "../validation/authSchemas";

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
    } catch (err: any) {
      setError(err?.message ?? "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-page py-10">
      <div className="mx-auto grid w-full max-w-4xl gap-6 md:grid-cols-2">
        <section className="fade-in">
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            {title}
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Minimal login UI to validate{" "}
            <span className="text-zinc-200">auth-service</span>.
          </p>

          <div className="mt-6 card card-hover p-5">
            <button
              className="btn-ghost w-full"
              onClick={loginWithSpotify}
              type="button"
            >
              Continue with Spotify
            </button>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-zinc-500">or</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form className="space-y-3" onSubmit={onSubmit}>
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
                className="btn-primary w-full"
                disabled={submitting}
                type="submit"
              >
                {submitting
                  ? "Working…"
                  : mode === "login"
                    ? "Login"
                    : "Create account"}
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
