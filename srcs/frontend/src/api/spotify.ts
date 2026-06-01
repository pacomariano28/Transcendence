import { apiJson } from "./http";

export type SpotifySearchTrack = {
  id: string;
  track: string;
  artist: string;
};

export async function searchSpotifyTracks(
  term: string,
): Promise<SpotifySearchTrack[]> {
  const query = new URLSearchParams({ term }).toString();
  return apiJson<SpotifySearchTrack[]>(`/api/content/search?${query}`);
}
