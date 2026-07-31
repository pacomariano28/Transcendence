export const SYSTEM_PLAYLIST_OWNER_ID = "__system__";

export type GenrePlaylistDef = {
  id: string;
  genreKey: string;
  name: string;
  /** Community (non-Spotify) public playlist this genre maps to. */
  spotifyPlaylistName: string;
  /** Soft accent for empty cover placeholder. */
  accent: string;
};

/**
 * Curated public playlists for the main genres.
 * Track lists require a linked Spotify account (user OAuth token).
 */
export const GENRE_PLAYLISTS: GenrePlaylistDef[] = [
  {
    id: "2OFfgjs6kj0eA6FNayhAAJ",
    genreKey: "pop",
    name: "Pop",
    spotifyPlaylistName: "100 Greatest Pop Songs Ever",
    accent: "#f7d046",
  },
  {
    id: "2XXdE3Nboq3b6KTuBU47Z2",
    genreKey: "rock",
    name: "Rock",
    spotifyPlaylistName: "Best Classic Rock Hits",
    accent: "#f87171",
  },
  {
    id: "3PMsbsTsmBhuuESfYCOdY1",
    genreKey: "hiphop",
    name: "Hip-Hop",
    spotifyPlaylistName: "Best Rap Songs of All Time",
    accent: "#a78bfa",
  },
  {
    id: "3tRhisNDv5YZXPQltBbJNc",
    genreKey: "electronic",
    name: "Electronic",
    spotifyPlaylistName: "Best Electronic Music Of All Time",
    accent: "#34d399",
  },
  {
    id: "2T3BSpqN34Z4sppHDNWoeE",
    genreKey: "rnb",
    name: "R&B",
    spotifyPlaylistName: "R&B Classics 90s & 2000s",
    accent: "#fb923c",
  },
  {
    id: "0x5sdZSd4GbYmAucCshEsO",
    genreKey: "latin",
    name: "Latin",
    spotifyPlaylistName: "Best Latino Hits",
    accent: "#f472b6",
  },
  {
    id: "0Sm64Lu6z1OK8yM3Oeo4Wx",
    genreKey: "indie",
    name: "Indie",
    spotifyPlaylistName: "Best Indie Songs of All Time",
    accent: "#60a5fa",
  },
  {
    id: "1yMlpNGEpIVUIilZlrbdS0",
    genreKey: "metal",
    name: "Metal",
    spotifyPlaylistName: "Best Metal Songs of All Time",
    accent: "#94a3b8",
  },
  {
    id: "6oTvDCwo1ugIzLzJwasIP5",
    genreKey: "country",
    name: "Country",
    spotifyPlaylistName: "Best Country Songs",
    accent: "#d4a574",
  },
  {
    id: "5rdgRwdMskt1IJKjNf0VWQ",
    genreKey: "jazz",
    name: "Jazz",
    spotifyPlaylistName: "Jazz Top 100",
    accent: "#c4b5fd",
  },
];

const genreIdSet = new Set(GENRE_PLAYLISTS.map((g) => g.id));

export function isSystemGenrePlaylist(playlistId: string): boolean {
  return genreIdSet.has(playlistId);
}

export function getGenrePlaylist(
  playlistId: string,
): GenrePlaylistDef | undefined {
  return GENRE_PLAYLISTS.find((g) => g.id === playlistId);
}
