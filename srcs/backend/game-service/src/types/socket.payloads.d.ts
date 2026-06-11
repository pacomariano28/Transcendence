export type CreateMatchPayload = {
  displayName?: string;
};

export type JoinMatchPayload = {
  matchId: string;
  displayName?: string;
};

export type MatchStatePayload = {
  matchId: string;
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

export type AudioTogglePayload = {
  matchId: string;
  action: "play" | "pause";
  time: number;
};

export type RoundLockPayload = {
  matchId: string;
  time: number;
};

export type RoundGuessPayload = {
  matchId: string;
  trackId: string;
};

export type RoundPreviewEndedPayload = {
  matchId: string;
  roundIndex: number;
};
