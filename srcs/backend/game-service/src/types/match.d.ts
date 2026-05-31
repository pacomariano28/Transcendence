declare global {
  export type MatchPhase = "lobby" | "countdown" | "in-game" | "finished";

  export type RoundPhase =
    | "sync"
    | "countdown"
    | "playing"
    | "locked"
    | "guessing"
    | "resolution-win"
    | "resolution-fail";

  export type PlaylistItem = {
    trackId: string;
    fileName: string;
  };

  export type RoundState = {
    roundIndex: number;
    phase: RoundPhase;
    preview: PlaylistItem | null;
    readyUserIds: string[];
    lockOwnerId: string | null;
    lockAt: number | null;
    guessEndsAt: number | null;
    countdownEndsAt: number | null;
  };

  export type ScoreEntry = {
    userId: string;
    displayName: string;
    score: number;
  };

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
    roundsTotal: number;
    roundIndex: number;
    scores: ScoreEntry[];
    playlist: PlaylistItem[];
    playlistError: string | null;
    round: RoundState | null;
  };

  export type CreateMatchInput = {
    matchId?: string;
    socketId: string;
    userId: string;
    displayName: string;
    expectedPlayers: number;
    roundsTotal?: number;
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
