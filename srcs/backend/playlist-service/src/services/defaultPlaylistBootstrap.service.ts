import { DEFAULT_PLAYLIST_CATALOG } from "../lib/defaultPlaylistCatalog.js";
import {
  fetchDefaultPlaylistTracks,
  lookupTrackByIsrc,
  waitForContentService,
} from "../lib/contentClient.js";
import { mediaFileExists } from "../lib/mediaFiles.js";
import { logError, logInfo } from "../lib/logger.js";
import { prisma } from "../lib/prisma.js";
import { ensureTracks, type EnsureTrackInput } from "./clipWorker.service.js";

const DEFAULT_SPOTIFY_PLAYLIST_ID =
  process.env.DEFAULT_SPOTIFY_PLAYLIST_ID || "4m6KPiWl16XF39K0q9qbGm";
const MIN_SEED_SONGS = Number(process.env.MIN_SEED_SONGS ?? 10);
const DEFAULT_PLAYLIST_TRACK_LIMIT = Number(
  process.env.DEFAULT_PLAYLIST_TRACK_LIMIT ?? 100,
);

async function countReadySeedSongs(): Promise<number> {
  const songs = await prisma.song.findMany({
    where: { source: "seed", status: "ready", fileName: { not: null } },
    select: { fileName: true },
  });

  let ready = 0;
  for (const song of songs) {
    if (await mediaFileExists(song.fileName)) {
      ready += 1;
    }
  }
  return ready;
}

/**
 * @brief Reuses leftover preview_*.mp3 files from the previous downloader flow.
 */
async function claimExistingCatalogMedia(): Promise<void> {
  for (const entry of DEFAULT_PLAYLIST_CATALOG) {
    const exists = await mediaFileExists(entry.fileName);
    if (!exists) continue;

    const existing = await prisma.song.findUnique({
      where: { isrc: entry.isrc },
    });

    if (!existing) {
      const taken = await prisma.song.findUnique({
        where: { fileName: entry.fileName },
      });
      if (taken) continue;

      await prisma.song.create({
        data: {
          isrc: entry.isrc,
          fileName: entry.fileName,
          status: "ready",
          source: "seed",
        },
      });
      continue;
    }

    if (
      existing.status === "ready" &&
      existing.fileName &&
      (await mediaFileExists(existing.fileName))
    ) {
      if (existing.source !== "seed") {
        await prisma.song.update({
          where: { isrc: entry.isrc },
          data: { source: "seed" },
        });
      }
      continue;
    }

    const taken = await prisma.song.findUnique({
      where: { fileName: entry.fileName },
    });
    if (taken && taken.isrc !== entry.isrc) continue;

    await prisma.song.update({
      where: { isrc: entry.isrc },
      data: {
        fileName: entry.fileName,
        status: "ready",
        source: "seed",
        failReason: null,
      },
    });
  }
}

function toEnsureInput(track: {
  isrc: string;
  title?: string | null;
  artist?: string | null;
  spotifyTrackId?: string | null;
  durationMs?: number | null;
}): EnsureTrackInput {
  return {
    isrc: track.isrc,
    title: track.title ?? null,
    artist: track.artist ?? null,
    spotifyTrackId: track.spotifyTrackId ?? null,
    durationMs: track.durationMs ?? null,
  };
}

async function resolveFallbackCatalogTracks(): Promise<EnsureTrackInput[]> {
  const resolved: EnsureTrackInput[] = [];

  for (const entry of DEFAULT_PLAYLIST_CATALOG) {
    const existing = await prisma.song.findUnique({
      where: { isrc: entry.isrc },
    });
    if (
      existing?.status === "ready" &&
      existing.fileName &&
      (await mediaFileExists(existing.fileName))
    ) {
      continue;
    }

    const metadata = await lookupTrackByIsrc(entry.isrc);
    if (!metadata) {
      if (existing?.title && existing.artist) {
        resolved.push(
          toEnsureInput({
            isrc: entry.isrc,
            title: existing.title,
            artist: existing.artist,
            spotifyTrackId: existing.spotifyTrackId,
          }),
        );
      }
      continue;
    }

    resolved.push(
      toEnsureInput({
        isrc: entry.isrc,
        title: metadata.track,
        artist: metadata.artist,
        spotifyTrackId: metadata.id,
        durationMs: metadata.durationMs,
      }),
    );
  }

  return resolved;
}

async function repairMissingSeedMedia(): Promise<void> {
  const songs = await prisma.song.findMany({
    where: { source: "seed" },
  });

  const missing: EnsureTrackInput[] = [];

  for (const song of songs) {
    if (
      song.status === "ready" &&
      song.fileName &&
      (await mediaFileExists(song.fileName))
    ) {
      continue;
    }

    let title = song.title;
    let artist = song.artist;
    let spotifyTrackId = song.spotifyTrackId;
    let durationMs: number | null = null;

    if (!title || !artist) {
      const metadata = await lookupTrackByIsrc(song.isrc);
      if (metadata) {
        title = metadata.track;
        artist = metadata.artist;
        spotifyTrackId = metadata.id ?? spotifyTrackId;
        durationMs = metadata.durationMs;
      }
    }

    if (!title || !artist) continue;

    missing.push(
      toEnsureInput({
        isrc: song.isrc,
        title,
        artist,
        spotifyTrackId,
        durationMs,
      }),
    );
  }

  if (missing.length === 0) return;

  logInfo(`Repairing ${missing.length} seed track(s) with missing local audio`);
  await ensureTracks(missing, { source: "seed" });
}

/**
 * @brief Materializes the built-in Default Mix without blocking HTTP startup.
 *
 * @description
 * Reuses existing local previews when present. Fetches up to 100 tracks from
 * the configured public Spotify playlist via content-service and enqueues the
 * same clip worker used by lobby playlist selection. Failures are logged; the
 * process stays up.
 */
export async function bootstrapDefaultPlaylist(): Promise<void> {
  await claimExistingCatalogMedia();

  const contentReady = await waitForContentService();
  if (!contentReady) {
    logInfo(
      "content-service unavailable; falling back to ISRC catalog for default playlist",
    );
  }

  let tracks: EnsureTrackInput[] = [];

  if (contentReady) {
    const playlistTracks = await fetchDefaultPlaylistTracks(
      DEFAULT_SPOTIFY_PLAYLIST_ID,
      DEFAULT_PLAYLIST_TRACK_LIMIT,
    );
    if (playlistTracks && playlistTracks.length > 0) {
      tracks = playlistTracks
        .filter((track): track is typeof track & { isrc: string } =>
          Boolean(track.isrc),
        )
        .map((track) =>
          toEnsureInput({
            isrc: track.isrc,
            title: track.name,
            artist: track.artists,
            spotifyTrackId: track.spotifyTrackId,
            durationMs: track.durationMs,
          }),
        );
      logInfo(
        `Default playlist ${DEFAULT_SPOTIFY_PLAYLIST_ID}: enqueueing ${tracks.length} track(s)`,
      );
    } else {
      logInfo(
        `Default playlist ${DEFAULT_SPOTIFY_PLAYLIST_ID} unread; using ISRC catalog fallback`,
      );
    }
  }

  if (tracks.length === 0) {
    const readyBefore = await countReadySeedSongs();
    if (readyBefore >= MIN_SEED_SONGS) {
      logInfo(
        `Default playlist already has ${readyBefore} ready seed song(s); repairing gaps only`,
      );
      await repairMissingSeedMedia();
      return;
    }

    tracks = await resolveFallbackCatalogTracks();
    logInfo(`Fallback catalog resolved ${tracks.length} track(s)`);
  }

  if (tracks.length === 0) {
    logError({
      event: "default_playlist_bootstrap_empty",
      message: "No tracks available to materialize Default Mix",
    });
    return;
  }

  await ensureTracks(tracks, { source: "seed" });
}
