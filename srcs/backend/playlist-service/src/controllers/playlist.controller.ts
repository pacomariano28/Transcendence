import type { Request, Response } from "express";
import { generateRandomPlaylist } from "../services/playlistGenerator.js";

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
