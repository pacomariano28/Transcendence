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
  setActiveMatch: (value: { code: string; roundLabel?: string } | null) => void;
};

export function useActiveMatchSync({
  code,
  roundInfo,
  matchState,
  notFound,
  roundPhase,
  finalScores,
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
        roundLabel: roundInfo
          ? `R ${roundInfo.roundIndex + 1}/${roundInfo.roundsTotal}`
          : undefined,
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
  ]);
}
