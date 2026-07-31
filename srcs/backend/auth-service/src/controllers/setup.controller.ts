import type { Request, Response } from "express";

const PLACEHOLDER_MARKERS = [
  "example",
  "your_client_id",
  "your_client_id_here",
  "your_client_id_secret",
  "change-me",
];

function isPlaceholder(value: string | undefined): boolean {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return PLACEHOLDER_MARKERS.some((marker) => normalized.includes(marker));
}

/**
 * Lightweight setup probe for the auth service (OAuth credentials + redirect URI).
 */
export function getSetupStatus(req: Request, res: Response): void {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI ?? "";
  const origin =
    typeof req.query.origin === "string" ? req.query.origin.trim() : "";

  const oauthConfigured =
    !isPlaceholder(clientId) && !isPlaceholder(clientSecret);

  const redirectMatches = !origin || redirectUri.startsWith(origin);

  res.status(200).json({
    ok: oauthConfigured,
    oauthConfigured,
    redirectUri: redirectUri || null,
    redirectMatches,
    tokenEncryptionConfigured: !isPlaceholder(process.env.TOKEN_ENCRYPTION_KEY),
  });
}
