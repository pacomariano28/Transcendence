export type PlaylistResponse = {
  ok: boolean;
  songs?: PlaylistItem[];
  error?: string;
};

export type PlaylistFetchResult =
  | { ok: true; songs: PlaylistItem[] }
  | { ok: false; error: string };
