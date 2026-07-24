import { fetchPlaylist } from "../clients/playlist.client.js";
import { fetchTrackByIsrc } from "../clients/content.client.js";

export async function loadPlaylist(match: MatchState): Promise<void> {
  if (match.playlist.length > 0 || match.playlistError) return;

  const result = await fetchPlaylist();

  if (!result.ok) {
    match.playlistError = result.error;
    return;
  }

  const enrichedSongs = await Promise.all(
    result.songs.map(async (song) => {
      const metadata = await fetchTrackByIsrc(song.isrc);
      return {
        ...song,
        track: metadata?.track ?? "",
        artist: metadata?.artist ?? "",
        imageUrl: metadata?.imageUrl ?? null,
      };
    }),
  );

  match.playlist = enrichedSongs;
  match.roundsTotal = Math.min(match.roundsTotal, match.playlist.length);
}
