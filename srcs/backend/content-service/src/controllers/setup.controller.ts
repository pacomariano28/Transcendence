import type { Request, Response } from "express";
import { getSpotifyToken } from "../services/spotify.service.js";

const PLACEHOLDER_MARKERS = [
  "example",
  "your_client_id",
  "your_client_id_here",
  "your_client_id_secret",
];

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return PLACEHOLDER_MARKERS.some((marker) => normalized.includes(marker));
}

export async function getSetupStatus(_req: Request, res: Response): Promise<void> {
  const clientId = process.env.CLIENT_ID ?? process.env.SPOTIFY_CLIENT_ID;
  const clientSecret =
    process.env.CLIENT_SECRET ?? process.env.SPOTIFY_CLIENT_SECRET;
  const credentialsConfigured =
    !isPlaceholder(clientId) && !isPlaceholder(clientSecret);

  let searchOk = false;
  if (credentialsConfigured) {
    try {
      const token = await getSpotifyToken();
      searchOk = Boolean(token);
    } catch {
      searchOk = false;
    }
  }

  res.status(200).json({
    ok: credentialsConfigured && searchOk,
    credentialsConfigured,
    searchOk,
  });
}
