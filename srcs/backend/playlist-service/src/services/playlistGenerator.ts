import { prisma } from "../lib/prisma.js";
import crypto from "crypto";

interface Song {
  isrc: string;
  fileName: string;
  used: boolean;
}

const PLAYLIST_SIZE = 5;

function fisherYatesShuffle<T>(array: T[]): T[] {
  // We copy the array as as not to mutate it
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function countAvailableSongs(): Promise<number> {
  const unusedCount = await prisma.song.count({
    where: { used: false },
  });

  if (unusedCount < PLAYLIST_SIZE) {
    return prisma.song.count();
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

  let availableSongs: Song[] = await prisma.song.findMany({
    where: {
      used: false,
      ...excludeFilter,
    },
  });

  if (availableSongs.length < count) {
    await prisma.song.updateMany({
      where: excludeFilter,
      data: { used: false },
    });

    availableSongs = await prisma.song.findMany({
      where: {
        used: false,
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

  return selectedSongs.map(({ isrc, fileName }) => ({
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
