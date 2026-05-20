import { createContext, useContext } from "react";
import type { AuthedUser } from "../api/auth";

export type AuthState = {
  user: AuthedUser | null;
  loading: boolean;
  reload: () => Promise<void>;
  clear: () => void;
};

export const AuthContext = createContext<AuthState | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
