import { PLAYLIST_SERVICE_URL, PLAYLIST_TIMEOUT_MS } from "./constants.js";

type PlaylistResponse = {
  ok: boolean;
  songs?: PlaylistItem[];
  error?: string;
};

export async function loadPlaylist(match: MatchState): Promise<void> {
  if (match.playlist.length > 0 || match.playlistError) {
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PLAYLIST_TIMEOUT_MS);

  try {
    const response = await fetch(`${PLAYLIST_SERVICE_URL}/get-playlist`, {
      signal: controller.signal,
    });
    const payload = (await response.json()) as PlaylistResponse;

    if (!response.ok || !payload.ok || !payload.songs) {
      match.playlistError = payload.error || "PLAYLIST_FETCH_FAILED";
      return;
    }

    match.playlist = payload.songs;
    match.roundsTotal = Math.min(match.roundsTotal, match.playlist.length);
  } catch (error) {
    match.playlistError =
      error instanceof Error ? error.message : "PLAYLIST_FETCH_FAILED";
  } finally {
    clearTimeout(timeout);
  }
}
