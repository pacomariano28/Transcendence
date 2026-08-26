import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { login, register } from "../api/auth";
import { useAuth } from "../auth/auth-context";
import { loginSchema, registerSchema } from "../validation/authSchemas";
import { handleMouseMoveToSetFillOrigin } from "../utils/buttonHover";
import SpotifyIcon from "../components/icons/SpotifyIcon";
import TypingText from "../components/TypingText";
import {
  clearAuthReturnTo,
  resolveReturnTo,
  storeAuthReturnTo,
} from "../auth/returnTo";

export default function LoginPage() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { reload, user, loading } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const title = useMemo(
    () =>
      mode === "login" ? t("auth.welcome_back") : t("auth.create_account"),
    [mode, t],
  );

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spotifyCancelledMessage, setSpotifyCancelledMessage] = useState<
    string | null
  >(null);

  useEffect(() => {
    const fromUrl = searchParams.get("returnTo");
    if (fromUrl) {
      storeAuthReturnTo(fromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("spotify") !== "cancelled") return;

    setSpotifyCancelledMessage(t("auth.errors.spotify_cancelled"));
    const returnTo = searchParams.get("returnTo");
    setSearchParams(returnTo ? { returnTo } : {}, { replace: true });
  }, [searchParams, setSearchParams, t]);

  const redirectAfterAuth = useCallback(() => {
    const destination = resolveReturnTo(searchParams.get("returnTo"));
    clearAuthReturnTo();
    nav(destination, { replace: true });
  }, [nav, searchParams]);

  useEffect(() => {
    if (loading || !user || submitting) return;
    redirectAfterAuth();
  }, [loading, user, submitting, redirectAfterAuth]);

  function loginWithSpotify() {
    const destination = resolveReturnTo(searchParams.get("returnTo"));
    storeAuthReturnTo(destination);

    const url = new URL("/api/auth/spotify/login", window.location.origin);
    url.searchParams.set("returnTo", destination);
    window.location.href = url.toString();
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
      setError(firstIssue?.message ?? "validation.unknown_error");
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

      await reload({ forceFetch: true });
      redirectAfterAuth();
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
        <section>
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

        <section>
          <div className="page-card">
            {spotifyCancelledMessage && (
              <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-200 nudge">
                {spotifyCancelledMessage}
              </div>
            )}

            <button
              className="btn-glow w-full"
              style={{ "--btn-color": "#1DB954" } as React.CSSProperties}
              onClick={loginWithSpotify}
              type="button"
              onMouseMove={handleMouseMoveToSetFillOrigin}
            >
              <span className="flex items-center gap-2">
                {t("auth.continue_with")}
                <SpotifyIcon className="h-6 w-6" />
              </span>
            </button>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-zinc-500">{t("auth.or")}</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <form className="space-y-4" onSubmit={onSubmit}>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-zinc-400">
                  {t("auth.email")}
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
                    {t("auth.username")}
                  </span>
                  <input
                    className="input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="lana"
                    autoComplete="username"
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-1 block text-xs font-medium text-zinc-400">
                  {t("auth.password")}
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
                  {t(
                    error.startsWith("validation.")
                      ? error
                      : `auth.errors.${error}`,
                    error,
                  )}
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
                    ? t("auth.working")
                    : mode === "login"
                      ? t("auth.login")
                      : t("auth.create_account")}
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
                  ? t("auth.create_an_account_switch")
                  : t("auth.already_have_account")}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
