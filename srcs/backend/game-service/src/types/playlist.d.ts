export type PlaylistResponse = {
  ok: boolean;
  songs?: PlaylistItem[];
  error?: string;
};

export type PlaylistFetchResult =
  | { ok: true; songs: PlaylistItem[] }
  | { ok: false; error: string };

export type AvailableSongCountResponse = {
  ok: boolean;
  count?: number;
  error?: string;
};

export type AvailableSongCountResult =
  | { ok: true; count: number }
  | { ok: false; error: string };
