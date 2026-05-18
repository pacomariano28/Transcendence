export type SpotifyTokenResponse = {
  access_token: string;
  token_type: string;
  scope?: string;
  expires_in: number;
  refresh_token?: string;
  error?: string;
  error_description?: string;
};

export type SpotifyMe = {
  id: string;
  email?: string;
  display_name?: string;
};

/**
 *
 * @brief Exchanges a Spotify authorization code for an access token by calling Spotify's token endpoint.
 * @param params Parameters required to perform the OAuth code exchange: { clientId, clientSecret, redirectUri, code }.
 * @returns Spotify token response. On success: { access_token, token_type, expires_in, scope?, refresh_token? }. On failure throws an Error with message "SPOTIFY_TOKEN_EXCHANGE_FAILED" and a `details` property containing Spotify's error payload.
 *
 * @example
 * // Exchange an OAuth authorization code for tokens
 * const token = await exchangeCodeForToken({
 *   clientId: process.env.SPOTIFY_CLIENT_ID!,
 *   clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
 *   redirectUri: process.env.SPOTIFY_REDIRECT_URI!,
 *   code: "AQD...",
 * });
 */
export async function exchangeCodeForToken(params: {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  code: string;
}): Promise<SpotifyTokenResponse> {
  const basic = Buffer.from(
    `${params.clientId}:${params.clientSecret}`,
  ).toString("base64");

  const body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("code", params.code);
  body.set("redirect_uri", params.redirectUri);

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const tokenJson = (await tokenRes.json()) as SpotifyTokenResponse;

  if (!tokenRes.ok) {
    // Throw with details so the controller/service can map this to an upstream (502) error.
    throw Object.assign(new Error("SPOTIFY_TOKEN_EXCHANGE_FAILED"), {
      details: tokenJson,
    });
  }

  return tokenJson;
}

/**
 *
 * @brief Fetches the current Spotify user profile (/v1/me) using a Spotify access token.
 * @param accessToken Spotify access token to authenticate the request.
 * @returns Spotify user profile. On success: { id, email?, display_name? }. On failure throws an Error with message "SPOTIFY_ME_FAILED" and a `details` property containing Spotify's response body.
 *
 * @example
 * // Fetch current Spotify profile
 * const me = await getMe("BQD...");
 */
export async function getMe(accessToken: string): Promise<SpotifyMe> {
  const meRes = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const me = (await meRes.json()) as SpotifyMe;

  if (!meRes.ok) {
    throw Object.assign(new Error("SPOTIFY_ME_FAILED"), { details: me });
  }

  return me;
}
