import { SYSTEM_PLAYLIST_OWNER_ID } from "./genrePlaylists";

/** Built-in playlist backed by seed MP3s in media/ — no Spotify account required. */
export const LOCAL_SEED_PLAYLIST_ID = "__local_seed__";

export const LOCAL_SEED_PLAYLIST = {
  id: LOCAL_SEED_PLAYLIST_ID,
  nameKey: "lobby.localPlaylistName",
  defaultName: "Classic Mix",
  imageUrl: "/images/top-50-global-cover.png",
  ownerUserId: SYSTEM_PLAYLIST_OWNER_ID,
  ownerDisplayName: "Songuess",
  accent: "#f7d046",
};

export function isLocalSeedPlaylist(playlistId: string): boolean {
  return playlistId === LOCAL_SEED_PLAYLIST_ID;
}
