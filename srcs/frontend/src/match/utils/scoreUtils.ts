import type { MatchStatePayload } from "../../types/socket.payloads";

export function mergeScoresFromPayload(
  prev: Record<string, number>,
  payload: MatchStatePayload,
): Record<string, number> {
  const next = { ...prev };

  if (payload.scores) {
    if (Array.isArray(payload.scores)) {
      payload.scores.forEach((entry: any) => {
        const s = entry.score ?? entry.totalScore ?? entry.points;
        if (entry.userId && s !== undefined && s !== null)
          next[entry.userId] = s;
      });
    } else {
      Object.keys(payload.scores).forEach((key) => {
        const s = (payload.scores as any)[key];
        if (s !== undefined && s !== null) next[key] = s;
      });
    }
  }

  payload.players.forEach((player) => {
    const serverScore =
      player.score ?? player.totalScore ?? (player as any).points;

    if (serverScore !== undefined && serverScore !== null) {
      next[player.userId] = serverScore;
    } else if (next[player.userId] === undefined) {
      next[player.userId] = 0;
    }
  });

  return next;
}
