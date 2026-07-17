/**
 * One-shot HTTP fetch on mount to hydrate match/scores before socket events arrive.
 * Does not replace socket authority during active play.
 */
import { useEffect, type Dispatch, type SetStateAction } from "react";
import { getMatchState } from "../../api/state";
import { isMatchNotFoundError } from "../utils";
import { mergeScoresFromPayload } from "../utils/scoreUtils";
import type { MatchStatePayload } from "../../types/socket.payloads";

type UseMatchHydrationOptions = {
  code: string;
  setNotFound: (value: boolean) => void;
  setMatchState: (value: MatchStatePayload | null) => void;
  setScores: Dispatch<SetStateAction<Record<string, number>>>;
};

export function useMatchHydration({
  code,
  setNotFound,
  setMatchState,
  setScores,
}: UseMatchHydrationOptions) {
  useEffect(() => {
    setNotFound(false);

    if (!code) {
      setNotFound(true);
      return;
    }

    async function hydrateMatch() {
      try {
        const match = await getMatchState({ matchId: code });

        if (match) {
          setMatchState(match);
          setScores((prev) => mergeScoresFromPayload(prev, match));
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        if (isMatchNotFoundError(message)) {
          setNotFound(true);
          return;
        }
        console.error(
          "Error al sincronizar puntuaciones por HTTP al montar:",
          err,
        );
      }
    }

    hydrateMatch();
  }, [code, setNotFound, setMatchState, setScores]);
}
