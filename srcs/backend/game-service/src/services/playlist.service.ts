import {
  fetchPlaylist,
  fetchRandomSongs,
} from "../clients/playlist.client.js";
import { fetchTrackByIsrc } from "../clients/content.client.js";

const METADATA_FETCH_CONCURRENCY = 5;
const METADATA_FETCH_RETRIES = 2;
const MAX_REPLACEMENT_ATTEMPTS = 50;

type BaseSong = Pick<PlaylistItem, "isrc" | "fileName"> & {
  title?: string;
  artist?: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isValidPlaylistItem(song: PlaylistItem): boolean {
  return (
    isNonEmptyString(song.isrc) &&
    isNonEmptyString(song.fileName) &&
    isNonEmptyString(song.track) &&
    isNonEmptyString(song.artist)
  );
}

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

async function enrichSong(song: BaseSong): Promise<PlaylistItem> {
  const metadata = await fetchTrackMetadataWithRetry(song.isrc);
  const fallbackTrack =
    song.title?.trim() || `Track ${song.isrc.slice(-6)}`;
  const fallbackArtist = song.artist?.trim() || "Unknown Artist";

  return {
    ...song,
    track: metadata?.track ?? fallbackTrack,
    artist: metadata?.artist ?? fallbackArtist,
    imageUrl: metadata?.imageUrl ?? null,
    spotifyUrl: metadata?.spotifyUrl ?? null,
  };
}

async function buildValidatedPlaylist(
  targetCount: number,
  initialSongs: BaseSong[],
): Promise<
  { ok: true; songs: PlaylistItem[] } | { ok: false; error: string }
> {
  const validSongs: PlaylistItem[] = [];
  const triedIsrcs = new Set<string>();
  let pending: BaseSong[] = [...initialSongs];
  let attempts = 0;

  while (validSongs.length < targetCount && attempts < MAX_REPLACEMENT_ATTEMPTS) {
    if (pending.length === 0) {
      const needed = targetCount - validSongs.length;
      const result = await fetchRandomSongs(needed, [...triedIsrcs]);

      if (!result.ok) {
        return { ok: false, error: result.error };
      }

      if (result.songs.length === 0) {
        return { ok: false, error: "NOT_ENOUGH_SONGS_AVAILABLE" };
      }

      pending = result.songs;
      attempts += 1;
      continue;
    }

    const batch = pending.splice(0, pending.length);
    const enriched = await mapWithConcurrency(
      batch,
      METADATA_FETCH_CONCURRENCY,
      enrichSong,
    );

    for (const song of enriched) {
      triedIsrcs.add(song.isrc);

      if (isValidPlaylistItem(song)) {
        validSongs.push(song);
        if (validSongs.length >= targetCount) {
          break;
        }
        continue;
      }

      console.warn(
        `[playlist] Discarding incomplete song ISRC ${song.isrc} (fileName=${song.fileName})`,
      );
    }

    attempts += 1;
  }

  if (validSongs.length < targetCount) {
    return { ok: false, error: "NOT_ENOUGH_SONGS_AVAILABLE" };
  }

  return { ok: true, songs: validSongs.slice(0, targetCount) };
}

export async function loadPlaylist(match: MatchState): Promise<void> {
  if (match.playlist.length > 0 || match.playlistError) return;

  // Spotify-backed selection: use clips already prepared for this match.
  if (match.selectedPlaylist && match.preparedSongs.length > 0) {
    const targetCount = Math.min(
      match.roundsTotal,
      match.preparedSongs.length,
    );
    // Shuffle again at start so rematches don't reuse the first prepared entry.
    const shuffledPrepared = [...match.preparedSongs];
    for (let i = shuffledPrepared.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledPrepared[i], shuffledPrepared[j]] = [
        shuffledPrepared[j],
        shuffledPrepared[i],
      ];
    }
    const validated = await buildValidatedPlaylist(
      targetCount,
      shuffledPrepared,
    );

    if (!validated.ok) {
      match.playlistError = validated.error;
      return;
    }

    match.playlist = validated.songs;
    match.roundsTotal = Math.min(match.roundsTotal, match.playlist.length);
    return;
  }

  const result = await fetchPlaylist();

  if (!result.ok) {
    match.playlistError = result.error;
    return;
  }

  const targetCount = result.songs.length;
  const validated = await buildValidatedPlaylist(targetCount, result.songs);

  if (!validated.ok) {
    match.playlistError = validated.error;
    return;
  }

  match.playlist = validated.songs;
  match.roundsTotal = Math.min(match.roundsTotal, match.playlist.length);
}
