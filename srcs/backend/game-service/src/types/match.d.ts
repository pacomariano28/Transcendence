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
    isrc: string;
    fileName: string;
    track?: string;
    artist?: string;
    imageUrl?: string | null;
    spotifyUrl?: string | null;
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
    phase: MatchPhase;
    players: MatchPlayer[];
    roundsTotal: number;
    roundIndex: number;
    scores: ScoreEntry[];
    playlist: PlaylistItem[];
    playlistError: string | null;
    round: RoundState | null;
    /** Set when a rematch lobby was created from this finished match. */
    rematchTargetId: string | null;
  };

  export type RematchResult = {
    oldMatchId: string;
    newMatch: MatchState;
    alreadyExisted: boolean;
  };

  export type RematchRequestInput = {
    socketId: string;
    userId: string;
    displayName: string;
  };

  export type CreateMatchInput = {
    matchId?: string;
    socketId: string;
    userId: string;
    displayName: string;
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

  export type EmitMatchEvent = (
    matchId: string,
    event: string,
    data: unknown,
  ) => void;
}

export {};
