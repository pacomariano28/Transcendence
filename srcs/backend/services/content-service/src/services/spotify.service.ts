import axios from 'axios';
import { getRedisClient } from '../lib/redis.js';

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
}

export async function getSpotifyToken(): Promise<string | null> {
    const redis = getRedisClient();

    const cachedToken = await redis.get('spotify_token');
    if (cachedToken) {
        console.log(cachedToken);
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

// let tokenPromise: Promise<string> | null = null;
// let tokenExpirationTime: number = 0;
// let isFetching: boolean = false;

/**
 * Retrieves an access token from Spotify using the Client Credentials flow.
 */
// async function getSpotifyToken(): Promise<string> {
//     const currentTime = Date.now();

//     // Return cached token if exists and is not within 5 minutes of expiring
//     if (tokenPromise && (isFetching || currentTime < tokenExpirationTime)) {
//         return tokenPromise;
//     }

//     isFetching = true;

//     tokenPromise = (async () => {
//         try {
//             const response = await axios.post<AccessToken>(
//                 'https://accounts.spotify.com/api/token',
//                 new URLSearchParams({
//                     grant_type: 'client_credentials',
//                     client_id: CLIENT_ID || '',
//                     client_secret: CLIENT_SECRET || ''
//                 }).toString(),
//                 {
//                     headers: {
//                         'Content-Type': 'application/x-www-form-urlencoded'
//                     }
//                 }
//             );

//             if (response.status !== 200) {
//                 throw new Error('Couldn\'t obtain an access token');
//             }

//             console.log("Spotify API access token was retrieved successfully");

//             const { access_token, expires_in } = response.data;

//             // Calculate expiration time in ms, minus a 300-second (5-minute) buffer
//             tokenExpirationTime = Date.now() + (expires_in - 300) * 1000;

//             return access_token;
//         } catch (error) {
//             tokenPromise = null;
//             tokenExpirationTime = 0;
//             isFetching = false;
//             throw error;
//         }
//     })();

//     return tokenPromise;
// }

function stripBrackets(input: string, opening: string): string {
    let result: string = "";
    let depth: number = 0;
    let closing: string = '';

    if (input.normalize())

        if (opening === '[') closing = ']';
        else if (opening === '(') closing = ')';

    for (let i = 0; i < input.length; i++) {
        const char = input[i];

        if (char === opening) {
            depth++;
        } else if (char === closing) {
            if (depth > 0) depth--;
        } else if (depth === 0) {
            // Only append characters when not inside any brackets
            result += char;
        }
    }

    return result;
}

function normalizeString(str: string): string {
    let result: string = '';

    result = stripBrackets(str, '(');
    result = stripBrackets(result, '[');

    return result
        .toLowerCase()
        .replace(/\s+[-–—]\s+.*/g, '') // Removes all after -, – or —
        .replace(/\s+/g, ''); // Removes all whitespace
}

function clearString(str: string): string {
    let result: string = '';

    result = stripBrackets(str, '(');
    result = stripBrackets(result, '[');

    return result
        .replace(/\s+[-–—]\s+.*/g, '') // Removes all after -, – or —
        .replace(/\s\s+/g, ' ') // Replace more than 1 whitespace with space
        .trim();
}

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
        console.log('hey');
        console.log((await response).headers);
    }

    return response;
}

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
