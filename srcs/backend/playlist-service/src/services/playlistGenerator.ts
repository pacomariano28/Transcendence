import { prisma } from "../lib/prisma.js";
import crypto from "crypto";

interface Song {
  id: string;
  title: string;
  artist: string;
  genre: string;
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
  const unusedSongs: Song[] = await prisma.song.findMany({
    where: { used: false },
  });

  if (unusedSongs.length < PLAYLIST_SIZE) {
    // No hay suficientes canciones disponibles
    return null;
  }

  // 2. Barajar y seleccionar las primeras 5
  const shuffled = fisherYatesShuffle(unusedSongs);
  const selectedSongs = shuffled.slice(0, PLAYLIST_SIZE);

  const playlistId = crypto.randomUUID();
  const songIds = selectedSongs.map((s) => s.id);

  // 3. Marcar esas canciones como usadas
  await prisma.song.updateMany({
    where: { id: { in: songIds } },
    data: { used: true },
  });

  // 4. Preparar las canciones para la respuesta (omitimos campos internos)
  const songs = selectedSongs.map(({ id, title, artist, genre, fileName }) => ({
    id,
    title,
    artist,
    genre,
    fileName,
  }));

  return {
    playlistId,
    songs,
  };
}
