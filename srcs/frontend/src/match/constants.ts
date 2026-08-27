export const SECOND_MS = 1000;

/** Short debounce for live guess typing sync. Search debounce stays independent. */
export const GUESS_TYPING_DEBOUNCE_MS = 50;

/** Must match game-service GUESS_TYPING_MAX_LENGTH. Text only, no search payloads. */
export const GUESS_TYPING_MAX_LENGTH = 80;

/** Audio fade duration when all players skip (must match backend SKIP_FADE_MS). */
export const SKIP_FADE_MS = 500;

export { PAGE_EXIT_MS } from "../constants/pageTransitions";
