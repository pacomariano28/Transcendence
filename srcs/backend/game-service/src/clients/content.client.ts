import {
  CONTENT_SERVICE_URL,
  PLAYLIST_TIMEOUT_MS,
} from "../utils/constants.js";

export type TrackMetadata = {
  track: string;
  artist: string;
  imageUrl: string | null;
  spotifyUrl: string | null;
};

export type PublicPlaylistMetadata = {
  id: string;
  name: string;
  imageUrl: string | null;
  trackCount: number;
  ownerName: string | null;
};

export type PublicPlaylistTrack = {
  spotifyTrackId: string;
  name: string;
  artists: string;
  isrc: string | null;
  imageUrl: string | null;
};

export async function fetchTrackByIsrc(
  isrc: string,
): Promise<TrackMetadata | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PLAYLIST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${CONTENT_SERVICE_URL}/track-by-isrc?isrc=${encodeURIComponent(isrc)}`,
      { signal: controller.signal },
    );

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as TrackMetadata;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchPublicPlaylist(
  playlistId: string,
): Promise<
  | { ok: true; playlist: PublicPlaylistMetadata }
  | { ok: false; error: string }
> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PLAYLIST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${CONTENT_SERVICE_URL}/playlists/${encodeURIComponent(playlistId)}`,
      { signal: controller.signal },
    );
    const payload = (await response.json()) as {
      ok?: boolean;
      playlist?: PublicPlaylistMetadata;
      error?: string;
    };

    if (!response.ok || !payload.ok || !payload.playlist) {
      return { ok: false, error: payload.error || "PLAYLIST_NOT_FOUND" };
    }

    return { ok: true, playlist: payload.playlist };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "PLAYLIST_NOT_FOUND",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchPublicPlaylistTracks(
  playlistId: string,
  limit = 30,
): Promise<
  | { ok: true; tracks: PublicPlaylistTrack[] }
  | { ok: false; error: string }
> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PLAYLIST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${CONTENT_SERVICE_URL}/playlists/${encodeURIComponent(playlistId)}/tracks?limit=${limit}`,
      { signal: controller.signal },
    );
    const payload = (await response.json()) as {
      ok?: boolean;
      tracks?: PublicPlaylistTrack[];
      error?: string;
    };

    if (!response.ok || !payload.ok || !payload.tracks) {
      return {
        ok: false,
        error: payload.error || "SPOTIFY_PLAYLIST_TRACKS_FAILED",
      };
    }

    return { ok: true, tracks: payload.tracks };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "SPOTIFY_PLAYLIST_TRACKS_FAILED",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchPublicAlbum(
  albumId: string,
): Promise<
  | { ok: true; album: PublicPlaylistMetadata }
  | { ok: false; error: string }
> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PLAYLIST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${CONTENT_SERVICE_URL}/albums/${encodeURIComponent(albumId)}`,
      { signal: controller.signal },
    );
    const payload = (await response.json()) as {
      ok?: boolean;
      album?: PublicPlaylistMetadata;
      error?: string;
    };

    if (!response.ok || !payload.ok || !payload.album) {
      return { ok: false, error: payload.error || "ALBUM_NOT_FOUND" };
    }

    return { ok: true, album: payload.album };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "ALBUM_NOT_FOUND",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchPublicAlbumTracks(
  albumId: string,
  limit = 50,
): Promise<
  | { ok: true; tracks: PublicPlaylistTrack[] }
  | { ok: false; error: string }
> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PLAYLIST_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${CONTENT_SERVICE_URL}/albums/${encodeURIComponent(albumId)}/tracks?limit=${limit}`,
      { signal: controller.signal },
    );
    const payload = (await response.json()) as {
      ok?: boolean;
      tracks?: PublicPlaylistTrack[];
      error?: string;
    };

    if (!response.ok || !payload.ok || !payload.tracks) {
      return {
        ok: false,
        error: payload.error || "SPOTIFY_ALBUM_TRACKS_FAILED",
      };
    }

    return { ok: true, tracks: payload.tracks };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "SPOTIFY_ALBUM_TRACKS_FAILED",
    };
  } finally {
    clearTimeout(timeout);
  }
}
