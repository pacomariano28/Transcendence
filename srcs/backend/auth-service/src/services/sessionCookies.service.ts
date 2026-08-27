import type { Response } from "express";

/**
 *
 * @brief Sets the application's session cookies (access token and refresh token) as HTTP-only cookies.
 * @param res HTTP response where we will set the session cookies.
 * @param params Object containing { accessToken, refreshToken } to be stored in cookies.
 * @returns Does not return a value; it mutates the HTTP response by setting cookies.
 *
 * @example
 * // After successful authentication:
 * setAuthCookies(res, {
 *   accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   refreshToken: "rft_1234567890"
 * });
 */
export function setAuthCookies(
  res: Response,
  params: { accessToken: string; refreshToken: string }
) {
  // App session cookie used for authenticating API calls.
  res.cookie("access_token", params.accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60 * 1000,
  });

  // Long-lived cookie used to mint new access tokens.
  res.cookie("refresh_token", params.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

/**
 *
 * @brief Clears the application's session cookies.
 * @param res HTTP response where we will clear the session cookies.
 */
export function clearAuthCookies(res: Response) {
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/" });
}

/**
 *
 * @brief Stores the Spotify OAuth state value in an HTTP-only cookie for CSRF protection during the OAuth callback.
 * @param res HTTP response where we will set the OAuth state cookie.
 * @param state Random state string to persist until the OAuth callback is received.
 * @returns Does not return a value; it mutates the HTTP response by setting the cookie.
 *
 * @example
 * // Before redirecting to Spotify:
 * setSpotifyStateCookie(res, "random_state_value");
 */
export function setSpotifyStateCookie(res: Response, state: string) {
  res.cookie("spotify_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 5 * 60 * 1000,
    path: "/",
  });
}

/**
 *
 * @brief Clears the Spotify OAuth state cookie after the callback has been validated.
 * @param res HTTP response where we will clear the OAuth state cookie.
 * @returns Does not return a value; it mutates the HTTP response by clearing the cookie.
 *
 * @example
 * // After successful state validation:
 * clearSpotifyStateCookie(res);
 */
export function clearSpotifyStateCookie(res: Response) {
  res.clearCookie("spotify_oauth_state", {
    path: "/",
    secure: true,
    sameSite: "lax",
    httpOnly: true,
  });
}
