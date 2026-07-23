import { apiJson } from "./http";

export const MATCH_ROUNDS_TOTAL = 5;

export const NOT_ENOUGH_SONGS_MESSAGE =
  "Not enough songs available to start the game.";

interface AvailableSongCountResponse {
  ok: boolean;
  count: number;
}

export async function getAvailableSongCount(): Promise<number> {
  const res = await apiJson<AvailableSongCountResponse>(
    "/api/playlist/available-count",
  );

  return res.count;
}

export async function ensureEnoughSongsForMatch(): Promise<void> {
  const count = await getAvailableSongCount();
  if (count < MATCH_ROUNDS_TOTAL) {
    throw new Error("NOT_ENOUGH_SONGS_AVAILABLE");
  }
}
