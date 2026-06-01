import { fetchPlaylist } from "../clients/playlist.client.js";

export async function loadPlaylist(match: MatchState): Promise<void> {
  if (match.playlist.length > 0 || match.playlistError) return;

  const result = await fetchPlaylist();

  if (!result.ok) {
    match.playlistError = result.error;
    return;
  }

  match.playlist = result.songs;
  match.roundsTotal = Math.min(match.roundsTotal, match.playlist.length);
}
