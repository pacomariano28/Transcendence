<<<<<<< HEAD
import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios";
import { getRedisClient } from "../lib/redis.js";
import {
  formatTrackName,
  getSearchGroupKey,
  isVersionVariant,
  normalizeSearchTitle,
} from "../utils/utils.js";

interface AccessToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface TrackData {
  track: string;
  artist: string;
  id: string;
  isrc: string;
}

const CLIENT_ID = process.env.CLIENT_ID ?? process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET =
  process.env.CLIENT_SECRET ?? process.env.SPOTIFY_CLIENT_SECRET;

/** Spotify Web API search limit (Dev Mode max since Feb 2026). */
const SEARCH_LIMIT_MAX = 10;
const MAX_LIMIT_FETCH = SEARCH_LIMIT_MAX;
/** Keep retries inside nginx/api proxy_read_timeout (30s). */
const SPOTIFY_REQUEST_TIMEOUT_MS = 8_000;
const SPOTIFY_RETRY_MAX_ATTEMPTS = 3;
const SPOTIFY_RETRY_BASE_DELAY_MS = 400;
const SPOTIFY_RETRY_MAX_DELAY_MS = 2_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfterMs(header: string | undefined): number | null {
  if (!header) return null;

  const asSeconds = Number(header);
  if (Number.isFinite(asSeconds) && asSeconds >= 0) {
    return Math.min(asSeconds * 1000, SPOTIFY_RETRY_MAX_DELAY_MS);
  }

  const asDate = Date.parse(header);
  if (!Number.isNaN(asDate)) {
    return Math.min(Math.max(asDate - Date.now(), 0), SPOTIFY_RETRY_MAX_DELAY_MS);
  }

  return null;
}

function backoffDelayMs(attempt: number, retryAfterMs: number | null): number {
  if (retryAfterMs !== null) return retryAfterMs;
  const exp = SPOTIFY_RETRY_BASE_DELAY_MS * 2 ** attempt;
  const jitter = Math.random() * SPOTIFY_RETRY_BASE_DELAY_MS;
  return Math.min(exp + jitter, SPOTIFY_RETRY_MAX_DELAY_MS);
}

function isRetryableSpotifyStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function readRetryAfterHeader(headers: AxiosResponse["headers"]): string | undefined {
  const raw = headers["retry-after"];
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0];
  return undefined;
}

/**
 * @brief GETs a Spotify Web API URL and retries 429/5xx with short backoff.
 *
 * @description
 * Respects Retry-After when present, capped so the caller still answers
 * before the 30s nginx proxy timeout. Network errors are retried the same way.
 */
async function spotifyGet<T>(
  url: string,
  config: Omit<AxiosRequestConfig, "validateStatus" | "url" | "timeout"> = {},
): Promise<AxiosResponse<T>> {
  let lastError: unknown;

  for (let attempt = 0; attempt < SPOTIFY_RETRY_MAX_ATTEMPTS; attempt++) {
    try {
      const response = await axios.get<T>(url, {
        ...config,
        timeout: SPOTIFY_REQUEST_TIMEOUT_MS,
        validateStatus: () => true,
      });

      if (!isRetryableSpotifyStatus(response.status)) {
        return response;
      }

      lastError = new Error(`SPOTIFY_HTTP_${response.status}`);
      if (attempt === SPOTIFY_RETRY_MAX_ATTEMPTS - 1) {
        return response;
      }

      const retryAfterMs = parseRetryAfterMs(
        readRetryAfterHeader(response.headers),
      );
      await sleep(backoffDelayMs(attempt, retryAfterMs));
    } catch (error: unknown) {
      lastError = error;
      if (attempt === SPOTIFY_RETRY_MAX_ATTEMPTS - 1) {
        throw error;
      }
      await sleep(backoffDelayMs(attempt, null));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("SPOTIFY_REQUEST_FAILED");
}

function logSpotifyError(context: string, status: number, data: unknown): void {
  const message =
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof (data as { error?: { message?: string } }).error?.message ===
      "string"
      ? (data as { error: { message: string } }).error.message
      : undefined;
  console.warn(
    `[spotify] ${context} failed (${status})${message ? `: ${message}` : ""}`,
  );
}

function clampSearchLimit(limit: number): number {
  return Math.min(Math.max(limit, 1), SEARCH_LIMIT_MAX);
}

type SpotifyPlaylistTrackEntry = {
  track?: {
    id?: string;
    name?: string;
    artists?: Array<{ name: string }>;
    external_ids?: { isrc?: string };
    album?: { images?: Array<{ url: string }> };
  } | null;
  item?: SpotifyPlaylistTrackEntry["track"];
};

function extractPlaylistTrackEntries(
  data: unknown,
): SpotifyPlaylistTrackEntry[] {
  const payload = data as {
    items?:
      SpotifyPlaylistTrackEntry[] | { items?: SpotifyPlaylistTrackEntry[] };
    tracks?: { items?: SpotifyPlaylistTrackEntry[] };
  };

  if (Array.isArray(payload.items)) {
    return payload.items;
  }

  if (
    payload.items &&
    typeof payload.items === "object" &&
    Array.isArray(payload.items.items)
  ) {
    return payload.items.items;
  }

  return payload.tracks?.items ?? [];
}

function collectPlaylistTrackIds(data: unknown): string[] {
  const ids: string[] = [];

  for (const entry of extractPlaylistTrackEntries(data)) {
    const track = entry?.item ?? entry?.track;
    if (track?.id) ids.push(track.id);
  }

  return ids;
}

type SpotifyFullTrack = {
  id: string;
  name: string;
  artists?: Array<{ name: string }>;
  external_ids?: { isrc?: string };
  duration_ms?: number;
  album?: { images?: Array<{ url: string }> };
};

const SPOTIFY_IDS_PER_REQUEST = 50;

async function fetchFullTracksByIds(
  token: string,
  trackIds: string[],
): Promise<SpotifyFullTrack[]> {
  const uniqueIds = [...new Set(trackIds.filter(Boolean))];
  const tracks: SpotifyFullTrack[] = [];

  for (let i = 0; i < uniqueIds.length; i += SPOTIFY_IDS_PER_REQUEST) {
    const chunk = uniqueIds.slice(i, i + SPOTIFY_IDS_PER_REQUEST);
    const response = await spotifyGet<{
      tracks?: Array<SpotifyFullTrack | null>;
    }>("https://api.spotify.com/v1/tracks", {
      params: { ids: chunk.join(",") },
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status !== 200) {
      logSpotifyError("Track batch unavailable", response.status, response.data);
      continue;
    }

    for (const track of response.data?.tracks ?? []) {
      if (track?.id && track.name) tracks.push(track);
    }
  }

  return tracks;
}

function mapFullTrackToPublicPlaylistTrack(
  track: SpotifyFullTrack,
): PublicPlaylistTrack {
  return {
    spotifyTrackId: track.id,
    name: track.name,
    artists: (track.artists ?? []).map((a) => a.name).join(", "),
    isrc: track.external_ids?.isrc ?? null,
    durationMs: track.duration_ms ?? null,
    imageUrl: track.album?.images?.[0]?.url ?? null,
  };
}

function readPlaylistTrackCount(data: {
  items?: { total?: number };
  tracks?: { total?: number };
}): number {
  return data.items?.total ?? data.tracks?.total ?? 0;
}
=======
import axios from 'axios';
import { getRedisClient } from '../lib/redis.js';
import { clearString, normalizeString } from '../utils/utils.js';

interface AccessToken {
    access_token: string;
    token_type: string;
    expires_in: number;
}

interface TrackData {
    track: string;
    artist: string;
    id: string;
}

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

const MAX_LIMIT_FETCH = 10;
>>>>>>> main

let tokenFetchPromise: Promise<string | null> | null = null;

/**
 * @brief Fetches a new Spotify API access token using Client Credentials flow.
 *
 * @details Makes an HTTP POST request to Spotify's token endpoint with the configured
 * client credentials. The returned token is automatically cached in Redis with a TTL
 * of (expires_in - 300) seconds to account for expiration buffer.
 *
 * @return A promise that resolves to the access token string on success
 * @throws Error if the HTTP response status is not 200 or if the request fails
 *
 * @see getSpotifyToken()
 */
async function fetchSpotifyToken(): Promise<string | null> {
<<<<<<< HEAD
  const response = await axios.post<AccessToken>(
    "https://accounts.spotify.com/api/token",
    new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID || "",
      client_secret: CLIENT_SECRET || "",
    }).toString(),
    {
      timeout: SPOTIFY_REQUEST_TIMEOUT_MS,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  if (response.status !== 200) {
    throw new Error("Couldn't obtain an access token");
  }
  console.log("Spotify API access token was retrieved");

  const { access_token, expires_in } = response.data;

  // Calculate TTL in seconds (expires_in - 300 seconds for 5 min buffer)
  const ttlSeconds = expires_in - 300;

  const redis = getRedisClient();
  await redis.setEx("spotify_token", ttlSeconds, access_token);

  return access_token;
=======
    const response = await axios.post<AccessToken>(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: CLIENT_ID || '',
            client_secret: CLIENT_SECRET || ''
        }).toString(),
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
    )

    if (response.status !== 200) {
        throw new Error('Couldn\'t obtain an access token');
    }
    console.log("Spotify API access token was retrieved");

    const { access_token, expires_in } = response.data;

    // Calculate TTL in seconds (expires_in - 300 seconds for 5 min buffer)
    const ttlSeconds = expires_in - 300;

    const redis = getRedisClient();
    await redis.setEx('spotify_token', ttlSeconds, access_token);

    return access_token;
>>>>>>> main
}

/**
 * @brief Retrieves a Spotify API access token, with caching and request deduplication.
 *
 * This function manages Spotify access token retrieval using the Client Credentials flow.
 * It implements a two-level caching strategy:
 * - Redis cache for persistent token storage across service instances
 * - In-memory promise lock to prevent duplicate concurrent token requests
 *
 * @details
 * The function first attempts to retrieve a cached token from Redis. If a valid cached
 * token exists, it is returned immediately. If no cache hit occurs and a token fetch is
 * already in progress (indicated by the module-level @c tokenFetchPromise), that existing
 * promise is returned instead of initiating a duplicate request. Otherwise, a new token
 * fetch is initiated via @ref fetchSpotifyToken().
 *
 * The @c tokenFetchPromise is reset in the finally block to ensure the in-memory lock
 * is released regardless of success or failure.
 *
 * @return A promise that resolves to:
 *         - A string containing the access token if successful
 *         - @c null if token retrieval fails or an error occurs
 *
 * @see fetchSpotifyToken()
 * @see getRedisClient()
 *
 * @note The Spotify token is cached in Redis with a TTL of (expires_in - 300) seconds
 *       to ensure tokens are refreshed before actual expiration.
 */
export async function getSpotifyToken(): Promise<string | null> {
<<<<<<< HEAD
  try {
    const redis = getRedisClient();
    const cachedToken = await redis.get("spotify_token");
    if (cachedToken) {
      return cachedToken;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[spotify] token cache read failed: ${message}`);
  }

  if (tokenFetchPromise) {
    return tokenFetchPromise;
  }

  tokenFetchPromise = (async () => {
    try {
      return await fetchSpotifyToken();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[spotify] token fetch failed: ${message}`);
      return null;
    } finally {
      tokenFetchPromise = null;
    }
  })();

  return tokenFetchPromise;
=======
    const redis = getRedisClient();

    const cachedToken = await redis.get('spotify_token');
    if (cachedToken) {
        // console.log(cachedToken);
        return cachedToken;
    }

    // Return the existing promise if a fetch is already in progress
    if (tokenFetchPromise) {
        return tokenFetchPromise;
    }

    try {
        tokenFetchPromise = fetchSpotifyToken();
        const newToken = await tokenFetchPromise;
        return newToken;
    } finally {
        tokenFetchPromise = null; // Reset lock regardless of success or failure
    }
>>>>>>> main
}

/**
 * @brief Fetches tracks from Spotify API with pagination support.
 *
 * @param term The search query term to send to Spotify
 * @param offset The pagination offset (starting result index)
 * @param token The Spotify API bearer token for authentication
 *
 * @return A promise that resolves to the Axios response object containing track results
 *
 * @note This function performs the actual API call without result deduplication.
 *       Use @ref searchTracks() for a high-level interface with deduplication.
 */
async function fetchTracks(term: string, offset: number, token: string | null) {
<<<<<<< HEAD
  return spotifyGet("https://api.spotify.com/v1/search", {
    params: {
      q: term,
      type: "track",
      market: "US",
      limit: MAX_LIMIT_FETCH,
      offset: offset,
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
=======
    const response = axios.get('https://api.spotify.com/v1/search', {
        params: {
            q: term,
            type: 'track',
            market: 'ES',
            limit: MAX_LIMIT_FETCH,
            offset: offset,
        },
        headers: {
            Authorization: `Bearer ${token}`
        }
    })

    if ((await response).status === 429) {
        console.log((await response).headers);
    }

    return response;
>>>>>>> main
}

/**
 * @brief Searches Spotify for tracks matching the given term with deduplication.
 *
<<<<<<< HEAD
 * @description
 * Fetches one search page (Dev Mode max 10) and returns up to 10 unique songs.
 * Remix/live/radio variants of the same song are grouped via getSearchGroupKey().
 * Transient Spotify failures return an empty list instead of throwing, so guess
 * search does not 502 through the gateway.
 */
export async function searchTracks(term: string): Promise<TrackData[]> {
  try {
    const token = await getSpotifyToken();
    if (!token) {
      return [];
    }

    const response = await fetchTracks(term, 0, token);
    if (response.status !== 200) {
      logSpotifyError("Track search", response.status, response.data);
      return [];
    }

    const results = (response.data?.tracks?.items ?? []).filter(
      (track): track is NonNullable<typeof track> =>
        Boolean(track && typeof track.name === "string" && track.id),
    );

    const uniqueTracks: TrackData[] = [];
    const seenGroupKeys = new Map<
      string,
      { index: number; isVariant: boolean }
    >();

    for (const track of results) {
      const rawTrackName: string = track.name;
      const rawArtistName: string = track.artists?.[0]?.name || "Unknown Artist";
      const isrc: string | undefined = track.external_ids?.isrc;

      if (!isrc) {
        continue;
      }

      const groupKey = getSearchGroupKey(rawTrackName, rawArtistName);
      const isVariant = isVersionVariant(rawTrackName);
      const nextTrack: TrackData = {
        track: normalizeSearchTitle(rawTrackName),
        artist: rawArtistName,
        id: track.id,
        isrc,
      };

      const existing = seenGroupKeys.get(groupKey);
      if (existing === undefined) {
        seenGroupKeys.set(groupKey, { index: uniqueTracks.length, isVariant });
        uniqueTracks.push(nextTrack);
        if (uniqueTracks.length === 10) {
          break;
        }
        continue;
      }

      if (existing.isVariant && !isVariant) {
        uniqueTracks[existing.index] = nextTrack;
        seenGroupKeys.set(groupKey, { index: existing.index, isVariant: false });
      }
    }

    return uniqueTracks;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[spotify] searchTracks failed: ${message}`);
    return [];
  }
}

export type TrackMetadata = {
  track: string;
  artist: string;
  imageUrl: string | null;
  spotifyUrl: string | null;
  id: string | null;
  isrc: string;
  durationMs: number | null;
};

/**
 * @brief Looks up a single track on Spotify by ISRC code.
 */
export async function lookupTrackByIsrc(
  isrc: string,
): Promise<TrackMetadata | null> {
  const token = await getSpotifyToken();
  if (!token) {
    return null;
  }

  const response = await spotifyGet<{
    tracks?: {
      items?: Array<{
        id?: string;
        name: string;
        artists?: Array<{ name: string }>;
        album?: { images?: Array<{ url: string }> };
        external_urls?: { spotify?: string };
        duration_ms?: number;
      }>;
    };
  }>("https://api.spotify.com/v1/search", {
    params: {
      q: `isrc:${isrc}`,
      type: "track",
      limit: 1,
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const track = response.data.tracks?.items?.[0];
  if (!track) {
    console.warn(`[spotify] No track found for ISRC ${isrc}`);
    return null;
  }

  return {
    track: formatTrackName(track.name),
    artist: track.artists?.[0]?.name || "Unknown Artist",
    imageUrl: track.album?.images?.[0]?.url ?? null,
    spotifyUrl: track.external_urls?.spotify ?? null,
    id: track.id ?? null,
    isrc,
    durationMs:
      typeof track.duration_ms === "number" ? track.duration_ms : null,
  };
}

export type PublicPlaylistMetadata = {
  id: string;
  name: string;
  imageUrl: string | null;
  trackCount: number;
  ownerName: string | null;
};

export type PublicPlaylistTrack = {
  spotifyTrackId: string;
  name: string;
  artists: string;
  isrc: string | null;
  durationMs: number | null;
  imageUrl: string | null;
};

/**
 * Fetches public playlist metadata via Client Credentials.
 */
export async function getPublicPlaylist(
  playlistId: string,
): Promise<PublicPlaylistMetadata | null> {
  const token = await getSpotifyToken();
  if (!token) return null;

  const response = await spotifyGet<{
    id?: string;
    name?: string;
    images?: Array<{ url: string }>;
    items?: { total?: number };
    tracks?: { total?: number };
    owner?: { display_name?: string };
  }>(`https://api.spotify.com/v1/playlists/${encodeURIComponent(playlistId)}`, {
    params: {
      fields: "id,name,images,items.total,tracks.total,owner.display_name",
    },
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status !== 200 || !response.data?.id) {
    logSpotifyError(
      `Playlist ${playlistId} unavailable`,
      response.status,
      response.data,
    );
    return null;
  }

  const data = response.data;
  return {
    id: data.id,
    name: data.name ?? "Playlist",
    imageUrl: data.images?.[0]?.url ?? null,
    trackCount: readPlaylistTrackCount(data),
    ownerName: data.owner?.display_name ?? null,
  };
}

const SPOTIFY_PLAYLIST_PAGE_SIZE = 50;
const PUBLIC_PLAYLIST_TRACKS_MAX = 100;

/**
 * Fetches up to `limit` tracks of a public playlist (with ISRC when present).
 */
export async function getPublicPlaylistTracks(
  playlistId: string,
  limit = 30,
): Promise<PublicPlaylistTrack[]> {
  const token = await getSpotifyToken();
  if (!token) {
    throw Object.assign(new Error("SPOTIFY_NOT_CONFIGURED"), {
      code: "SPOTIFY_NOT_CONFIGURED",
    });
  }

  const target = Math.min(Math.max(limit, 1), PUBLIC_PLAYLIST_TRACKS_MAX);
  const fields =
    "items(item(id),track(id))";
  const headers = { Authorization: `Bearer ${token}` };
  const encodedId = encodeURIComponent(playlistId);

  let resource: "items" | "tracks" = "items";
  const trackIds: string[] = [];
  let offset = 0;

  while (trackIds.length < target) {
    const pageLimit = Math.min(
      SPOTIFY_PLAYLIST_PAGE_SIZE,
      target - trackIds.length,
    );
    const requestConfig = {
      params: { limit: pageLimit, offset, fields },
      headers,
    };

    let response = await spotifyGet<unknown>(
      `https://api.spotify.com/v1/playlists/${encodedId}/${resource}`,
      requestConfig,
    );

    if (offset === 0 && response.status === 404 && resource === "items") {
      resource = "tracks";
      response = await spotifyGet<unknown>(
        `https://api.spotify.com/v1/playlists/${encodedId}/tracks`,
        requestConfig,
      );
    }

    if (response.status === 403) {
      console.warn(
        `[spotify] Playlist tracks ${playlistId} forbidden (403) — Client Credentials cannot read playlist items; use a linked Spotify user token instead.`,
      );
      throw Object.assign(new Error("SPOTIFY_PLAYLIST_FORBIDDEN"), {
        code: "SPOTIFY_PLAYLIST_FORBIDDEN",
      });
    }

    if (response.status !== 200) {
      logSpotifyError(
        `Playlist tracks ${playlistId} unavailable`,
        response.status,
        response.data,
      );
      break;
    }

    const pageIds = collectPlaylistTrackIds(response.data);
    if (pageIds.length === 0) break;

    trackIds.push(...pageIds);
    if (pageIds.length < pageLimit) break;
    offset += pageLimit;
  }

  if (trackIds.length === 0) return [];

  const fullTracks = await fetchFullTracksByIds(
    token,
    trackIds.slice(0, target),
  );

  return fullTracks.map(mapFullTrackToPublicPlaylistTrack);
}

export type PublicPlaylistSearchResult = {
  id: string;
  name: string;
  imageUrl: string | null;
  trackCount: number;
  ownerName: string;
  ownerId: string;
};

/**
 * Searches public playlists on Spotify.
 * Filters out Spotify-owned editorial playlists (often blocked by the Web API).
 */
export async function searchPlaylists(
  term: string,
  limit = SEARCH_LIMIT_MAX,
): Promise<PublicPlaylistSearchResult[]> {
  const token = await getSpotifyToken();
  if (!token) return [];

  const q = term.trim();
  if (!q) return [];

  const response = await spotifyGet<{
    playlists?: {
      items?: Array<{
        id?: string;
        name?: string;
        images?: Array<{ url: string }>;
        items?: { total?: number };
        tracks?: { total?: number };
        owner?: { id?: string; display_name?: string };
      }>;
    };
  }>("https://api.spotify.com/v1/search", {
    params: {
      q,
      type: "playlist",
      limit: clampSearchLimit(limit),
    },
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status !== 200) {
    logSpotifyError("Playlist search", response.status, response.data);
    return [];
  }

  const results: PublicPlaylistSearchResult[] = [];
  for (const item of response.data?.playlists?.items ?? []) {
    if (!item?.id || !item?.name) continue;
    const ownerId = String(item.owner?.id ?? "");
    if (ownerId.toLowerCase() === "spotify") continue;

    results.push({
      id: item.id,
      name: item.name,
      imageUrl: item.images?.[0]?.url ?? null,
      trackCount: readPlaylistTrackCount(item),
      ownerName: item.owner?.display_name || ownerId || "Unknown",
      ownerId,
    });
  }

  return results;
}

export type PublicAlbumSearchResult = {
  id: string;
  name: string;
  imageUrl: string | null;
  trackCount: number;
  ownerName: string;
  releaseDate: string | null;
};

/**
 * Searches albums on Spotify.
 */
export async function searchAlbums(
  term: string,
  limit = SEARCH_LIMIT_MAX,
): Promise<PublicAlbumSearchResult[]> {
  const token = await getSpotifyToken();
  if (!token) return [];

  const q = term.trim();
  if (!q) return [];

  const response = await spotifyGet<{
    albums?: {
      items?: Array<{
        id?: string;
        name?: string;
        images?: Array<{ url: string }>;
        total_tracks?: number;
        release_date?: string;
        artists?: Array<{ name?: string }>;
      }>;
    };
  }>("https://api.spotify.com/v1/search", {
    params: {
      q,
      type: "album",
      limit: clampSearchLimit(limit),
    },
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status !== 200) {
    logSpotifyError("Album search", response.status, response.data);
    return [];
  }

  const results: PublicAlbumSearchResult[] = [];
  for (const item of response.data?.albums?.items ?? []) {
    if (!item?.id || !item?.name) continue;
    const artists = (item.artists ?? [])
      .map((a: { name?: string }) => a.name)
      .filter(Boolean)
      .join(", ");

    results.push({
      id: item.id,
      name: item.name,
      imageUrl: item.images?.[0]?.url ?? null,
      trackCount: item.total_tracks ?? 0,
      ownerName: artists || "Unknown",
      releaseDate: item.release_date ?? null,
    });
  }

  return results;
}

export type CatalogSearchType = "all" | "album" | "playlist";

export type CatalogSearchResult = {
  albums: PublicAlbumSearchResult[];
  playlists: PublicPlaylistSearchResult[];
};

/**
 * Combined catalog search. Albums are returned first for the UI.
 */
export async function searchCatalog(
  term: string,
  type: CatalogSearchType = "all",
): Promise<CatalogSearchResult> {
  const wantAlbums = type === "all" || type === "album";
  const wantPlaylists = type === "all" || type === "playlist";

  const [albums, playlists] = await Promise.all([
    wantAlbums ? searchAlbums(term) : Promise.resolve([]),
    wantPlaylists ? searchPlaylists(term) : Promise.resolve([]),
  ]);

  return { albums, playlists };
}

/**
 * Fetches public album metadata via Client Credentials.
 */
export async function getPublicAlbum(
  albumId: string,
): Promise<PublicPlaylistMetadata | null> {
  const token = await getSpotifyToken();
  if (!token) return null;

  const response = await spotifyGet<{
    id?: string;
    name?: string;
    images?: Array<{ url: string }>;
    total_tracks?: number;
    tracks?: { total?: number };
    artists?: Array<{ name?: string }>;
  }>(`https://api.spotify.com/v1/albums/${encodeURIComponent(albumId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status !== 200 || !response.data?.id) {
    logSpotifyError(
      `Album ${albumId} unavailable`,
      response.status,
      response.data,
    );
    return null;
  }

  const data = response.data;
  const artists = (data.artists ?? [])
    .map((a: { name?: string }) => a.name)
    .filter(Boolean)
    .join(", ");

  return {
    id: data.id,
    name: data.name ?? "Album",
    imageUrl: data.images?.[0]?.url ?? null,
    trackCount: data.total_tracks ?? data.tracks?.total ?? 0,
    ownerName: artists || null,
  };
}

/**
 * Fetches album tracks with ISRC (album track list is simplified, so we
 * resolve full track objects in a second pass).
 */
export async function getPublicAlbumTracks(
  albumId: string,
  limit = 50,
): Promise<PublicPlaylistTrack[]> {
  const token = await getSpotifyToken();
  if (!token) return [];

  const albumTracksRes = await spotifyGet<{
    items?: Array<{ id?: string }>;
  }>(
    `https://api.spotify.com/v1/albums/${encodeURIComponent(albumId)}/tracks`,
    {
      params: {
        limit: Math.min(limit, 50),
      },
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  if (albumTracksRes.status !== 200) {
    logSpotifyError(
      `Album tracks ${albumId} unavailable`,
      albumTracksRes.status,
      albumTracksRes.data,
    );
    return [];
  }

  const trackIds: string[] = [];
  for (const item of albumTracksRes.data?.items ?? []) {
    if (item?.id) trackIds.push(item.id);
  }

  if (trackIds.length === 0) return [];

  const fullTracks = await fetchFullTracksByIds(token, trackIds.slice(0, 50));

  return fullTracks.map(mapFullTrackToPublicPlaylistTrack);
=======
 * @details Fetches tracks from two paginated result pages (20 total results) and
 * returns up to 10 unique tracks. Uniqueness is determined by comparing normalized
 * versions of track and artist names (case-insensitive, without special characters).
 *
 * Uses @ref normalizeString() to create identifiers for deduplication and
 * @ref clearString() to format display names.
 *
 * @param term The search query to find on Spotify
 *
 * @return A promise that resolves to an array of @c TrackData objects (max 10 unique tracks)
 *         containing track name, artist name, and Spotify track ID
 *
 * @see searchTracks()
 * @see normalizeString()
 * @see clearString()
 *
 * @note Results are limited to the Spanish market (@c market: 'ES')
 */
export async function searchTracks(term: string): Promise<TrackData[]> {
    const token = await getSpotifyToken();

    const [page1Response, page2Response] = await Promise.all([
        fetchTracks(term, 0, token),
        fetchTracks(term, MAX_LIMIT_FETCH, token),
    ]);

    const results = [
        ...page1Response.data.tracks.items,
        ...page2Response.data.tracks.items,
    ];

    const uniqueTracks: TrackData[] = [];
    const seenIdentifiers = new Set<string>();

    for (const track of results) {
        const rawTrackName: string = track.name;
        const rawArtistName: string = track.artists[0]?.name || 'Unknown Artist';

        // Create a normalized identifier for the Set
        const identifier = `${normalizeString(rawTrackName)}-${normalizeString(rawArtistName)}`;

        if (!seenIdentifiers.has(identifier)) {
            // console.log(`${clearString(rawTrackName)} - ${clearString(rawArtistName)}`);
            seenIdentifiers.add(identifier);
            uniqueTracks.push({
                track: clearString(rawTrackName),
                artist: rawArtistName,
                id: track.id,
            });
            if (uniqueTracks.length === 10) {
                break;
            }
        }
    }

    return uniqueTracks;
>>>>>>> main
}
