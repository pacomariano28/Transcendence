import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/auth-context";

export default function SpotifySuccessPage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    // 🟢 Cuando la validación automática de la app termine...
    if (!loading) {
      if (user) {
        // Guardamos el flag para futuros F5 y entramos
        localStorage.setItem("isLoggedIn", "true");
        nav("/profile", { replace: true });
      } else {
        // Si la cookie falló por lo que sea, limpieza y al login
        localStorage.removeItem("isLoggedIn");
        nav("/login", { replace: true });
      }
    }
  }, [user, loading, nav]);

  return (
    <div className="min-h-screen grid place-items-center text-zinc-400 bg-zinc-950">
      <div style={{ padding: 24 }}>Completing login with Spotify...</div>
    </div>
  );
}
