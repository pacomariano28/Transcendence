import {
  AUTH_SERVICE_URL,
  AUTH_PLAYLIST_TRACKS_TIMEOUT_MS,
  PLAYLIST_TIMEOUT_MS,
} from "../utils/constants.js";

export type SpotifyPlaylistTrackDto = {
  spotifyTrackId: string;
  name: string;
  artists: string;
  isrc: string | null;
  imageUrl: string | null;
};

export type SpotifyPlaylistMetaDto = {
  id: string;
  name: string;
  imageUrl: string | null;
  trackCount: number;
  ownerName: string | null;
};

export async function fetchUserPlaylistMeta(
  userId: string,
  playlistId: string,
): Promise<
  | { ok: true; playlist: SpotifyPlaylistMetaDto }
  | { ok: false; error: string }
> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PLAYLIST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${AUTH_SERVICE_URL}/internal/users/${encodeURIComponent(userId)}/spotify/playlists/${encodeURIComponent(playlistId)}`,
      { signal: controller.signal },
    );
    const payload = (await response.json()) as {
      ok?: boolean;
      playlist?: SpotifyPlaylistMetaDto;
      error?: string;
    };

    if (!response.ok || !payload.ok || !payload.playlist) {
      return {
        ok: false,
        error: payload.error || "SPOTIFY_PLAYLIST_FAILED",
      };
    }

    return { ok: true, playlist: payload.playlist };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "SPOTIFY_PLAYLIST_FAILED",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchUserPlaylistTracks(
  userId: string,
  playlistId: string,
  mode: "prep" | "full" = "prep",
): Promise<
  | { ok: true; tracks: SpotifyPlaylistTrackDto[] }
  | { ok: false; error: string; spotifyStatus?: number }
> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    AUTH_PLAYLIST_TRACKS_TIMEOUT_MS,
  );

  const modeQuery = mode === "prep" ? "?mode=prep" : "";

  try {
    const response = await fetch(
      `${AUTH_SERVICE_URL}/internal/users/${encodeURIComponent(userId)}/spotify/playlists/${encodeURIComponent(playlistId)}/tracks${modeQuery}`,
      { signal: controller.signal },
    );
    const payload = (await response.json()) as {
      ok?: boolean;
      tracks?: SpotifyPlaylistTrackDto[];
      error?: string;
      spotifyStatus?: number;
    };

    if (!response.ok || !payload.ok || !Array.isArray(payload.tracks)) {
      return {
        ok: false,
        error: payload.error || "SPOTIFY_PLAYLIST_TRACKS_FAILED",
        ...(payload.spotifyStatus !== undefined
          ? { spotifyStatus: payload.spotifyStatus }
          : {}),
      };
    }

    if (payload.tracks.length === 0) {
      return {
        ok: false,
        error: payload.error || "SPOTIFY_PLAYLIST_ITEMS_UNAVAILABLE",
        ...(payload.spotifyStatus !== undefined
          ? { spotifyStatus: payload.spotifyStatus }
          : {}),
      };
    }

    return { ok: true, tracks: payload.tracks };
  } catch (error) {
    const isTimeout =
      error instanceof Error &&
      (error.name === "AbortError" || error.message.includes("aborted"));
    return {
      ok: false,
      error: isTimeout
        ? "SPOTIFY_PLAYLIST_FETCH_TIMEOUT"
        : error instanceof Error
          ? error.message
          : "SPOTIFY_PLAYLIST_TRACKS_FAILED",
    };
  } finally {
    clearTimeout(timeout);
  }
}
