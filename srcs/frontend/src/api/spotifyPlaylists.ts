import { apiJson } from "./http";

export type SpotifyPlaylistSummary = {
  id: string;
  name: string;
  imageUrl: string | null;
  trackCount: number;
  ownerName: string | null;
};

export type SpotifyAlbumSummary = {
  id: string;
  name: string;
  imageUrl: string | null;
  trackCount: number;
  ownerName: string | null;
  releaseDate?: string | null;
};

export type CatalogSearchType = "all" | "album" | "playlist";

export async function fetchMySpotifyPlaylists(): Promise<
  SpotifyPlaylistSummary[]
> {
  const data = await apiJson<{ playlists: SpotifyPlaylistSummary[] }>(
    "/api/auth/spotify/playlists",
  );
  return data.playlists ?? [];
}

export async function searchSpotifyCatalog(
  term: string,
  type: CatalogSearchType = "all",
): Promise<{
  albums: SpotifyAlbumSummary[];
  playlists: SpotifyPlaylistSummary[];
}> {
  const q = term.trim();
  if (!q) return { albums: [], playlists: [] };

  const query = new URLSearchParams({ term: q, type }).toString();
  const data = await apiJson<{
    ok?: boolean;
    albums?: SpotifyAlbumSummary[];
    playlists?: SpotifyPlaylistSummary[];
  }>(`/api/content/search/catalog?${query}`);

  return {
    albums: data.albums ?? [],
    playlists: data.playlists ?? [],
  };
}
