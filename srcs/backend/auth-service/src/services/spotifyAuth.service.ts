import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../lib/prisma.js";
import { issueRefreshToken } from "../lib/refreshTokens.js";
import { signAccessToken } from "../lib/jwt.js";
import {
  exchangeCodeForToken,
  getMe,
  getTopArtists,
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
 *
 * @brief Builds a ranked list of top genres from a list of Spotify artists.
 * @param artists Normalized Spotify artist list.
 * @returns Ranked array of genres in the form { name, weight }.
 *
 * @remarks
 * The weighting strategy favors earlier artists in the list by applying a simple inverse rank weight.
 *
 * @example
 * const topGenres = buildTopGenres(artists);
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

/**
 *
 * @brief Completes the Spotify OAuth callback flow by validating the state, exchanging the authorization code for a Spotify access token,
 * fetching the Spotify user profile, locating or creating the matching local user, syncing the user's Spotify profile, and issuing app access/refresh tokens.
 * @param input Service input containing OAuth callback data (code/state), the state cookie value, and Spotify client configuration.
 * @returns App session information on success: { accessToken: string, refreshToken: string, user: { id: string, email: string, username: string } }.
 *
 * @example
 * // Example call from a controller
 * await handleSpotifyCallback({
 *   code: "<spotify_code>",
 *   returnedState: "<state_from_query>",
 *   cookieState: "<state_from_cookie>",
 *   clientId: process.env.SPOTIFY_CLIENT_ID!,
 *   clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
 *   redirectUri: process.env.SPOTIFY_REDIRECT_URI!,
 * });
 */
export async function handleSpotifyCallback(
  input: SpotifyCallbackInput,
): Promise<SpotifyCallbackResult> {
  // Validar el estado (CSRF protection)
  if (!input.cookieState || input.cookieState !== input.returnedState) {
    throw new Error("INVALID_STATE");
  }

  // Intercambiar el código por un token de acceso
  const tokenJson = await exchangeCodeForToken({
    clientId: input.clientId,
    clientSecret: input.clientSecret,
    redirectUri: input.redirectUri,
    code: input.code,
  });

  // Obtener el perfil del usuario de Spotify
  const me = await getMe(tokenJson.access_token);

  if (!me.email) {
    throw new Error("SPOTIFY_EMAIL_NOT_AVAILABLE");
  }

  // Buscar al usuario en la base de datos
  let user = await prisma.user.findUnique({
    where: { email: me.email },
    select: { id: true, email: true, username: true },
  });

  // Si el usuario no existe, crearlo
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

  // Sync del perfil Spotify
  const topArtists = await getTopArtists(tokenJson.access_token);
  const topGenres = buildTopGenres(topArtists);

  await prisma.spotifyProfile.upsert({
    where: {
      userId: user.id,
    },
    create: {
      userId: user.id,
      spotifyUserId: me.id,
      displayName: me.display_name ?? null,
      email: me.email,
      topArtists,
      topGenres,
      syncedAt: new Date(),
    },
    update: {
      spotifyUserId: me.id,
      displayName: me.display_name ?? null,
      email: me.email,
      topArtists,
      topGenres,
      syncedAt: new Date(),
    },
  });

  // Issue app tokens (short-lived access token + long-lived refresh token).
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
