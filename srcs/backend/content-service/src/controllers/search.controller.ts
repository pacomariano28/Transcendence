import { Request, Response } from "express";

<<<<<<< HEAD
import {
  searchAlbums,
  searchCatalog,
  searchPlaylists,
  searchTracks,
  type CatalogSearchType,
} from "../services/spotify.service.js";
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

export async function getPlaylists(req: Request, res: Response): Promise<void> {
  try {
    const { term } = req.query;
    logInfo(`Playlist search request received`);

    if (!term || typeof term !== "string") {
      res.status(400).json({ ok: false, error: "MISSING_PARAMETER" });
      return;
    }

    const playlists = await searchPlaylists(term);
    res.status(200).json({ ok: true, playlists });
  } catch {
    res
      .status(502)
      .json({ ok: false, error: "ERROR_FETCHING_DATA_FROM_SPOTIFY" });
  }
}

export async function getAlbums(req: Request, res: Response): Promise<void> {
  try {
    const { term } = req.query;
    logInfo(`Album search request received`);

    if (!term || typeof term !== "string") {
      res.status(400).json({ ok: false, error: "MISSING_PARAMETER" });
      return;
    }

    const albums = await searchAlbums(term);
    res.status(200).json({ ok: true, albums });
  } catch {
    res
      .status(502)
      .json({ ok: false, error: "ERROR_FETCHING_DATA_FROM_SPOTIFY" });
  }
}

function parseCatalogType(raw: unknown): CatalogSearchType {
  if (raw === "album" || raw === "playlist" || raw === "all") return raw;
  return "all";
}

export async function getCatalog(req: Request, res: Response): Promise<void> {
  try {
    const { term, type } = req.query;
    logInfo(`Catalog search request received`);

    if (!term || typeof term !== "string") {
      res.status(400).json({ ok: false, error: "MISSING_PARAMETER" });
      return;
    }

    const catalog = await searchCatalog(term, parseCatalogType(type));
    res.status(200).json({ ok: true, ...catalog });
  } catch {
    res
      .status(502)
      .json({ ok: false, error: "ERROR_FETCHING_DATA_FROM_SPOTIFY" });
  }
=======
import { searchTracks } from "../services/spotify.service.js"
import { logError, logInfo } from "../lib/logger.js";

export async function getTracks(req: Request, res: Response): Promise<void> {
    try {
        // Extract the seach term from the query string
        const { term } = req.query;
        logInfo(`Search request received`);

        // Input validation
        if (!term || typeof term !== 'string') {
            res.status(400).json({ error: "Missing or invalid 'term' query parameter" })
            return;
        }

        // Call the external API via spotifyService
        const tracks = await searchTracks(term);

        // Return data to the client
        res.status(200).json(tracks);
    } catch (error: any) {
        // Global error handling for this endpoint
        logError({
            method: req.method,
            path: req.originalUrl,
            statusCode: error.response?.status || 500,
            errorName: error.name || "Error",
            errorMessage: error.response?.data?.error?.message || error.message,
            stack: error.stack,
        });
        const statusCode = error.response?.status || 500;
        res.status(statusCode).json({ error: 'Failed to fetch data from Spotify API' });
    }
>>>>>>> main
}
