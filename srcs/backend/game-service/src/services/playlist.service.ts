import { PlaylistItem } from "../models/lobby.model.js";

const PLAYLIST_SERVICE_URL =
  process.env.PLAYLIST_SERVICE_URL || "http://playlist-service:4004";

export async function getPlaylist(): Promise<PlaylistItem[]> {
  const PLAYLIST_ENDPOINT = `${PLAYLIST_SERVICE_URL}/get-playlist`;
  const response = await fetch(PLAYLIST_ENDPOINT, {
    method: "GET",
    // Si usas self-signed certs, puedes necesitar ajustar el agente HTTPS:
    // agent: new https.Agent({ rejectUnauthorized: false }),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Playlist Service error: ${response.status} - ${errorText}`,
    );
  }
  const data = await response.json();
  return data;
}
