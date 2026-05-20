import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../lib/prisma.js";
import { issueRefreshToken } from "../lib/refreshTokens.js";
import { signAccessToken } from "../lib/jwt.js";
import {
  exchangeCodeForToken,
  getMe,
  getTopArtists,
  getTopTracks,
  type SpotifyArtist,
} from "../clients/spotify.client.js";

export type SpotifyCallbackInput = {
  code: string;
  returnedState: string;
  cookieState: string | undefined;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export type SpotifyCallbackResult = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string;
  };
};

/**
 * Builds a ranked list of top genres from a list of Spotify artists.
 */
function buildTopGenres(
  artists: SpotifyArtist[],
): Array<{ name: string; weight: number }> {
  const counter = new Map<string, number>();

  artists.forEach((artist, index) => {
    const artistWeight = 1 / (index + 1);

    for (const genre of artist.genres) {
      counter.set(genre, (counter.get(genre) ?? 0) + artistWeight);
    }
  });

  return [...counter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, weight]) => ({ name, weight }));
}

export async function handleSpotifyCallback(
  input: SpotifyCallbackInput,
): Promise<SpotifyCallbackResult> {
  if (!input.cookieState || input.cookieState !== input.returnedState) {
    throw new Error("INVALID_STATE");
  }

  const tokenJson = await exchangeCodeForToken({
    clientId: input.clientId,
    clientSecret: input.clientSecret,
    redirectUri: input.redirectUri,
    code: input.code,
  });

  const me = await getMe(tokenJson.access_token);

  if (!me.email) {
    throw new Error("SPOTIFY_EMAIL_NOT_AVAILABLE");
  }

  let user = await prisma.user.findUnique({
    where: { email: me.email },
    select: { id: true, email: true, username: true },
  });

  if (!user) {
    const hashedPassword = await bcrypt.hash(
      crypto.randomBytes(12).toString("hex"),
      10,
    );

    user = await prisma.user.create({
      data: {
        email: me.email,
        username: me.display_name || me.email.split("@")[0],
        passwordHash: hashedPassword,
      },
      select: { id: true, email: true, username: true },
    });
  }

  const topArtists = await getTopArtists(tokenJson.access_token);
  const topGenres = buildTopGenres(topArtists);

  const [topTrackMonth, topTrackAllTime] = await Promise.all([
    getTopTracks(tokenJson.access_token, "short_term"),
    getTopTracks(tokenJson.access_token, "long_term"),
  ]);

  await prisma.spotifyProfile.upsert({
    where: {
      userId: user.id,
    },
    create: {
      userId: user.id,
      spotifyUserId: me.id,
      displayName: me.display_name ?? null,
      email: me.email,
      avatarUrl: me.images?.[0]?.url ?? null,
      topArtists,
      topGenres,
      topTrackMonth,
      topTrackAllTime,
      syncedAt: new Date(),
    },
    update: {
      spotifyUserId: me.id,
      displayName: me.display_name ?? null,
      email: me.email,
      avatarUrl: me.images?.[0]?.url ?? null,
      topArtists,
      topGenres,
      topTrackMonth,
      topTrackAllTime,
      syncedAt: new Date(),
    },
  });

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    username: user.username,
  });
  const issued = await issueRefreshToken(user.id);

  return {
    accessToken,
    refreshToken: issued.refreshToken,
    user,
  };
}
