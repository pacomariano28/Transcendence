import { createContext, useContext } from "react";
import { type AuthedUser } from "../api/auth";

export type AuthState = {
  user: AuthedUser | null;
  loading: boolean;
  // 🟢 Add optional parameters to control how to renew the session
  reload: (options?: {
    silent?: boolean;
    forceFetch?: boolean;
  }) => Promise<void>;
  clear: () => void;
};

export const AuthContext = createContext<AuthState | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
