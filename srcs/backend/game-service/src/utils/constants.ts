export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
export const PLAYLIST_SERVICE_URL =
  process.env.PLAYLIST_SERVICE_URL || "http://playlist-service:4004";
export const CONTENT_SERVICE_URL =
  process.env.CONTENT_SERVICE_URL || "http://content-service:4003";
export const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://auth-service:4002";
export const ROUND_NUMBER = 5;
export const MIN_PLAYABLE_SONGS = 5;
export const TARGET_PREP_SONGS = 7;
export const FALLBACK_PREP_SONGS = 5;
/** Tracks considered for clip prep after shuffle (keeps Spotify + yt-dlp work bounded). */
export const PREP_CANDIDATE_POOL = 18;
/** Tracks enqueued for clip download in a single ensure-songs call. */
export const PREP_ENSURE_BATCH = 12;
export const MAX_PLAYER = 5;
export const ROUND_COUNTDOWN_SECONDS = 1;
export const GUESS_WINDOW_SECONDS = 20;
/** Max characters broadcast for live guess typing. Must stay text-only. */
export const GUESS_TYPING_MAX_LENGTH = 80;
export const COOLDOWN_SECONDS = 5;
export const RESOLUTION_SECONDS = 3;
export const BASE_SCORE = 100;
export const SPEED_MULTIPLIER = 10;
export const WRONG_GUESS_PENALTY = 50;
export const PLAYLIST_TIMEOUT_MS = 8000;
/** Playlist track materialization resolves many Spotify track IDs sequentially. */
export const AUTH_PLAYLIST_TRACKS_TIMEOUT_MS = 60_000;
export const CLIP_PREP_TIMEOUT_MS = 120_000;
/** Extra wait after the first prep pass to retry clips that failed transiently. */
export const CLIP_PREP_RETRY_WAIT_MS = 12_000;
export const CLIP_PREP_POLL_MS = 800;
export const CLIP_PREP_POLL_SLOW_MS = 1_500;
/** Switch to slower polling after this many milliseconds. */
export const CLIP_PREP_POLL_SLOW_AFTER_MS = 20_000;
export const SECOND_MS = 1000;
export const DISCONNECT_TTL_MS = 3000;

export {
  GENRE_PLAYLISTS,
  SYSTEM_PLAYLIST_OWNER_ID,
  getGenrePlaylist,
  isSystemGenrePlaylist,
} from "./genrePlaylists.js";

export {
  LOCAL_SEED_PLAYLIST,
  LOCAL_SEED_PLAYLIST_ID,
  isLocalSeedPlaylist,
} from "./localPlaylist.js";
export const FORCE_COUNTDOWN_MS = 5000;
/** Client-side audio fade when all players skip; server waits this long before reveal. */
export const SKIP_FADE_MS = 500;
