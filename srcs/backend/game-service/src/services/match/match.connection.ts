/**
 * Player connection lifecycle: disconnect, reconnect, and idle match cleanup.
 *
 * Mutates player flags and registry indexes (`userToMatch`, `socketToMatch`).
 * When all players disconnect, schedules match removal after DISCONNECT_TTL_MS
 * so brief reconnects do not lose in-memory state.
 */
import { DISCONNECT_TTL_MS } from "../../utils/constants.js";
import type { MatchRegistry } from "./match.registry.js";

export type MatchConnectionContext = MatchRegistry & {
  syncTimers: Map<string, NodeJS.Timeout>;
};

export function releasePlayersFromMatch(
  ctx: MatchConnectionContext,
  match: MatchState,
): void {
  // Called when a match finishes so users can create or join another game.
  for (const player of match.players) {
    ctx.userToMatch.delete(player.userId);
  }
}

export function detachPlayerFromMatch(
  ctx: MatchConnectionContext,
  player: MatchPlayer,
  match: MatchState,
): void {
  if (player.socketId) {
    ctx.socketToMatch.delete(player.socketId);
  }

  ctx.userToMatch.delete(player.userId);
  player.socketId = null;
  player.connected = false;
  player.disconnectedAt = new Date().toISOString();
  console.log(
    `Player ${player.userId} disconnected from match ${match.matchId}`,
  );

  scheduleMatchRemovalIfEmpty(ctx, match);
}

export function scheduleMatchRemovalIfEmpty(
  ctx: MatchConnectionContext,
  match: MatchState,
): void {
  const allDisconnected = match.players.every((p) => !p.connected);
  if (!allDisconnected) {
    return;
  }

  console.log(
    `All players disconnected. Match ${match.matchId} will be removed after timeout if no reconnection occurs.`,
  );

  global.setTimeout(() => {
    const stillDisconnected = match.players.every((p) => !p.connected);
    if (stillDisconnected) {
      console.log(`Match ${match.matchId} removed due to inactivity.`);

      const syncTimer = ctx.syncTimers.get(match.matchId);
      if (syncTimer) global.clearTimeout(syncTimer);
      ctx.syncTimers.delete(match.matchId);

      ctx.matches.delete(match.matchId);
    }
  }, DISCONNECT_TTL_MS);
}

export function removeSocket(
  ctx: MatchConnectionContext,
  socketId: string,
): MatchState | undefined {
  const matchId = ctx.socketToMatch.get(socketId);
  if (!matchId) {
    return undefined;
  }

  const match = ctx.matches.get(matchId);
  if (!match) {
    return undefined;
  }

  const player = match.players.find((p) => p.socketId === socketId);
  if (player) {
    detachPlayerFromMatch(ctx, player, match);
  }

  ctx.socketToMatch.delete(socketId);

  return match;
}

export function leaveMatch(
  ctx: MatchConnectionContext,
  input: { socketId: string; userId?: string },
): MatchState | undefined {
  const match = removeSocket(ctx, input.socketId);
  if (match) {
    return match;
  }

  // Fallback when socket mapping is stale but the user is still connected.
  if (!input.userId) {
    return undefined;
  }

  for (const currentMatch of ctx.matches.values()) {
    const player = currentMatch.players.find(
      (entry) => entry.userId === input.userId && entry.connected,
    );
    if (!player) {
      continue;
    }

    detachPlayerFromMatch(ctx, player, currentMatch);
    return currentMatch;
  }

  return undefined;
}

export function reconnectSocket(
  ctx: MatchConnectionContext,
  playerId: string,
  newSocketId: string,
): MatchState {
  for (const match of ctx.matches.values()) {
    const player = match.players.find((p) => p.userId === playerId);
    if (player) {
      player.socketId = newSocketId;
      player.connected = true;
      player.disconnectedAt = null;
      ctx.userToMatch.set(playerId, match.matchId);
      ctx.socketToMatch.set(newSocketId, match.matchId);
      console.log(`Player ${playerId} reconnected to match ${match.matchId}`);
      return match;
    }
  }

  throw new Error("MATCH_NOT_FOUND");
}
