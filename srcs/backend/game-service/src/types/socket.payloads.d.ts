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
  hostUserId: string;
  players: Array<{
    userId: string;
    displayName: string;
    ready: boolean;
    connected: boolean;
    disconnectedAt: string | null;
  }>;
  availablePlaylists: LobbyPlaylistOption[];
  selectedPlaylist: SelectedLobbyPlaylist | null;
  playlistPrepStatus: PlaylistPrepStatus;
  playlistPrepReady: number;
  playlistPrepNeeded: number;
  playlistPrepError: string | null;
};

export type SharePlaylistsPayload = {
  playlists: Array<{
    id: string;
    name: string;
    imageUrl?: string | null;
    trackCount?: number;
  }>;
};

export type SelectPlaylistPayload = {
  playlistId: string;
  ownerUserId: string;
  name?: string;
  imageUrl?: string | null;
  ownerDisplayName?: string;
  kind?: "playlist" | "album";
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
  isrc: string;
  track: string;
  artist: string;
};

export type RoundGuessTypingPayload = {
  matchId?: string;
  text: string;
};

export type RoundGuessTypingBroadcast = {
  matchId: string;
  roundIndex: number;
  text: string;
};

export type GuessSelectedTrack = {
  isrc: string;
  track: string;
  artist: string;
  imageUrl?: string | null;
  spotifyUrl?: string | null;
};

export type RoundPreviewEndedPayload = {
  matchId: string;
  roundIndex: number;
};

export type RoundSkipPayload = {
  matchId: string;
};

export type RoundSkipUpdatePayload = {
  matchId: string;
  roundIndex: number;
  skipUserIds: string[];
};

export type RoundSkipCompletePayload = {
  matchId: string;
  roundIndex: number;
};

export type RematchPayload = {
  previousMatchId: string;
  matchId: string;
  roundsTotal: number;
  phase: MatchStatePayload["phase"];
  players: MatchStatePayload["players"];
};
