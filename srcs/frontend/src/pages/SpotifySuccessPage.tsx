import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/auth-context";
import {
  clearAuthReturnTo,
  resolveReturnTo,
} from "../auth/returnTo";

export default function SpotifySuccessPage() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        localStorage.setItem("isLoggedIn", "true");
        const destination = resolveReturnTo(searchParams.get("returnTo"));
        clearAuthReturnTo();
        nav(destination, { replace: true });
      } else {
        localStorage.removeItem("isLoggedIn");
        nav("/login", { replace: true });
      }
    }
  }, [user, loading, nav, searchParams]);

  return (
    <div className="min-h-screen grid place-items-center text-zinc-400 bg-zinc-950">
      <div style={{ padding: 24 }}>{t("auth.completing_spotify_login")}</div>
    </div>
  );
}
