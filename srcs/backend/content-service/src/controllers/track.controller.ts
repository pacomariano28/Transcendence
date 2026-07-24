import { Request, Response } from "express";

import { lookupTrackByIsrc } from "../services/spotify.service.js";
import { logInfo } from "../lib/logger.js";

export async function getTrackByIsrc(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { isrc } = req.query;
    logInfo("Track lookup request received");

    if (!isrc || typeof isrc !== "string") {
      res.status(400).json({ error: "MISSING_PARAMETER" });
      return;
    }

    const track = await lookupTrackByIsrc(isrc);
    if (!track) {
      res.status(404).json({ error: "TRACK_NOT_FOUND" });
      return;
    }

    res.status(200).json(track);
  } catch {
    res.status(502).json({ error: "ERROR_FETCHING_DATA_FROM_SPOTIFY" });
  }
}
