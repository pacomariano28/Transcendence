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

export type EnsureSongResult = {
  isrc: string;
  status: "ready" | "pending" | "failed";
  fileName: string | null;
  failReason: string | null;
  mediaPlayable?: boolean;
};

export type EnsureSongsResponse =
  | {
      ok: true;
      results: EnsureSongResult[];
      summary: { ready: number; pending: number; failed: number };
    }
  | { ok: false; error: string };
