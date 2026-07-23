import { Request, Response } from "express";

import { searchTracks } from "../services/spotify.service.js";
import { logInfo } from "../lib/logger.js";

export async function getTracks(req: Request, res: Response): Promise<void> {
  try {
    // Extract the seach term from the query string
    const { term } = req.query;
    logInfo(`Search request received`);

    // Input validation
    if (!term || typeof term !== "string") {
      res.status(400).json({ error: "MISSING_PARAMETER" });
      return;
    }

    // Call the external API via spotifyService
    const tracks = await searchTracks(term);

    // Return data to the client
    res.status(200).json(tracks);
  } catch {
    res.status(502).json({ error: "ERROR_FETCHING_DATA_FROM_SPOTIFY" });
  }
}
