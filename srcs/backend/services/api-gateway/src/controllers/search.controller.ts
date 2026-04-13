import { Request, Response } from "express";
import axios from "axios";
import { logError } from "../lib/logger.js";

const CONTENT_SERVICE_URL = process.env.CONTENT_SERVICE_URL || 'http://content-service:4003';

export async function proxySearch(req: Request, res: Response): Promise<void> {
    try {
        const { term } = req.query;

        if (!term || typeof term !== 'string') {
            res.status(400).json({ error: "Missing or invalid 'term' query parameter " });
            return;
        }

        const response = await axios.get(`${CONTENT_SERVICE_URL}/internal/search`, {
            params: { term }
        });

        res.status(200).json(response.data);
    } catch (error: any) {
        const requestId = res.locals.requestId ?? null;
        const statusCode = error.response?.status || 500;
        logError({
            requestId,
            method: req.method,
            path: req.originalUrl,
            statusCode,
            errorName: error.name || "Error",
            errorMessage: error.message || "Proxy error",
            stack: error.stack,
        });
        res.status(statusCode).json({ error: 'Failed to fetch data from Content Service' });
    }
}
