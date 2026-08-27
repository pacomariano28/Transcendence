/**
 * Derives the visible guess countdown from the absolute `guessEndsAt` timestamp
 * sent by the server on lock confirmation, using synced server time.
 */
import { useEffect, useState } from "react";
import { SECOND_MS } from "../constants";
import { syncedNow } from "../utils/serverClock";

export function useGuessTimer(guessEndsAt: number | null) {
  const [guessSeconds, setGuessSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!guessEndsAt) return undefined;

    const update = () => {
      const remainingMs = Math.max(0, guessEndsAt - syncedNow());
      const remaining = Math.ceil(remainingMs / SECOND_MS);

      if (remainingMs > 0) {
        setGuessSeconds(remaining);
      } else {
        setGuessSeconds(0);
      }
    };

    update();
    const timerId = window.setInterval(update, 200);

    return () => window.clearInterval(timerId);
  }, [guessEndsAt]);

  return { guessSeconds, setGuessSeconds };
}
