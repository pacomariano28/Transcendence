import { Request, Response } from "express";
import axios from "axios";

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
        console.error('Proxy error', error.message);
        const statusCode = error.response?.status || 500;
        res.status(statusCode).json({ error: 'Failed to fetch data from Content Service' });
    }
}
