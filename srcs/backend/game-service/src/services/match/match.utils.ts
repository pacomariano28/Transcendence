/** Players with an active socket connection (excludes disconnected slots). */
export function getConnectedPlayers(match: MatchState): MatchPlayer[] {
  return match.players.filter((entry) => entry.connected);
}
