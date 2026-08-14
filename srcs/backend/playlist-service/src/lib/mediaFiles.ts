import fs from "node:fs/promises";
import path from "node:path";

export const MEDIA_DIR = process.env.MEDIA_DIR || "/media";

export function mediaPath(fileName: string): string {
  return path.join(MEDIA_DIR, fileName);
}

export async function mediaFileExists(
  fileName: string | null | undefined,
): Promise<boolean> {
  if (!fileName) return false;
  try {
    await fs.access(mediaPath(fileName));
    return true;
  } catch {
    return false;
  }
}

export async function filterSongsWithMedia<
  T extends { fileName: string | null },
>(songs: T[]): Promise<Array<T & { fileName: string }>> {
  const checked = await Promise.all(
    songs.map(async (song) => ({
      song,
      exists: await mediaFileExists(song.fileName),
    })),
  );

  return checked
    .filter(
      (entry): entry is { song: T & { fileName: string }; exists: true } =>
        Boolean(entry.song.fileName) && entry.exists,
    )
    .map((entry) => entry.song);
}
