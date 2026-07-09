import { prisma } from "../lib/prisma.js";
import crypto from "crypto";

interface Song {
  isrc: string;
  fileName: string;
  used: boolean;
}

const PLAYLIST_SIZE = 5;

function fisherYatesShuffle<T>(array: T[]): T[] {
  // Copiamos el array para no mutarlo
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

export async function generateRandomPlaylist() {
  // 1. Consultar canciones no usadas
  let unusedSongs: Song[] = await prisma.song.findMany({
    where: { used: false },
  });

  // si no hay suficientes canciones disponibles, reseteamos todas
  if (unusedSongs.length < PLAYLIST_SIZE) {
    await prisma.song.updateMany({
      data: { used: false },
    });

    unusedSongs = await prisma.song.findMany({
      where: { used: false },
    });
  }

  // 2. Barajar y seleccionar las primeras 5
  const shuffled = fisherYatesShuffle(unusedSongs);
  const selectedSongs = shuffled.slice(0, PLAYLIST_SIZE);

  const playlistId = crypto.randomUUID();
  const songIsrcs = selectedSongs.map((s) => s.isrc);

  // 3. Marcar esas canciones como usadas
  await prisma.song.updateMany({
    where: { isrc: { in: songIsrcs } },
    data: { used: true },
  });

  // 4. Preparar las canciones para la respuesta (omitimos campos internos)
  const songs = selectedSongs.map(({ isrc, fileName }) => ({
    isrc,
    fileName,
  }));

  return {
    playlistId,
    songs,
  };
}
