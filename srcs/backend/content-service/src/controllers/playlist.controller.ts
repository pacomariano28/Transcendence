import type { Request, Response } from "express";
import {
  getPublicAlbum,
  getPublicAlbumTracks,
  getPublicPlaylist,
  getPublicPlaylistTracks,
} from "../services/spotify.service.js";

export async function getPlaylist(req: Request, res: Response) {
  try {
    const playlistId =
      typeof req.params.playlistId === "string" ? req.params.playlistId : "";
    if (!playlistId) {
      return res.status(400).json({ ok: false, error: "MISSING_PLAYLIST_ID" });
    }

    const playlist = await getPublicPlaylist(playlistId);
    if (!playlist) {
      return res.status(404).json({ ok: false, error: "PLAYLIST_NOT_FOUND" });
    }

    return res.status(200).json({ ok: true, playlist });
  } catch (err) {
    console.error("[content-service] getPlaylist error:", err);
    return res.status(500).json({ ok: false, error: "INTERNAL_SERVER_ERROR" });
  }
}

export async function getPlaylistTracks(req: Request, res: Response) {
  try {
    const playlistId =
      typeof req.params.playlistId === "string" ? req.params.playlistId : "";
    if (!playlistId) {
      return res.status(400).json({ ok: false, error: "MISSING_PLAYLIST_ID" });
    }

    const rawLimit = Number(req.query.limit);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(100, Math.max(1, Math.floor(rawLimit)))
      : 30;

    const tracks = await getPublicPlaylistTracks(playlistId, limit);
    return res.status(200).json({ ok: true, tracks });
  } catch (err) {
    console.error("[content-service] getPlaylistTracks error:", err);
    const code =
      err instanceof Error &&
      "code" in err &&
      typeof (err as Error & { code?: string }).code === "string"
        ? (err as Error & { code: string }).code
        : "SPOTIFY_PLAYLIST_TRACKS_FAILED";
    return res.status(502).json({ ok: false, error: code });
  }
}

export async function getAlbum(req: Request, res: Response) {
  try {
    const albumId =
      typeof req.params.albumId === "string" ? req.params.albumId : "";
    if (!albumId) {
      return res.status(400).json({ ok: false, error: "MISSING_ALBUM_ID" });
    }

    const album = await getPublicAlbum(albumId);
    if (!album) {
      return res.status(404).json({ ok: false, error: "ALBUM_NOT_FOUND" });
    }

    return res.status(200).json({ ok: true, album });
  } catch (err) {
    console.error("[content-service] getAlbum error:", err);
    return res.status(500).json({ ok: false, error: "INTERNAL_SERVER_ERROR" });
  }
}

export async function getAlbumTracks(req: Request, res: Response) {
  try {
    const albumId =
      typeof req.params.albumId === "string" ? req.params.albumId : "";
    if (!albumId) {
      return res.status(400).json({ ok: false, error: "MISSING_ALBUM_ID" });
    }

    const rawLimit = Number(req.query.limit);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(50, Math.max(1, Math.floor(rawLimit)))
      : 50;

    const tracks = await getPublicAlbumTracks(albumId, limit);
    return res.status(200).json({ ok: true, tracks });
  } catch (err) {
    console.error("[content-service] getAlbumTracks error:", err);
    return res.status(500).json({ ok: false, error: "INTERNAL_SERVER_ERROR" });
  }
}
