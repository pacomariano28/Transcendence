import {
  PLAYLIST_SERVICE_URL,
  PLAYLIST_TIMEOUT_MS,
} from "../services/constants.js";
import { PlaylistResponse, PlaylistFetchResult } from "../types/playlist.js";

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
