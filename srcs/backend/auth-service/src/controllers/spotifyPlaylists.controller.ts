import type { Request, Response } from "express";
import { getAuthedUserFromHeaders } from "../services/auth.service.js";
import {
  getPlaylistSummary,
  listPlaylistTracks,
  listUserPlaylists,
} from "../services/spotifyPlaylists.service.js";

function mapSpotifyError(err: unknown, res: Response) {
  const msg = err instanceof Error ? err.message : "INTERNAL_ERROR";
  const details =
    typeof err === "object" && err !== null && "details" in err
      ? (err as { details?: unknown }).details
      : undefined;

  if (msg === "SPOTIFY_NOT_LINKED" || msg === "SPOTIFY_REAUTH_REQUIRED") {
    return res.status(403).json({ ok: false, error: msg });
  }
  if (msg === "SPOTIFY_OAUTH_NOT_CONFIGURED") {
    return res.status(500).json({ ok: false, error: msg });
  }
  if (
    msg === "SPOTIFY_PLAYLISTS_FAILED" ||
    msg === "SPOTIFY_PLAYLIST_TRACKS_FAILED" ||
    msg === "SPOTIFY_PLAYLIST_FAILED" ||
    msg === "SPOTIFY_TOKEN_REFRESH_FAILED"
  ) {
    return res.status(502).json({ ok: false, error: msg, details });
  }
  return res.status(500).json({ ok: false, error: msg, details });
}

/**
 * GET /spotify/playlists — current user's Spotify playlists (metadata only).
 */
export async function getMyPlaylists(req: Request, res: Response) {
  const authUser = getAuthedUserFromHeaders(req);
  if (!authUser) {
    return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
  }

  try {
    const playlists = await listUserPlaylists(authUser.id);
    return res.json({ ok: true, playlists });
  } catch (err) {
    return mapSpotifyError(err, res);
  }
}

/**
 * GET /spotify/playlists/:playlistId/tracks — first 30 tracks of a playlist.
 */
export async function getMyPlaylistTracks(req: Request, res: Response) {
  const authUser = getAuthedUserFromHeaders(req);
  if (!authUser) {
    return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
  }

  const playlistId =
    typeof req.params.playlistId === "string" ? req.params.playlistId : "";
  if (!playlistId) {
    return res.status(400).json({ ok: false, error: "MISSING_PLAYLIST_ID" });
  }

  try {
    const tracks = await listPlaylistTracks(authUser.id, playlistId);
    return res.json({ ok: true, tracks });
  } catch (err) {
    return mapSpotifyError(err, res);
  }
}

/**
 * Internal: GET /internal/users/:userId/spotify/playlists/:playlistId
 */
export async function getUserPlaylistMetaInternal(
  req: Request,
  res: Response,
) {
  const userId = typeof req.params.userId === "string" ? req.params.userId : "";
  const playlistId =
    typeof req.params.playlistId === "string" ? req.params.playlistId : "";

  if (!userId || !playlistId) {
    return res.status(400).json({ ok: false, error: "MISSING_PARAMS" });
  }

  try {
    const playlist = await getPlaylistSummary(userId, playlistId);
    return res.json({ ok: true, playlist });
  } catch (err) {
    return mapSpotifyError(err, res);
  }
}

/**
 * Internal: GET /internal/users/:userId/spotify/playlists/:playlistId/tracks
 * Used by game-service to materialize a playlist owned by a lobby player.
 */
export async function getUserPlaylistTracksInternal(
  req: Request,
  res: Response,
) {
  const userId = typeof req.params.userId === "string" ? req.params.userId : "";
  const playlistId =
    typeof req.params.playlistId === "string" ? req.params.playlistId : "";

  if (!userId || !playlistId) {
    return res.status(400).json({ ok: false, error: "MISSING_PARAMS" });
  }

  try {
    const tracks = await listPlaylistTracks(userId, playlistId);
    return res.json({ ok: true, tracks });
  } catch (err) {
    return mapSpotifyError(err, res);
  }
}
