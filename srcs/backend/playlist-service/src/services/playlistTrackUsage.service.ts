import { prisma } from "../lib/prisma.js";

function fisherYatesShuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function ensureUsageRows(playlistKey: string, isrcs: string[]): Promise<void> {
  if (isrcs.length === 0) return;

  await prisma.$transaction(
    isrcs.map((isrc) =>
      prisma.playlistTrackUsage.upsert({
        where: {
          playlistKey_isrc: { playlistKey, isrc },
        },
        create: { playlistKey, isrc, used: false },
        update: {},
      }),
    ),
  );
}

/**
 * Orders playlist tracks with unused entries first. Resets the cycle when every
 * track in the playlist has already been used.
 */
export async function orderTracksByPlaylistUsage<T extends { isrc: string }>(
  playlistKey: string,
  tracks: T[],
): Promise<T[]> {
  if (tracks.length === 0) return [];

  const isrcs = tracks.map((track) => track.isrc);
  await ensureUsageRows(playlistKey, isrcs);

  const usageRows = await prisma.playlistTrackUsage.findMany({
    where: { playlistKey, isrc: { in: isrcs } },
  });
  const usedByIsrc = new Map(usageRows.map((row) => [row.isrc, row.used]));

  const unusedTracks = tracks.filter((track) => !usedByIsrc.get(track.isrc));
  const usedTracks = tracks.filter((track) => usedByIsrc.get(track.isrc));

  if (unusedTracks.length === 0 && usedTracks.length > 0) {
    await prisma.playlistTrackUsage.updateMany({
      where: { playlistKey, isrc: { in: isrcs } },
      data: { used: false },
    });
    return fisherYatesShuffle(tracks);
  }

  return [...fisherYatesShuffle(unusedTracks), ...fisherYatesShuffle(usedTracks)];
}

/**
 * Atomically marks playlist tracks as used after a match claims them.
 */
export async function markPlaylistTracksUsed(
  playlistKey: string,
  isrcs: string[],
): Promise<void> {
  if (isrcs.length === 0) return;

  await ensureUsageRows(playlistKey, isrcs);

  await prisma.$transaction(
    isrcs.map((isrc) =>
      prisma.playlistTrackUsage.update({
        where: { playlistKey_isrc: { playlistKey, isrc } },
        data: { used: true },
      }),
    ),
  );
}

/**
 * Releases tracks reserved for a lobby selection that was replaced or failed.
 */
export async function releasePlaylistTracks(
  playlistKey: string,
  isrcs: string[],
): Promise<void> {
  if (isrcs.length === 0) return;

  await prisma.playlistTrackUsage.updateMany({
    where: { playlistKey, isrc: { in: isrcs } },
    data: { used: false },
  });
}
