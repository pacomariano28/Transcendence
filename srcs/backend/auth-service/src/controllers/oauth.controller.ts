import type { Request, Response } from "express";
import crypto from "crypto";

function base64Url(buf: Buffer) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function spotifyLogin(_req: Request, res: Response) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: "SPOTIFY_OAUTH_NOT_CONFIGURED" });
  }

  const state = base64Url(crypto.randomBytes(16));

  // Local dev: http://localhost:4002 (no HTTPS) => secure: false
  res.cookie("spotify_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 5 * 60 * 1000, // 5 min
    path: "/",
  });

  const scope = ["user-read-email", "user-read-private", "user-top-read"].join(" ");

  const authorizeUrl = new URL("https://accounts.spotify.com/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("scope", scope);
  authorizeUrl.searchParams.set("show_dialog", "true");

  return res.redirect(authorizeUrl.toString());
}

export async function spotifyCallback(req: Request, res: Response) {
  const { code, state, error } = req.query;

  return res.status(200).json({
    ok: true,
    error,
    code: typeof code === "string" ? code : null,
    state: typeof state === "string" ? state : null,
  });
}
