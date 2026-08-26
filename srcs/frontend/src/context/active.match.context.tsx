import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "../auth/auth-context";
import { registerMatchCooldownSocketHandlers } from "../utils/matchCooldown";

type ActiveMatch = {
  code: string;
  roundLabel?: string;
};

type ActiveMatchContextType = {
  activeMatch: ActiveMatch | null;
  setActiveMatch: (match: ActiveMatch | null) => void;
};

const ActiveMatchContext = createContext<ActiveMatchContextType | undefined>(
  undefined,
);

export function ActiveMatchProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeMatch, setActiveMatch] = useState<ActiveMatch | null>(null);
  const { user } = useAuth();
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    userIdRef.current = user ? String(user.id) : null;
  }, [user]);

  useEffect(() => {
    return registerMatchCooldownSocketHandlers(() => userIdRef.current);
  }, []);

  return (
    <ActiveMatchContext.Provider value={{ activeMatch, setActiveMatch }}>
      {children}
    </ActiveMatchContext.Provider>
  );
}

// The provider and its access hook intentionally share this context module.
// eslint-disable-next-line react-refresh/only-export-components
export function useActiveMatch() {
  const context = useContext(ActiveMatchContext);
  if (!context) {
    throw new Error(
      "useActiveMatch debe usarse dentro de un ActiveMatchProvider",
    );
  }
  return context;
}
