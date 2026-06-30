import React, { useEffect, useMemo, useState } from "react";
import { AuthContext, type AuthState } from "./auth-context";
import { getMe, refreshCookie, type AuthedUser } from "../api/auth";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthedUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);

    const isSpotifyRedirect = window.location.pathname.includes(
      "/auth/spotify/success",
    );
    const hasLoginFlag = localStorage.getItem("isLoggedIn") === "true";

    // 🟢 Si es un invitado común en el Home, salimos corriendo sin llamar al servidor (CERO 401s)
    // 🟢 Pero si venimos rebotados de Spotify, la URL coincidirá y el IF nos dejará pasar a validar la cookie
    if (!hasLoginFlag && !isSpotifyRedirect) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const u = await getMe();
      setUser(u);
      localStorage.setItem("isLoggedIn", "true"); // Aseguramos el flag tras el éxito
    } catch {
      try {
        await refreshCookie();
        const u = await getMe();
        setUser(u);
        localStorage.setItem("isLoggedIn", "true");
      } catch {
        setUser(null);
        localStorage.removeItem("isLoggedIn");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      reload: load,
      clear: () => {
        setUser(null);
        localStorage.removeItem("isLoggedIn");
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
