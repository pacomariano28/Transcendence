export type MatchStatePayload = {
  matchId: string;
  expectedPlayers: number;
  roundsTotal: number;
  phase: MatchState["phase"];
  players: Array<{
    userId: string;
    displayName: string;
    ready: boolean;
    connected: boolean;
    disconnectedAt: string | null;
  }>;
};

export type MatchPhasePayload = {
  matchId: string;
  phase: MatchPhasePayload["phase"];
  previousPhase?: MatchStatePayload["phase"];
  reason?: string;
};

export type RoomLobbyLocationState = {
  createdMatch?: MatchStatePayload;
};
