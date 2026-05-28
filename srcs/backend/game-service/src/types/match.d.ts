declare global {
  export type MatchPhase = "lobby" | "countdown" | "in-game" | "finished";

  export type MatchPlayer = {
    socketId: string | null;
    userId: string;
    displayName: string;
    ready: boolean;
    connected: boolean;
    disconnectedAt: string | null;
  };

  export type MatchState = {
    matchId: string;
    expectedPlayers: number;
    phase: MatchPhase;
    players: MatchPlayer[];
  };

  export type CreateMatchInput = {
    matchId?: string;
    socketId: string;
    userId: string;
    displayName: string;
    expectedPlayers: number;
  };

  export type JoinMatchInput = {
    matchId: string;
    socketId: string;
    userId: string;
    displayName: string;
  };

  export type ReadyResult = {
    match: MatchState;
    countdownStarted: boolean;
  };
}

export {};
