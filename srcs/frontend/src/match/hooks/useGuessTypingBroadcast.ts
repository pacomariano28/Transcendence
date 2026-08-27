/**
 * Broadcasts the guesser's typed query to other players.
 *
 * Kept separate from Spotify search: only the input string is emitted, never
 * search results, selected tracks, or metadata. A short debounce batches
 * keystrokes without making the spectator view feel lagged.
 */
import { useCallback, useEffect, useRef } from "react";
import { socket } from "../../api/socket";
import {
  GUESS_TYPING_DEBOUNCE_MS,
  GUESS_TYPING_MAX_LENGTH,
} from "../constants";

type UseGuessTypingBroadcastOptions = {
  enabled: boolean;
  matchCode: string;
  hasSelectedTrack: boolean;
};

function sanitizeTypingText(text: string): string {
  return text.slice(0, GUESS_TYPING_MAX_LENGTH);
}

export function useGuessTypingBroadcast({
  enabled,
  matchCode,
  hasSelectedTrack,
}: UseGuessTypingBroadcastOptions) {
  const timerRef = useRef<number | null>(null);
  const lastEmittedRef = useRef("");
  const ignoreUntilEmptyRef = useRef(false);
  const enabledRef = useRef(enabled);
  const matchCodeRef = useRef(matchCode);

  useEffect(() => {
    enabledRef.current = enabled;
    matchCodeRef.current = matchCode;
  }, [enabled, matchCode]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const send = useCallback((text: string) => {
    if (!enabledRef.current) return;

    const sanitized = sanitizeTypingText(text);
    if (sanitized === lastEmittedRef.current) return;

    lastEmittedRef.current = sanitized;
    socket.emit("round:guess_typing", {
      matchId: matchCodeRef.current,
      text: sanitized,
    });
  }, []);

  useEffect(() => {
    if (enabled) return;

    clearTimer();
    lastEmittedRef.current = "";
    ignoreUntilEmptyRef.current = false;
  }, [enabled, clearTimer]);

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  const emitGuessTyping = useCallback(
    (text: string) => {
      if (!enabled) return;

      if (hasSelectedTrack) {
        ignoreUntilEmptyRef.current = true;
        return;
      }

      if (ignoreUntilEmptyRef.current) {
        if (text.trim() !== "") return;
        ignoreUntilEmptyRef.current = false;
      }

      const sanitized = sanitizeTypingText(text);
      if (sanitized === "") {
        clearTimer();
        send("");
        return;
      }

      clearTimer();
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        send(text);
      }, GUESS_TYPING_DEBOUNCE_MS);
    },
    [enabled, hasSelectedTrack, clearTimer, send],
  );

  return { emitGuessTyping };
}
