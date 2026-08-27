import React, { useEffect, useMemo, useRef, useState } from "react";
import { AuthContext, type AuthState } from "./auth-context";
import { getMe, refreshCookie, type AuthedUser } from "../api/auth";
import { markSessionValidated, resetSessionValidation } from "../api/http";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const loadSeqRef = useRef(0);
  const inFlightLoadRef = useRef<Promise<void> | null>(null);

  async function load(options?: { silent?: boolean; forceFetch?: boolean }) {
    if (inFlightLoadRef.current) {
      return inFlightLoadRef.current;
    }

    const seq = ++loadSeqRef.current;
    const silent = options?.silent ?? false;
    const forceFetch = options?.forceFetch ?? false;

    const run = async () => {
      if (!silent) setLoading(true);

      const isSpotifyRedirect = window.location.pathname.includes(
        "/auth/spotify/success",
      );
      const hasLoginFlag = localStorage.getItem("isLoggedIn") === "true";
      // If it is a regular guest on the Home page, we exit without calling the server (ZERO 401s)
      // But if we are redirected back from Spotify, the URL will match and the IF statement will allow us to validate the cookie
      if (!forceFetch && !hasLoginFlag && !isSpotifyRedirect) {
        if (seq === loadSeqRef.current) {
          setUser(null);
          if (!silent) setLoading(false);
        }
        return;
      }

      try {
        const u = await getMe();
        if (seq !== loadSeqRef.current) return;
        setUser(u);
        localStorage.setItem("isLoggedIn", "true");
        markSessionValidated();
      } catch {
        try {
          await refreshCookie();
          const u = await getMe();
          if (seq !== loadSeqRef.current) return;
          setUser(u);
          localStorage.setItem("isLoggedIn", "true");
          markSessionValidated();
        } catch {
          if (seq !== loadSeqRef.current) return;
          setUser(null);
          localStorage.removeItem("isLoggedIn");
          resetSessionValidation();
        }
      } finally {
        if (seq === loadSeqRef.current && !silent) {
          setLoading(false);
        }
      }
    };

    inFlightLoadRef.current = run();
    try {
      await inFlightLoadRef.current;
    } finally {
      inFlightLoadRef.current = null;
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
        resetSessionValidation();
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
