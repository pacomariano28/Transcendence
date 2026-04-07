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
    const response = await axios.post<AccessToken>(
        'https://accounts.spotify.com/api/token',
        new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: CLIENT_ID || '',
            client_secret: CLIENT_SECRET || ''
        }).toString(),
        {
            headers: {
                'Content-Type': 'pplication/x-www-form-urlencoded'
            }
        }
    )

    if (response.status !== 200) {
        console.error('Couldn\'t obtain an access token');
        throw new Error();
    }
    console.log("Spotify API access token was retrieved");

    const { access_token, expires_in } = response.data;

    // Calculate TTL in seconds (expires_in - 300 seconds for 5 min buffer)
    const ttlSeconds = expires_in - 300;

    const redis = getRedisClient();
    await redis.setEx('spotify_token', ttlSeconds, access_token);

    return access_token;
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
}

/**
 * @brief Searches Spotify for tracks matching the given term with deduplication.
 * 
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
}
