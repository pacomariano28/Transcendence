import { prisma } from "../lib/prisma.js";
import crypto from "crypto";

interface Song {
  trackId: string;
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
  const songIds = selectedSongs.map((s) => s.trackId);

  // 3. Marcar esas canciones como usadas
  await prisma.song.updateMany({
    where: { trackId: { in: songIds } },
    data: { used: true },
  });

  // 4. Preparar las canciones para la respuesta (omitimos campos internos)
  const songs = selectedSongs.map(({ trackId, fileName }) => ({
    trackId,
    fileName,
  }));

  return {
    playlistId,
    songs,
  };
}
