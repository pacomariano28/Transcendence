import { prisma } from "../lib/prisma.js";
import crypto from "crypto";

type SongRow = {
  isrc: string;
  fileName: string | null;
  used: boolean;
  status: string;
};

const PLAYLIST_SIZE = 5;

function fisherYatesShuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function countAvailableSongs(): Promise<number> {
  const unusedCount = await prisma.song.count({
    where: { used: false, status: "ready", fileName: { not: null } },
  });

  if (unusedCount < PLAYLIST_SIZE) {
    return prisma.song.count({
      where: { status: "ready", fileName: { not: null } },
    });
  }

  return unusedCount;
}

export async function selectRandomSongs(
  count: number,
  excludeIsrcs: string[] = [],
): Promise<{ isrc: string; fileName: string }[]> {
  if (count <= 0) {
    return [];
  }

  const excludeFilter =
    excludeIsrcs.length > 0 ? { isrc: { notIn: excludeIsrcs } } : {};

  let availableSongs: SongRow[] = await prisma.song.findMany({
    where: {
      used: false,
      status: "ready",
      fileName: { not: null },
      ...excludeFilter,
    },
  });

  if (availableSongs.length < count) {
    await prisma.song.updateMany({
      where: {
        status: "ready",
        fileName: { not: null },
        ...excludeFilter,
      },
      data: { used: false },
    });

    availableSongs = await prisma.song.findMany({
      where: {
        used: false,
        status: "ready",
        fileName: { not: null },
        ...excludeFilter,
      },
    });
  }

  if (availableSongs.length === 0) {
    return [];
  }

  const shuffled = fisherYatesShuffle(availableSongs);
  const selectedSongs = shuffled.slice(0, Math.min(count, shuffled.length));
  const songIsrcs = selectedSongs.map((song) => song.isrc);

  await prisma.song.updateMany({
    where: { isrc: { in: songIsrcs } },
    data: { used: true },
  });

  return selectedSongs
    .filter((song): song is SongRow & { fileName: string } =>
      Boolean(song.fileName),
    )
    .map(({ isrc, fileName }) => ({
      isrc,
      fileName,
    }));
}

export async function generateRandomPlaylist() {
  const songs = await selectRandomSongs(PLAYLIST_SIZE);

  return {
    playlistId: crypto.randomUUID(),
    songs,
  };
}

export async function getSongsByIsrcs(isrcs: string[]) {
  if (isrcs.length === 0) return [];
  return prisma.song.findMany({
    where: { isrc: { in: isrcs } },
  });
}

export type SeedSongRow = {
  isrc: string;
  fileName: string;
  title: string | null;
  artist: string | null;
};

/**
 * Returns ready seed-library songs (local media, no Spotify required).
 */
export async function selectSeedSongs(count: number): Promise<SeedSongRow[]> {
  if (count <= 0) return [];

  const songs = await prisma.song.findMany({
    where: {
      source: "seed",
      status: "ready",
      fileName: { not: null },
    },
    select: {
      isrc: true,
      fileName: true,
      title: true,
      artist: true,
    },
  });

  if (songs.length === 0) return [];

  const shuffled = fisherYatesShuffle(songs);
  return shuffled
    .slice(0, Math.min(count, shuffled.length))
    .filter((song): song is typeof song & { fileName: string } =>
      Boolean(song.fileName),
    )
    .map(({ isrc, fileName, title, artist }) => ({
      isrc,
      fileName,
      title,
      artist,
    }));
}
