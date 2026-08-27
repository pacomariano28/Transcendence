const CONTENT_SERVICE_URL =
  process.env.CONTENT_SERVICE_URL || "http://content-service:4003";
const CONTENT_TIMEOUT_MS = Number(process.env.CONTENT_TIMEOUT_MS ?? 20_000);

export type ContentTrackMetadata = {
  track: string;
  artist: string;
  id: string | null;
  isrc: string;
  durationMs: number | null;
};

export type ContentPlaylistTrack = {
  spotifyTrackId: string;
  name: string;
  artists: string;
  isrc: string | null;
  durationMs: number | null;
};

function abortAfter(ms: number): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return {
    signal: controller.signal,
    cancel: () => clearTimeout(timeout),
  };
}

/**
 * @brief Waits until content-service reports healthy or retries are exhausted.
 */
export async function waitForContentService(attempts = 5): Promise<boolean> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const { signal, cancel } = abortAfter(2_000);
    try {
      const response = await fetch(`${CONTENT_SERVICE_URL}/health`, { signal });
      if (response.ok) {
        const payload = (await response.json()) as { status?: string };
        if (payload.status === "ok") return true;
      }
    } catch {
      // Retry until the attempt budget is spent.
    } finally {
      cancel();
    }

    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
    }
  }

  return false;
}

/**
 * @brief Fetches public playlist tracks from content-service.
 *
 * @returns Track list, or null when the playlist is unreadable (403/network).
 */
export async function fetchDefaultPlaylistTracks(
  playlistId: string,
  limit = 100,
): Promise<ContentPlaylistTrack[] | null> {
  const { signal, cancel } = abortAfter(CONTENT_TIMEOUT_MS);
  try {
    const response = await fetch(
      `${CONTENT_SERVICE_URL}/playlists/${encodeURIComponent(playlistId)}/tracks?limit=${limit}`,
      { signal },
    );
    const payload = (await response.json()) as {
      ok?: boolean;
      tracks?: ContentPlaylistTrack[];
      error?: string;
    };

    if (!response.ok || !payload.ok || !Array.isArray(payload.tracks)) {
      return null;
    }

    return payload.tracks;
  } catch {
    return null;
  } finally {
    cancel();
  }
}

/**
 * @brief Looks up title/artist/duration for an ISRC via content-service.
 */
export async function lookupTrackByIsrc(
  isrc: string,
): Promise<ContentTrackMetadata | null> {
  const { signal, cancel } = abortAfter(CONTENT_TIMEOUT_MS);
  try {
    const response = await fetch(
      `${CONTENT_SERVICE_URL}/track-by-isrc?isrc=${encodeURIComponent(isrc)}`,
      { signal },
    );
    if (!response.ok) return null;

    const payload = (await response.json()) as {
      track?: string;
      artist?: string;
      id?: string | null;
      durationMs?: number | null;
    };

    if (!payload.track || !payload.artist) return null;

    return {
      track: payload.track,
      artist: payload.artist,
      id: payload.id ?? null,
      isrc,
      durationMs:
        typeof payload.durationMs === "number" ? payload.durationMs : null,
    };
  } catch {
    return null;
  } finally {
    cancel();
  }
}
