import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../auth/auth-context";

export default function SpotifySuccessPage() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        localStorage.setItem("isLoggedIn", "true");
        nav("/profile", { replace: true });
      } else {
        localStorage.removeItem("isLoggedIn");
        nav("/login", { replace: true });
      }
    }
  }, [user, loading, nav]);

  return (
    <div className="min-h-screen grid place-items-center text-zinc-400 bg-zinc-950">
      <div style={{ padding: 24 }}>{t("auth.completing_spotify_login")}</div>
    </div>
  );
}
