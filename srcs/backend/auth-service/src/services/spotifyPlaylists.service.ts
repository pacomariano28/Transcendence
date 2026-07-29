import { prisma } from "../lib/prisma.js";
import {
  getPlaylistMetadata,
  getPlaylistTracks,
  getUserPlaylists,
  refreshAccessToken,
  type SpotifyPlaylistSummary,
  type SpotifyPlaylistTrack,
} from "../clients/spotify.client.js";
import { decryptToken, encryptToken } from "../lib/tokenEncryption.js";

const TOKEN_SKEW_MS = 60_000;

async function getProfileOrThrow(userId: string) {
  const profile = await prisma.spotifyProfile.findUnique({
    where: { userId },
  });

  if (!profile?.refreshTokenEnc && !profile?.accessTokenEnc) {
    throw new Error("SPOTIFY_NOT_LINKED");
  }

  return profile;
}

/**
 * Returns a valid Spotify access token for the user, refreshing if needed.
 */
export async function getValidSpotifyAccessToken(
  userId: string,
): Promise<string> {
  const profile = await getProfileOrThrow(userId);
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("SPOTIFY_OAUTH_NOT_CONFIGURED");
  }

  const expiresAt = profile.tokenExpiresAt?.getTime() ?? 0;
  const stillValid =
    Boolean(profile.accessTokenEnc) && expiresAt > Date.now() + TOKEN_SKEW_MS;

  if (stillValid && profile.accessTokenEnc) {
    return decryptToken(profile.accessTokenEnc);
  }

  if (!profile.refreshTokenEnc) {
    throw new Error("SPOTIFY_REAUTH_REQUIRED");
  }

  const refreshToken = decryptToken(profile.refreshTokenEnc);
  const tokenJson = await refreshAccessToken({
    clientId,
    clientSecret,
    refreshToken,
  });

  const tokenExpiresAt = new Date(
    Date.now() + Math.max(0, tokenJson.expires_in - 60) * 1000,
  );

  await prisma.spotifyProfile.update({
    where: { userId },
    data: {
      accessTokenEnc: encryptToken(tokenJson.access_token),
      refreshTokenEnc: tokenJson.refresh_token
        ? encryptToken(tokenJson.refresh_token)
        : profile.refreshTokenEnc,
      tokenExpiresAt,
      tokenScope: tokenJson.scope ?? profile.tokenScope,
    },
  });

  return tokenJson.access_token;
}

export async function listUserPlaylists(
  userId: string,
): Promise<SpotifyPlaylistSummary[]> {
  const accessToken = await getValidSpotifyAccessToken(userId);
  return getUserPlaylists(accessToken, 30);
}

export async function listPlaylistTracks(
  userId: string,
  playlistId: string,
): Promise<SpotifyPlaylistTrack[]> {
  const accessToken = await getValidSpotifyAccessToken(userId);
  return getPlaylistTracks(accessToken, playlistId, 30);
}

export async function getPlaylistSummary(
  userId: string,
  playlistId: string,
): Promise<SpotifyPlaylistSummary> {
  const accessToken = await getValidSpotifyAccessToken(userId);
  return getPlaylistMetadata(accessToken, playlistId);
}
