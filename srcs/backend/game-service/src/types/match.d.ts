declare global {
  export type MatchPhase = "lobby" | "countdown";

  export type MatchPlayer = {
    socketId: string;
    playerId: string;
    playerName: string;
    ready: boolean;
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
    playerId: string;
    playerName: string;
    expectedPlayers: number;
  };

  export type JoinMatchInput = {
    matchId: string;
    socketId: string;
    playerId: string;
    playerName: string;
  };

  export type ReadyResult = {
    match: MatchState;
    countdownStarted: boolean;
  };
}

export {};
