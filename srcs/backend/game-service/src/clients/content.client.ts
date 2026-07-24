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
