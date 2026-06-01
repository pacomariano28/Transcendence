import { MAX_ROUNDS, MIN_ROUNDS } from "./constants.js";

export function clampRounds(rounds: number): number {
  return Math.min(MAX_ROUNDS, Math.max(MIN_ROUNDS, rounds));
}

export function getConnectedPlayers(match: MatchState): MatchPlayer[] {
  return match.players.filter((entry) => entry.connected);
}
