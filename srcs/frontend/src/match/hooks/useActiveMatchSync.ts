/**
 * Mirrors in-progress match metadata into ActiveMatchContext (header badge elsewhere).
 * Clears the context when the match finishes or is not found.
 */
import { useEffect } from "react";
import type { MatchStatePayload, ScoreEntry } from "../../types/socket.payloads";
import type { RoundSyncPayload } from "../types";

type UseActiveMatchSyncOptions = {
  code: string;
  roundInfo: RoundSyncPayload | null;
  matchState: MatchStatePayload | null;
  notFound: boolean;
  roundPhase: string;
  finalScores: ScoreEntry[] | null;
  compactRoundLabel?: string;
  setActiveMatch: (value: { code: string; roundLabel?: string } | null) => void;
};

export function useActiveMatchSync({
  code,
  roundInfo,
  matchState,
  notFound,
  roundPhase,
  finalScores,
  compactRoundLabel,
  setActiveMatch,
}: UseActiveMatchSyncOptions) {
  useEffect(() => {
    if (notFound) {
      setActiveMatch(null);
      return;
    }

    const isFinished =
      Boolean(finalScores) ||
      matchState?.phase === "finished" ||
      roundPhase === "finished";

    if (isFinished) {
      setActiveMatch(null);
      return;
    }

    if (matchState) {
      setActiveMatch({
        code: code,
        roundLabel: compactRoundLabel,
      });
    }
  }, [
    code,
    roundInfo,
    setActiveMatch,
    matchState,
    notFound,
    roundPhase,
    finalScores,
    compactRoundLabel,
  ]);
}
