import type { Request, Response } from "express";
import crypto from "crypto";
import { handleSpotifyCallback } from "../services/spotifyAuth.service.js";
import {
  clearSpotifyStateCookie,
  setAuthCookies,
  setSpotifyStateCookie,
} from "../services/sessionCookies.service.js";
import {
  consumeOAuthState,
  storeOAuthState,
} from "../lib/oauthStateStore.js";

/**
 *
 * @brief Encodes a Buffer into a Base64URL string (RFC 4648, URL-safe Base64 variant).
 *
 * Converts standard Base64 output into the URL-safe form by:
 * - Replacing '+' with '-'
 * - Replacing '/' with '_'
 * - Removing trailing '=' padding
 *
 * This is commonly used to generate tokens (e.g., OAuth state/nonces) that can be safely placed in URLs
 * and cookies without requiring extra escaping.
 *
 * @param buf Raw bytes to encode.
 * @returns URL-safe Base64-encoded string without padding.
 *
 * @example
 * const state = base64Url(crypto.randomBytes(16));
 * // Example output: "Q3VwZl9aQk1Jb2t1d2x2eA"
 */
function base64Url(buf: Buffer) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

/**
 *
 * @brief Starts the Spotify OAuth login flow by generating a CSRF state, storing it as an HTTP-only cookie, and redirecting the user to Spotify's authorization endpoint.
 * @param _req Raw HTTP request (unused).
 * @param res HTTP response used to set the OAuth state cookie and redirect the client to Spotify.
 * @returns Redirect response to Spotify authorization URL. On configuration failure returns JSON { error: string } with HTTP 500.
 *
 * @example
 * // Browser navigation
 * // GET /api/auth/spotify/login
 */
export async function spotifyLogin(_req: Request, res: Response) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: "SPOTIFY_OAUTH_NOT_CONFIGURED" });
  }

  const state = base64Url(crypto.randomBytes(16));

  storeOAuthState(state);
  // Keep cookie for backwards compatibility; validation uses server-side store.
  setSpotifyStateCookie(res, state);

  const scope = [
    "user-read-email",
    "user-read-private",
    "user-top-read",
    "playlist-read-private",
    "playlist-read-collaborative",
  ].join(" ");

  const authorizeUrl = new URL("https://accounts.spotify.com/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("scope", scope);
  authorizeUrl.searchParams.set("show_dialog", "true");

  return res.redirect(authorizeUrl.toString());
}

/**
 *
 * @brief Handles the Spotify OAuth callback by validating the state and delegating the token exchange, user lookup, and session issuance to the service layer.
 * @param req Raw HTTP request containing the OAuth query params { code, state } and the state cookie.
 * @param res HTTP response where we set session cookies and redirect to the frontend.
 * @returns Redirect to {FRONTEND_URL}/auth/spotify/success on success. On failure returns JSON { ok?: boolean, error: string, details?: unknown } with the corresponding HTTP status.
 *
 * @example
 * // Spotify redirects back to your backend callback URL:
 * // GET /api/auth/spotify/callback?code=<CODE>&state=<STATE>
 */
export async function spotifyCallback(req: Request, res: Response) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return res.status(500).json({ error: "SPOTIFY_OAUTH_NOT_CONFIGURED" });
  }

  const frontendUrl = process.env.FRONTEND_URL;
  if (!frontendUrl) {
    return res
      .status(500)
      .json({ ok: false, error: "FRONTEND_URL_NOT_CONFIGURED" });
  }

  const code = typeof req.query.code === "string" ? req.query.code : null;
  const returnedState =
    typeof req.query.state === "string" ? req.query.state : null;
  const oauthError =
    typeof req.query.error === "string" ? req.query.error : null;

  if (oauthError === "access_denied") {
    if (returnedState) consumeOAuthState(returnedState);
    clearSpotifyStateCookie(res);
    return res.redirect(`${frontendUrl}/login?spotify=cancelled`);
  }

  if (!code) return res.status(400).json({ error: "MISSING_CODE" });
  if (!returnedState) return res.status(400).json({ error: "MISSING_STATE" });

  const cookieState: string | undefined = req.cookies?.spotify_oauth_state;

  try {
    const result = await handleSpotifyCallback({
      code,
      returnedState,
      cookieState,
      clientId,
      clientSecret,
      redirectUri,
    });

    setAuthCookies(res, {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });
    clearSpotifyStateCookie(res);

    return res.redirect(`${frontendUrl}/auth/spotify/success`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    const details =
      typeof err === "object" && err !== null && "details" in err
        ? err.details
        : undefined;

    if (msg === "INVALID_STATE") {
      clearSpotifyStateCookie(res);
      return res.status(401).json({ error: "INVALID_STATE" });
    }

    if (msg === "SPOTIFY_EMAIL_NOT_AVAILABLE") {
      return res
        .status(400)
        .json({ ok: false, error: "SPOTIFY_EMAIL_NOT_AVAILABLE" });
    }

    if (msg === "USER_NOT_REGISTERED") {
      return res.status(401).json({ ok: false, error: "USER_NOT_REGISTERED" });
    }

    // Errors thrown by spotify client include a `details` field.
    if (
      msg === "SPOTIFY_TOKEN_EXCHANGE_FAILED" ||
      msg === "SPOTIFY_ME_FAILED"
    ) {
      return res.status(502).json({ error: msg, details });
    }

    return res.status(500).json({ error: msg, details });
  }
}
