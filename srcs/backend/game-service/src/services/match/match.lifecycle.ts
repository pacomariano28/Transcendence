/**
 * Match creation and join flow (lobby entry).
 *
 * Registers new matches in the in-memory registry and enforces one active
 * connected session per user across all non-finished games.
 */
import { randomInt } from "node:crypto";
import { ALPHABET, MAX_PLAYER } from "../../utils/constants.js";
import { createMatchState, createPlayer, ensureScoreEntry } from "../state.js";
import {
  releasePlayersFromMatch,
  type MatchConnectionContext,
} from "./match.connection.js";
import {
  getMatchOrThrow,
  getPlayerByUserId,
  type MatchRegistry,
} from "./match.registry.js";

export function generateMatchCode(
  registry: MatchRegistry,
  length = 6,
): string {
  let code;

  do {
    code = "";
    for (let i = 0; i < length; i++) {
      code += ALPHABET[randomInt(ALPHABET.length)];
    }
  } while (registry.matches.has(code));

  return code;
}

export function createMatch(
  registry: MatchRegistry,
  connectionCtx: MatchConnectionContext,
  input: CreateMatchInput,
): MatchState {
  const existingMatchId = registry.userToMatch.get(input.userId);
  if (existingMatchId) {
    const existingMatch = registry.matches.get(existingMatchId);
    if (!existingMatch || existingMatch.phase === "finished") {
      if (existingMatch) {
        releasePlayersFromMatch(connectionCtx, existingMatch);
      }
    } else {
      const existingPlayer = existingMatch.players.find(
        (player) => player.userId === input.userId,
      );
      if (existingPlayer?.connected) {
        throw new Error(
          "You cannot create a new game because you are already in-game",
        );
      }
    }
    registry.userToMatch.delete(input.userId);
  }

  if (getPlayerByUserId(registry, input.userId)) {
    throw new Error(
      "You cannot create a new game because you are already in-game",
    );
  }

  const matchId = generateMatchCode(registry);
  const match = createMatchState(matchId, input);

  registry.matches.set(matchId, match);
  registry.userToMatch.set(input.userId, matchId);
  registry.socketToMatch.set(input.socketId, matchId);

  return match;
}

export function joinMatch(
  registry: MatchRegistry,
  input: JoinMatchInput,
): MatchState {
  const match = getMatchOrThrow(registry, input.matchId);

  // if (match.phase === "finished") {
  //   throw new Error("MATCH_FINISHED");
  // }

  const existingPlayer = match.players.find(
    (player) =>
      player.socketId === input.socketId || player.userId === input.userId,
  );

  if (existingPlayer) {
    const previousSocketId = existingPlayer.socketId;
    if (previousSocketId && previousSocketId !== input.socketId) {
      // A replacement connection may arrive before Socket.IO reports the old
      // transport as disconnected. Transfer authority to the newest socket;
      // a later disconnect from the stale socket then becomes a no-op.
      registry.socketToMatch.delete(previousSocketId);
    }
    existingPlayer.socketId = input.socketId;
    existingPlayer.displayName = input.displayName;
    existingPlayer.connected = true;
    existingPlayer.disconnectedAt = null;
    ensureScoreEntry(match, existingPlayer);
    registry.userToMatch.set(input.userId, match.matchId);
    registry.socketToMatch.set(input.socketId, match.matchId);
    return match;
  }

  if (match.players.length >= MAX_PLAYER) {
    throw new Error("MATCH_FULL");
  }

  const player = createPlayer({
    socketId: input.socketId,
    userId: input.userId,
    displayName: input.displayName,
  });

  // Late joiners during in-game skip lobby ready; they sync on the next round.
  if (match.phase === "in-game") {
    player.ready = true;
  }

  match.players.push(player);
  ensureScoreEntry(match, player);

  registry.userToMatch.set(input.userId, match.matchId);
  registry.socketToMatch.set(input.socketId, match.matchId);

  return match;
}
