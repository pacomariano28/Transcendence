/**
 * In-memory match registry and read-only lookups.
 *
 * `MatchRegistry` holds the authoritative maps owned by MatchService. All
 * lookup helpers are pure reads (or throw) — mutations live in other modules.
 */
import { toRoundSyncPayload } from "../round.js";

/** Shared index maps passed into every match submodule. */
export type MatchRegistry = {
  matches: Map<string, MatchState>;
  userToMatch: Map<string, string>;
  socketToMatch: Map<string, string>;
};

export function getMatch(
  registry: MatchRegistry,
  matchId: string,
): MatchState | undefined {
  return registry.matches.get(matchId);
}

export function getMatchOrThrow(
  registry: MatchRegistry,
  matchId: string,
): MatchState {
  const match = registry.matches.get(matchId);

  if (!match) {
    throw new Error("MATCH_NOT_FOUND");
  }

  return match;
}

export function getMatchBySocket(
  registry: MatchRegistry,
  socketId: string,
): MatchState | undefined {
  const matchId = registry.socketToMatch.get(socketId);

  if (!matchId) {
    return undefined;
  }

  return registry.matches.get(matchId);
}

export function getMatchBySocketOrThrow(
  registry: MatchRegistry,
  socketId: string,
): MatchState {
  const match = getMatchBySocket(registry, socketId);

  if (!match) {
    throw new Error("MATCH_NOT_FOUND");
  }

  return match;
}

export function getPlayerByUserId(
  registry: MatchRegistry,
  userId: string,
): MatchPlayer | undefined {
  // Skips finished matches so a completed game does not block new ones.
  for (const match of registry.matches.values()) {
    if (match.phase === "finished") {
      continue;
    }

    const player = match.players.find(
      (entry: MatchPlayer) => entry.userId === userId,
    );
    if (player && player.connected) {
      return player;
    }
  }
  return undefined;
}

export function getRoundSyncPayload(registry: MatchRegistry, matchId: string) {
  const match = getMatch(registry, matchId);
  if (!match || !match.round) {
    return null;
  }

  return toRoundSyncPayload(match);
}
