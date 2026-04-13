import { Request, Response } from "express";

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
}
