/**
 * Pure selectors: derive display data from match state without side effects.
 * Keeps MatchPage free of score-mapping and overlay visibility logic.
 */
import type { MatchStatePayload, ScoreEntry } from "../types/socket.payloads";
import type { ScoreboardEntry } from "./types";

export function getLockOwnerName(
  matchState: MatchStatePayload | null,
  lockOwnerId: string | null,
): string {
  if (!matchState || !lockOwnerId) return "";
  return (
    matchState.players.find((player: MatchStatePayload["players"][number]) => player.userId === lockOwnerId)
      ?.displayName ?? ""
  );
}

export function buildScoreboard(
  matchState: MatchStatePayload | null,
  scores: Record<string, number>,
): ScoreboardEntry[] {
  if (!matchState) return [];

  return matchState.players
    .map((player: MatchStatePayload["players"][number]) => {
      const backupScore =
        (player as { score?: number; totalScore?: number; points?: number })
          .score ??
        (player as { totalScore?: number }).totalScore ??
        (player as { points?: number }).points ??
        0;
      const liveScore = scores[player.userId];

      return {
        userId: player.userId,
        displayName: player.displayName,
        score: liveScore ?? backupScore ?? 0,
        connected: player.connected,
      };
    })
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      return left.displayName.localeCompare(right.displayName);
    });
}

export function buildResultsData(
  finalScores: ScoreEntry[] | null,
  playersList: MatchStatePayload["players"],
  scores: Record<string, number>,
  playerFallback = "Player",
): ScoreEntry[] {
  const entries = finalScores
    ? finalScores
    : playersList.map((player: MatchStatePayload["players"][number]) => ({
        userId: player.userId,
        displayName:
          (player as { username?: string; displayName?: string }).username ||
          (player as { displayName?: string }).displayName ||
          playerFallback,
        score:
          scores[player.userId] ??
          (player as { score?: number }).score ??
          0,
      }));

  return [...entries].sort((a, b) => b.score - a.score);
}

export type MatchDisplayFlags = {
  showGuessPanel: boolean;
  showAudioNotice: boolean;
  showCountdown: boolean;
  showEq: boolean;
  showTrackTimer: boolean;
  isMatchFinished: boolean;
};

export function getMatchDisplayFlags(options: {
  roundPhase: string;
  showAudioRestoreNotice: boolean;
  showVisualizer: boolean;
  songRemainingSeconds: number | null;
  matchPhase: MatchStatePayload["phase"] | undefined;
}): MatchDisplayFlags {
  const {
    roundPhase,
    showAudioRestoreNotice,
    showVisualizer,
    songRemainingSeconds,
    matchPhase,
  } = options;

  const showGuessPanel =
    roundPhase === "guessing" ||
    roundPhase === "resolution-win" ||
    roundPhase === "resolution-fail";

  const showAudioNotice = showAudioRestoreNotice && !showGuessPanel;
  // Countdown, equalizer and audio-restore notice are mutually exclusive layers
  const showCountdown = !showGuessPanel && !showVisualizer && !showAudioNotice;
  const showEq = !showGuessPanel && showVisualizer && !showAudioNotice;
  const showTrackTimer =
    !showAudioRestoreNotice &&
    songRemainingSeconds !== null &&
    (roundPhase === "playing" ||
      roundPhase === "guessing" ||
      roundPhase === "resolution-win" ||
      roundPhase === "resolution-fail");

  const isMatchFinished = matchPhase === "finished" || roundPhase === "finished";

  return {
    showGuessPanel,
    showAudioNotice,
    showCountdown,
    showEq,
    showTrackTimer,
    isMatchFinished,
  };
}
