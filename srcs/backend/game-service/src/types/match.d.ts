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

  export type CatalogSourceKind = "playlist" | "album";

  export type LobbyPlaylistOption = {
    id: string;
    name: string;
    imageUrl: string | null;
    trackCount: number;
    ownerUserId: string;
    ownerDisplayName: string;
    kind?: CatalogSourceKind;
  };

  export type SelectedLobbyPlaylist = {
    id: string;
    name: string;
    ownerUserId: string;
    ownerDisplayName: string;
    imageUrl?: string | null;
    kind?: CatalogSourceKind;
  };

  export type PlaylistPrepStatus =
    | "idle"
    | "loading"
    | "ready"
    | "error";

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
    hostUserId: string;
    players: MatchPlayer[];
    roundsTotal: number;
    roundIndex: number;
    scores: ScoreEntry[];
    playlist: PlaylistItem[];
    playlistError: string | null;
    availablePlaylists: LobbyPlaylistOption[];
    selectedPlaylist: SelectedLobbyPlaylist | null;
    playlistPrepStatus: PlaylistPrepStatus;
    playlistPrepReady: number;
    playlistPrepNeeded: number;
    playlistPrepError: string | null;
    /** Base songs resolved for the selected Spotify playlist (before metadata enrich). */
    preparedSongs: Array<{ isrc: string; fileName: string }>;
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
