import React, { createContext, useContext, useState } from "react";

type ActiveMatch = {
  code: string;
  roundLabel?: string; // Opcional, por si quieres pasar el "Round 1 / 5" al header
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

  return (
    <ActiveMatchContext.Provider value={{ activeMatch, setActiveMatch }}>
      {children}
    </ActiveMatchContext.Provider>
  );
}

export function useActiveMatch() {
  const context = useContext(ActiveMatchContext);
  if (!context) {
    throw new Error(
      "useActiveMatch debe usarse dentro de un ActiveMatchProvider",
    );
  }
  return context;
}
