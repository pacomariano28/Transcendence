import {
  PLAYLIST_SERVICE_URL,
  PLAYLIST_TIMEOUT_MS,
} from "../utils/constants.js";
import {
  AvailableSongCountResponse,
  AvailableSongCountResult,
  PlaylistResponse,
  PlaylistFetchResult,
} from "../types/playlist.js";

export async function fetchAvailableSongCount(): Promise<AvailableSongCountResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PLAYLIST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${PLAYLIST_SERVICE_URL}/available-count`,
      {
        signal: controller.signal,
      },
    );
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
