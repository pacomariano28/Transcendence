export type ScoreEntry = {
  userId: string;
  displayName: string;
  score: number;
};

export type LobbyPlaylistOption = {
  id: string;
  name: string;
  imageUrl: string | null;
  trackCount: number;
  ownerUserId: string;
  ownerDisplayName: string;
  kind?: "playlist" | "album";
};

export type SelectedLobbyPlaylist = {
  id: string;
  name: string;
  ownerUserId: string;
  ownerDisplayName: string;
  imageUrl?: string | null;
  kind?: "playlist" | "album";
};

export type PlaylistPrepStatus = "idle" | "loading" | "ready" | "error";

export type MatchStatePayload = {
  matchId: string;
  roundsTotal: number;
  phase: "lobby" | "countdown" | "in-game" | "finished";
  hostUserId?: string;
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
  availablePlaylists?: LobbyPlaylistOption[];
  selectedPlaylist?: SelectedLobbyPlaylist | null;
  playlistPrepStatus?: PlaylistPrepStatus;
  playlistPrepReady?: number;
  playlistPrepNeeded?: number;
  playlistPrepError?: string | null;
};

export type MatchPhasePayload = {
  matchId: string;
  phase: MatchStatePayload["phase"];
  previousPhase?: MatchStatePayload["phase"];
  reason?: string;
};

export type RoomLobbyLocationState = {
  createdMatch?: MatchStatePayload;
  fromRematch?: boolean;
};

export type RematchPayload = {
  previousMatchId: string;
  matchId: string;
  roundsTotal: number;
  phase: MatchStatePayload["phase"];
  players: MatchStatePayload["players"];
  hostUserId?: string;
};
