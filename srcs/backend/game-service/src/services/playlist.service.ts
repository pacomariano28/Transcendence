import { fetchPlaylist } from "../clients/playlist.client.js";
import { fetchTrackByIsrc } from "../clients/content.client.js";

const METADATA_FETCH_CONCURRENCY = 5;
const METADATA_FETCH_RETRIES = 2;

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );

  return results;
}

async function fetchTrackMetadataWithRetry(isrc: string) {
  for (let attempt = 0; attempt <= METADATA_FETCH_RETRIES; attempt += 1) {
    const metadata = await fetchTrackByIsrc(isrc);
    if (metadata) {
      return metadata;
    }

    if (attempt < METADATA_FETCH_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }
  }

  console.warn(`[playlist] Failed to resolve Spotify metadata for ISRC ${isrc}`);
  return null;
}

export async function loadPlaylist(match: MatchState): Promise<void> {
  if (match.playlist.length > 0 || match.playlistError) return;

  const result = await fetchPlaylist();

  if (!result.ok) {
    match.playlistError = result.error;
    return;
  }

  const enrichedSongs = await mapWithConcurrency(
    result.songs,
    METADATA_FETCH_CONCURRENCY,
    async (song) => {
      const metadata = await fetchTrackMetadataWithRetry(song.isrc);
      return {
        ...song,
        track: metadata?.track ?? "",
        artist: metadata?.artist ?? "",
        imageUrl: metadata?.imageUrl ?? null,
        spotifyUrl: metadata?.spotifyUrl ?? null,
      };
    },
  );

  match.playlist = enrichedSongs;
  match.roundsTotal = Math.min(match.roundsTotal, match.playlist.length);
}
