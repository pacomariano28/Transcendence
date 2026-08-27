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

function fisherYatesShuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

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
    try {
      return decryptToken(profile.accessTokenEnc);
    } catch {
      throw new Error("SPOTIFY_REAUTH_REQUIRED");
    }
  }

  if (!profile.refreshTokenEnc) {
    throw new Error("SPOTIFY_REAUTH_REQUIRED");
  }

  let refreshToken: string;
  try {
    refreshToken = decryptToken(profile.refreshTokenEnc);
  } catch {
    throw new Error("SPOTIFY_REAUTH_REQUIRED");
  }
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
  mode: "prep" | "preview" = "preview",
): Promise<SpotifyPlaylistTrack[]> {
  const accessToken = await getValidSpotifyAccessToken(userId);

  if (mode === "prep") {
    const tracks = await getPlaylistTracks(accessToken, playlistId, 150, {
      maxTracks: 150,
      targetPool: 150,
      maxPages: 3,
    });
    return fisherYatesShuffle(tracks);
  }

  return getPlaylistTracks(accessToken, playlistId, 30);
}

export async function getPlaylistSummary(
  userId: string,
  playlistId: string,
): Promise<SpotifyPlaylistSummary> {
  const accessToken = await getValidSpotifyAccessToken(userId);
  return getPlaylistMetadata(accessToken, playlistId);
}
