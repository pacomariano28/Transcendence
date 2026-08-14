import type { Request, Response } from "express";
import {
  countAvailableSongs,
  generateRandomPlaylist,
  getSongsByIsrcs,
  selectRandomSongs,
  selectSeedSongs,
} from "../services/playlistGenerator.js";
import {
  markPlaylistTracksUsed,
  orderTracksByPlaylistUsage,
  releasePlaylistTracks,
} from "../services/playlistTrackUsage.service.js";
import {
  ensureTracks,
  type EnsureTrackInput,
} from "../services/clipWorker.service.js";
import { mediaFileExists } from "../lib/mediaFiles.js";

export async function getAvailableSongCount(req: Request, res: Response) {
  try {
    const count = await countAvailableSongs();
    return res.status(200).json({ ok: true, count });
  } catch (err) {
    console.error("[playlist-service] Error in getAvailableSongCount:", err);
    return res.status(500).json({ ok: false, error: "INTERNAL_SERVER_ERROR" });
  }
}

export async function getRandomSongs(req: Request, res: Response) {
  try {
    const rawCount = Number(req.query.count);
    const count = Number.isFinite(rawCount) ? Math.floor(rawCount) : 0;

    if (count <= 0 || count > 20) {
      return res.status(400).json({ ok: false, error: "INVALID_COUNT" });
    }

    const excludeParam = req.query.exclude;
    const excludeIsrcs =
      typeof excludeParam === "string" && excludeParam.length > 0
        ? excludeParam.split(",").map((isrc) => isrc.trim()).filter(Boolean)
        : [];

    const songs = await selectRandomSongs(count, excludeIsrcs);

    return res.status(200).json({ ok: true, songs });
  } catch (err) {
    console.error("[playlist-service] Error in getRandomSongs:", err);
    return res.status(500).json({ ok: false, error: "INTERNAL_SERVER_ERROR" });
  }
}

export async function getPlaylist(req: Request, res: Response) {
  try {
    const playlist = await generateRandomPlaylist();

    if (!playlist) {
      return res
        .status(400)
        .json({ ok: false, error: "NOT_ENOUGH_SONGS_AVAILABLE" });
    }

    return res.status(200).json({ ok: true, ...playlist });
  } catch (err) {
    console.error("[playlist-service] Error in getPlaylist:", err);
    return res.status(500).json({ ok: false, error: "INTERNAL_SERVER_ERROR" });
  }
}

/**
 * POST /ensure-songs
 * Body: { tracks: [{ isrc, title?, artist?, spotifyTrackId? }] }
 */
export async function ensureSongs(req: Request, res: Response) {
  try {
    const tracks = Array.isArray(req.body?.tracks)
      ? (req.body.tracks as EnsureTrackInput[])
      : null;

    if (!tracks || tracks.length === 0) {
      return res.status(400).json({ ok: false, error: "INVALID_TRACKS" });
    }

    if (tracks.length > 50) {
      return res.status(400).json({ ok: false, error: "TOO_MANY_TRACKS" });
    }

    const results = await ensureTracks(tracks);
    const ready = results.filter((r) => r.status === "ready");
    const pending = results.filter((r) => r.status === "pending");
    const failed = results.filter((r) => r.status === "failed");

    return res.status(200).json({
      ok: true,
      results,
      summary: {
        ready: ready.length,
        pending: pending.length,
        failed: failed.length,
      },
    });
  } catch (err) {
    console.error("[playlist-service] Error in ensureSongs:", err);
    return res.status(500).json({ ok: false, error: "INTERNAL_SERVER_ERROR" });
  }
}

/**
 * GET /songs-status?isrcs=a,b,c
 */
export async function getSeedSongs(req: Request, res: Response) {
  try {
    const rawCount = Number(req.query.count);
    const count = Number.isFinite(rawCount) ? Math.floor(rawCount) : 0;

    if (count <= 0 || count > 20) {
      return res.status(400).json({ ok: false, error: "INVALID_COUNT" });
    }

    const songs = await selectSeedSongs(count);

    if (songs.length === 0) {
      return res
        .status(400)
        .json({ ok: false, error: "NOT_ENOUGH_SONGS_AVAILABLE" });
    }

    return res.status(200).json({ ok: true, songs });
  } catch (err) {
    console.error("[playlist-service] Error in getSeedSongs:", err);
    return res.status(500).json({ ok: false, error: "INTERNAL_SERVER_ERROR" });
  }
}

export async function getSongsStatus(req: Request, res: Response) {
  try {
    const raw = typeof req.query.isrcs === "string" ? req.query.isrcs : "";
    const isrcs = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 50);

    if (isrcs.length === 0) {
      return res.status(400).json({ ok: false, error: "INVALID_ISRCS" });
    }

    const songs = await getSongsByIsrcs(isrcs);

    const results = await Promise.all(
      songs.map(async (song) => ({
        isrc: song.isrc,
        status: song.status,
        fileName: song.fileName,
        failReason: song.failReason,
        mediaPlayable:
          song.status === "ready" &&
          Boolean(song.fileName) &&
          (await mediaFileExists(song.fileName)),
      })),
    );

    return res.status(200).json({
      ok: true,
      results,
    });
  } catch (err) {
    console.error("[playlist-service] Error in getSongsStatus:", err);
    return res.status(500).json({ ok: false, error: "INTERNAL_SERVER_ERROR" });
  }
}

export async function orderPlaylistTracks(req: Request, res: Response) {
  try {
    const playlistKey =
      typeof req.body?.playlistKey === "string"
        ? req.body.playlistKey.trim()
        : "";
    const tracks = Array.isArray(req.body?.tracks) ? req.body.tracks : null;

    if (!playlistKey || !tracks || tracks.length === 0) {
      return res.status(400).json({ ok: false, error: "INVALID_REQUEST" });
    }

    const normalized = tracks
      .map((track: { isrc?: string; title?: string; artist?: string; spotifyTrackId?: string }) => ({
        isrc: track.isrc?.trim() ?? "",
        title: track.title ?? null,
        artist: track.artist ?? null,
        spotifyTrackId: track.spotifyTrackId ?? null,
      }))
      .filter((track) => track.isrc.length > 0);

    if (normalized.length === 0) {
      return res.status(400).json({ ok: false, error: "INVALID_TRACKS" });
    }

    const ordered = await orderTracksByPlaylistUsage(playlistKey, normalized);

    return res.status(200).json({ ok: true, tracks: ordered });
  } catch (err) {
    console.error("[playlist-service] Error in orderPlaylistTracks:", err);
    return res.status(500).json({ ok: false, error: "INTERNAL_SERVER_ERROR" });
  }
}

export async function markPlaylistUsage(req: Request, res: Response) {
  try {
    const playlistKey =
      typeof req.body?.playlistKey === "string"
        ? req.body.playlistKey.trim()
        : "";
    const isrcs = Array.isArray(req.body?.isrcs)
      ? req.body.isrcs
          .map((isrc: unknown) => (typeof isrc === "string" ? isrc.trim() : ""))
          .filter(Boolean)
      : [];

    if (!playlistKey || isrcs.length === 0) {
      return res.status(400).json({ ok: false, error: "INVALID_REQUEST" });
    }

    await markPlaylistTracksUsed(playlistKey, isrcs);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[playlist-service] Error in markPlaylistUsage:", err);
    return res.status(500).json({ ok: false, error: "INTERNAL_SERVER_ERROR" });
  }
}

export async function releasePlaylistUsage(req: Request, res: Response) {
  try {
    const playlistKey =
      typeof req.body?.playlistKey === "string"
        ? req.body.playlistKey.trim()
        : "";
    const isrcs = Array.isArray(req.body?.isrcs)
      ? req.body.isrcs
          .map((isrc: unknown) => (typeof isrc === "string" ? isrc.trim() : ""))
          .filter(Boolean)
      : [];

    if (!playlistKey || isrcs.length === 0) {
      return res.status(400).json({ ok: false, error: "INVALID_REQUEST" });
    }

    await releasePlaylistTracks(playlistKey, isrcs);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[playlist-service] Error in releasePlaylistUsage:", err);
    return res.status(500).json({ ok: false, error: "INTERNAL_SERVER_ERROR" });
  }
}
