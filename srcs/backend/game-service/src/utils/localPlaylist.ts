import { SYSTEM_PLAYLIST_OWNER_ID } from "./genrePlaylists.js";

/** Built-in playlist backed by seed MP3s in media/ — no Spotify account required. */
export const LOCAL_SEED_PLAYLIST_ID = "__local_seed__";

export const LOCAL_SEED_PLAYLIST = {
  id: LOCAL_SEED_PLAYLIST_ID,
  name: "Classic Mix",
  imageUrl: null as string | null,
  ownerUserId: SYSTEM_PLAYLIST_OWNER_ID,
  ownerDisplayName: "Songuess",
};

export function isLocalSeedPlaylist(playlistId: string): boolean {
  return playlistId === LOCAL_SEED_PLAYLIST_ID;
}
