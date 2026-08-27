import type { MatchStatePayload } from "../../types/socket.payloads";

/**
 * Merges server score data into the local scores map.
 * Used on HTTP hydration and on every `match:state` socket event so the
 * scoreboard stays aligned with the server without resetting unrelated keys.
 */
export function mergeScoresFromPayload(
  prev: Record<string, number>,
  payload: MatchStatePayload,
): Record<string, number> {
  const next = { ...prev };

  if (payload.scores) {
    if (Array.isArray(payload.scores)) {
      payload.scores.forEach((entry) => {
        next[entry.userId] = entry.score;
      });
    } else {
      Object.entries(payload.scores).forEach(([key, s]) => {
        if (s !== undefined && s !== null) next[key] = s;
      });
    }
  }

  payload.players.forEach((player) => {
    const serverScore = player.score ?? player.totalScore;

    if (serverScore !== undefined && serverScore !== null) {
      next[player.userId] = serverScore;
    } else if (next[player.userId] === undefined) {
      next[player.userId] = 0;
    }
  });

  return next;
}
