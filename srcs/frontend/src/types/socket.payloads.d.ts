export type ScoreEntry = {
  userId: string;
  displayName: string;
  score: number;
};

export type MatchStatePayload = {
  matchId: string;
  roundsTotal: number;
  phase: "lobby" | "countdown" | "in-game" | "finished";
  players: Array<{
    userId: string;
    displayName: string;
    ready: boolean;
    connected: boolean;
    disconnectedAt: string | null;
    score?: number;
    totalScore?: number;
  }>;
  scores?: ScoreEntry[] | Record<string, number>;
};

export type MatchPhasePayload = {
  matchId: string;
  phase: MatchStatePayload["phase"];
  previousPhase?: MatchStatePayload["phase"];
  reason?: string;
};

export type RoomLobbyLocationState = {
  createdMatch?: MatchStatePayload;
};
