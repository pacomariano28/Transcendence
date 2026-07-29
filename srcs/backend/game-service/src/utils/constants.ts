export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
export const PLAYLIST_SERVICE_URL =
  process.env.PLAYLIST_SERVICE_URL || "http://playlist-service:4004";
export const CONTENT_SERVICE_URL =
  process.env.CONTENT_SERVICE_URL || "http://content-service:4003";
export const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://auth-service:4002";
export const ROUND_NUMBER = 5;
export const MAX_PLAYER = 5;
export const ROUND_COUNTDOWN_SECONDS = 5;
export const GUESS_WINDOW_SECONDS = 20;
export const COOLDOWN_SECONDS = 5;
export const RESOLUTION_SECONDS = 3;
export const BASE_SCORE = 100;
export const SPEED_MULTIPLIER = 10;
export const WRONG_GUESS_PENALTY = 50;
export const PLAYLIST_TIMEOUT_MS = 8000;
export const CLIP_PREP_TIMEOUT_MS = 90_000;
export const CLIP_PREP_POLL_MS = 2_000;
export const SECOND_MS = 1000;
export const DISCONNECT_TTL_MS = 3000;

export {
  GENRE_PLAYLISTS,
  SYSTEM_PLAYLIST_OWNER_ID,
  getGenrePlaylist,
  isSystemGenrePlaylist,
} from "./genrePlaylists.js";
