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
  images?: Array<{ url: string }>;
};

export type SpotifyArtist = {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  imageUrl: string | null;
};

export type SpotifyTrack = {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  popularity: number;
  imageUrl: string | null;
};

export type SpotifyTopArtistsResponse = {
  items: Array<{
    id: string;
    name: string;
    popularity: number;
  }>;
};

export type SpotifyTopTracksResponse = {
  items: Array<{
    id: string;
    name: string;
    popularity: number;
    artists: Array<{
      id: string;
      name: string;
    }>;
    album: {
      images?: Array<{
        url: string;
        height: number | null;
        width: number | null;
      }>;
    };
  }>;
};

export type SpotifyArtistDetails = {
  id: string;
  name: string;
  genres?: string[];
  popularity: number;
  images?: Array<{
    url: string;
    height: number | null;
    width: number | null;
  }>;
};

/**
 *
 * @brief Exchanges a Spotify authorization code for an access token by calling Spotify's token endpoint.
 * @param params Parameters required to perform the OAuth code exchange: { clientId, clientSecret, redirectUri, code }.
 * @returns Spotify token response. On success: { access_token, token_type, expires_in, scope?, refresh_token? }.
 * On failure throws an Error with message "SPOTIFY_TOKEN_EXCHANGE_FAILED" and a `details` property containing Spotify's error payload.
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
 * @returns Spotify user profile. On success: { id, email?, display_name? }.
 * On failure throws an Error with message "SPOTIFY_ME_FAILED" and a `details` property containing Spotify's response body.
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

/**
 *
 * @brief Fetches a single Spotify artist by ID using a Spotify access token.
 * @param accessToken Spotify access token to authenticate the request.
 * @param artistId Spotify artist ID.
 * @returns Artist details including genres. On failure throws an Error with message "SPOTIFY_ARTIST_FAILED" and a `details` property containing Spotify's response body.
 *
 * @example
 * // Fetch artist details
 * const artist = await getArtistById("BQD...", "4q3ewBCX7sLwd24euuV69X");
 */
export async function getArtistById(
  accessToken: string,
  artistId: string,
): Promise<SpotifyArtistDetails> {
  const res = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const json = (await res.json()) as SpotifyArtistDetails;

  if (!res.ok) {
    throw Object.assign(new Error("SPOTIFY_ARTIST_FAILED"), {
      details: json,
    });
  }

  return json;
}

/**
 *
 * @brief Fetches the user's top Spotify artists using a Spotify access token and enriches them with artist genres.
 * @param accessToken Spotify access token to authenticate the request.
 * @returns Array of normalized top artists with genre information. On failure throws an Error with message "SPOTIFY_TOP_ARTISTS_FAILED"
 * and a `details` property containing Spotify's response body.
 *
 * @remarks
 * This function first retrieves the top artists list, then fetches each artist's detailed profile to enrich the result with genres.
 *
 * @example
 * // Fetch the current user's top artists
 * const artists = await getTopArtists("BQD...");
 */
export async function getTopArtists(
  accessToken: string,
): Promise<SpotifyArtist[]> {
  const res = await fetch("https://api.spotify.com/v1/me/top/artists?limit=3", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const json = (await res.json()) as SpotifyTopArtistsResponse;

  if (!res.ok) {
    throw Object.assign(new Error("SPOTIFY_TOP_ARTISTS_FAILED"), {
      details: json,
    });
  }

  const detailedArtists = await Promise.all(
    json.items.map(async (artist) => {
      const details = await getArtistById(accessToken, artist.id);

      return {
        id: artist.id,
        name: artist.name,
        genres: details.genres ?? [],
        popularity: artist.popularity,
        imageUrl: details.images?.[0]?.url ?? null,
      };
    }),
  );

  return detailedArtists;
}

/**
 *
 * @brief Fetches the user's top Spotify tracks for a given time range and normalizes them for profile display.
 * @param accessToken Spotify access token to authenticate the request.
 * @param timeRange Spotify time range. Use "short_term" for recent tracks and "long_term" for all-time tracks.
 * @returns Array of normalized top tracks with album image and artist information. On failure throws an Error with message "SPOTIFY_TOP_TRACKS_FAILED"
 * and a `details` property containing Spotify's response body.
 *
 * @example
 * // Fetch the user's top tracks for the month
 * const tracks = await getTopTracks("BQD...", "short_term");
 */
export async function getTopTracks(
  accessToken: string,
  timeRange: "short_term" | "medium_term" | "long_term",
): Promise<SpotifyTrack[]> {
  const res = await fetch(
    `https://api.spotify.com/v1/me/top/tracks?limit=1&time_range=${timeRange}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  const json = (await res.json()) as SpotifyTopTracksResponse;

  if (!res.ok) {
    throw Object.assign(new Error("SPOTIFY_TOP_TRACKS_FAILED"), {
      details: json,
    });
  }

  return json.items.map((track) => ({
    id: track.id,
    name: track.name,
    artists: track.artists.map((artist) => ({
      id: artist.id,
      name: artist.name,
    })),
    popularity: track.popularity,
    imageUrl: track.album.images?.[0]?.url ?? null,
  }));
}

export type SpotifyPlaylistSummary = {
  id: string;
  name: string;
  imageUrl: string | null;
  trackCount: number;
  ownerName: string | null;
};

export type SpotifyPlaylistTrack = {
  spotifyTrackId: string;
  name: string;
  artists: string;
  isrc: string | null;
  imageUrl: string | null;
};

/**
 * Refreshes a Spotify access token using a refresh token.
 */
export async function refreshAccessToken(params: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<SpotifyTokenResponse> {
  const basic = Buffer.from(
    `${params.clientId}:${params.clientSecret}`,
  ).toString("base64");

  const body = new URLSearchParams();
  body.set("grant_type", "refresh_token");
  body.set("refresh_token", params.refreshToken);

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
    throw Object.assign(new Error("SPOTIFY_TOKEN_REFRESH_FAILED"), {
      details: tokenJson,
    });
  }

  return tokenJson;
}

/**
 * Lists the current user's playlists (first page, up to 50).
 */
export async function getUserPlaylists(
  accessToken: string,
  limit = 30,
): Promise<SpotifyPlaylistSummary[]> {
  const res = await fetch(
    `https://api.spotify.com/v1/me/playlists?limit=${Math.min(limit, 50)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  const json = (await res.json()) as {
    items?: Array<{
      id: string;
      name: string;
      images?: Array<{ url: string }>;
      tracks?: { total?: number };
      owner?: { display_name?: string };
    }>;
  };

  if (!res.ok) {
    throw Object.assign(new Error("SPOTIFY_PLAYLISTS_FAILED"), {
      details: json,
    });
  }

  return (json.items ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    imageUrl: item.images?.[0]?.url ?? null,
    trackCount: item.tracks?.total ?? 0,
    ownerName: item.owner?.display_name ?? null,
  }));
}

/**
 * Fetches the first `limit` tracks of a playlist, including ISRC when available.
 */
export async function getPlaylistTracks(
  accessToken: string,
  playlistId: string,
  limit = 30,
): Promise<SpotifyPlaylistTrack[]> {
  const res = await fetch(
    `https://api.spotify.com/v1/playlists/${encodeURIComponent(playlistId)}/tracks?limit=${Math.min(limit, 50)}&market=from_token`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  const json = (await res.json()) as {
    items?: Array<{
      track?: {
        id?: string;
        name?: string;
        artists?: Array<{ name: string }>;
        external_ids?: { isrc?: string };
        album?: { images?: Array<{ url: string }> };
      } | null;
    }>;
    error?: { message?: string; status?: number };
  };

  if (!res.ok) {
    throw Object.assign(new Error("SPOTIFY_PLAYLIST_TRACKS_FAILED"), {
      details: json,
    });
  }

  const tracks: SpotifyPlaylistTrack[] = [];

  for (const item of json.items ?? []) {
    const track = item.track;
    if (!track?.id || !track.name) continue;

    tracks.push({
      spotifyTrackId: track.id,
      name: track.name,
      artists: (track.artists ?? []).map((a) => a.name).join(", "),
      isrc: track.external_ids?.isrc ?? null,
      imageUrl: track.album?.images?.[0]?.url ?? null,
    });
  }

  return tracks;
}

/**
 * Fetches playlist metadata (name, cover, track count) with a user access token.
 * Works for public community playlists (user-created, not Spotify editorial).
 */
export async function getPlaylistMetadata(
  accessToken: string,
  playlistId: string,
): Promise<SpotifyPlaylistSummary> {
  const fields = "id,name,images,tracks.total,owner.display_name";
  const res = await fetch(
    `https://api.spotify.com/v1/playlists/${encodeURIComponent(playlistId)}?fields=${encodeURIComponent(fields)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  const json = (await res.json()) as {
    id?: string;
    name?: string;
    images?: Array<{ url: string }>;
    tracks?: { total?: number };
    owner?: { display_name?: string };
  };

  if (!res.ok || !json.id) {
    throw Object.assign(new Error("SPOTIFY_PLAYLIST_FAILED"), {
      details: json,
    });
  }

  return {
    id: json.id,
    name: json.name ?? "Playlist",
    imageUrl: json.images?.[0]?.url ?? null,
    trackCount: json.tracks?.total ?? 0,
    ownerName: json.owner?.display_name ?? null,
  };
}
