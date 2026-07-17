import { useEffect, useState } from "react";
import { SECOND_MS } from "../constants";

export function useGuessTimer(guessEndsAt: number | null) {
  const [guessSeconds, setGuessSeconds] = useState<number | null>(null);

  useEffect(() => {
    if (!guessEndsAt) return undefined;

    const update = () => {
      const remainingMs = Math.max(0, guessEndsAt - Date.now());
      const remaining = Math.ceil(remainingMs / SECOND_MS);

      if (remainingMs > 0) {
        setGuessSeconds(remaining);
      }
    };

    update();
    const timerId = window.setInterval(update, 200);

    return () => window.clearInterval(timerId);
  }, [guessEndsAt]);

  return { guessSeconds, setGuessSeconds };
}
