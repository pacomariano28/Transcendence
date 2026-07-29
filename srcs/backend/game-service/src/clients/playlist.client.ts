import {
  PLAYLIST_SERVICE_URL,
  PLAYLIST_TIMEOUT_MS,
} from "../utils/constants.js";
import type {
  AvailableSongCountResponse,
  AvailableSongCountResult,
  EnsureSongResult,
  EnsureSongsResponse,
  PlaylistResponse,
  PlaylistFetchResult,
} from "../types/playlist.js";

export async function fetchAvailableSongCount(): Promise<AvailableSongCountResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PLAYLIST_TIMEOUT_MS);

  try {
    const response = await fetch(`${PLAYLIST_SERVICE_URL}/available-count`, {
      signal: controller.signal,
    });
    const payload = (await response.json()) as AvailableSongCountResponse;

    if (!response.ok || !payload.ok || payload.count === undefined) {
      return {
        ok: false,
        error: payload.error || "AVAILABLE_SONG_COUNT_FETCH_FAILED",
      };
    }

    return { ok: true, count: payload.count };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "AVAILABLE_SONG_COUNT_FETCH_FAILED",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchRandomSongs(
  count: number,
  excludeIsrcs: string[] = [],
): Promise<PlaylistFetchResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PLAYLIST_TIMEOUT_MS);

  try {
    const params = new URLSearchParams({ count: String(count) });
    if (excludeIsrcs.length > 0) {
      params.set("exclude", excludeIsrcs.join(","));
    }

    const response = await fetch(
      `${PLAYLIST_SERVICE_URL}/get-random-songs?${params.toString()}`,
      { signal: controller.signal },
    );
    const payload = (await response.json()) as PlaylistResponse;

    if (!response.ok || !payload.ok || !payload.songs) {
      return { ok: false, error: payload.error || "PLAYLIST_FETCH_FAILED" };
    }

    return { ok: true, songs: payload.songs };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "PLAYLIST_FETCH_FAILED",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchPlaylist(): Promise<PlaylistFetchResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PLAYLIST_TIMEOUT_MS);

  try {
    const response = await fetch(`${PLAYLIST_SERVICE_URL}/get-playlist`, {
      signal: controller.signal,
    });
    const payload = (await response.json()) as PlaylistResponse;

    if (!response.ok || !payload.ok || !payload.songs) {
      return { ok: false, error: payload.error || "PLAYLIST_FETCH_FAILED" };
    }

    return { ok: true, songs: payload.songs };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "PLAYLIST_FETCH_FAILED",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function ensureSongs(
  tracks: Array<{
    isrc: string;
    title?: string | null;
    artist?: string | null;
    spotifyTrackId?: string | null;
  }>,
): Promise<EnsureSongsResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PLAYLIST_TIMEOUT_MS);

  try {
    const response = await fetch(`${PLAYLIST_SERVICE_URL}/ensure-songs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tracks }),
      signal: controller.signal,
    });
    const payload = (await response.json()) as {
      ok?: boolean;
      results?: EnsureSongResult[];
      summary?: { ready: number; pending: number; failed: number };
      error?: string;
    };

    if (!response.ok || !payload.ok || !payload.results || !payload.summary) {
      return {
        ok: false,
        error: payload.error || "ENSURE_SONGS_FAILED",
      };
    }

    return {
      ok: true,
      results: payload.results,
      summary: payload.summary,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "ENSURE_SONGS_FAILED",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchSongsStatus(
  isrcs: string[],
): Promise<
  { ok: true; results: EnsureSongResult[] } | { ok: false; error: string }
> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PLAYLIST_TIMEOUT_MS);

  try {
    const params = new URLSearchParams({ isrcs: isrcs.join(",") });
    const response = await fetch(
      `${PLAYLIST_SERVICE_URL}/songs-status?${params.toString()}`,
      { signal: controller.signal },
    );
    const payload = (await response.json()) as {
      ok?: boolean;
      results?: EnsureSongResult[];
      error?: string;
    };

    if (!response.ok || !payload.ok || !payload.results) {
      return { ok: false, error: payload.error || "SONGS_STATUS_FAILED" };
    }

    return { ok: true, results: payload.results };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "SONGS_STATUS_FAILED",
    };
  } finally {
    clearTimeout(timeout);
  }
}
