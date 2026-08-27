/**
 * Rematch flow: create or join a fresh lobby from a finished match.
 *
 * Only the requesting player is moved into the rematch lobby. Other players
 * stay on the finished scoreboard until they request a rematch themselves.
 */
import { createMatchState } from "../state.js";
import {
  applyPreviousPlaylistForRematch,
} from "./match.playlists.js";
import { generateMatchCode, joinMatch } from "./match.lifecycle.js";
import {
  getMatchBySocketOrThrow,
  type MatchRegistry,
} from "./match.registry.js";

function findFinishedMatchForRematchLobby(
  registry: MatchRegistry,
  lobbyMatchId: string,
): MatchState | undefined {
  for (const match of registry.matches.values()) {
    if (match.rematchTargetId === lobbyMatchId) {
      return match;
    }
  }
  return undefined;
}

export function requestRematch(
  registry: MatchRegistry,
  input: RematchRequestInput,
): RematchResult {
  const currentMatch = getMatchBySocketOrThrow(registry, input.socketId);

  if (currentMatch.phase === "lobby") {
    const sourceMatch = findFinishedMatchForRematchLobby(
      registry,
      currentMatch.matchId,
    );
    if (sourceMatch) {
      return {
        oldMatchId: sourceMatch.matchId,
        newMatch: currentMatch,
        alreadyExisted: true,
      };
    }
    throw new Error("INVALID_STATE");
  }

  if (currentMatch.phase !== "finished") {
    throw new Error("INVALID_STATE");
  }

  const oldMatch = currentMatch;

  const requester = oldMatch.players.find(
    (player) => player.socketId === input.socketId,
  );
  if (!requester?.connected) {
    throw new Error("PLAYER_NOT_IN_MATCH");
  }

  if (oldMatch.rematchTargetId) {
    const existing = registry.matches.get(oldMatch.rematchTargetId);
    if (existing && existing.phase === "lobby") {
      const newMatch = joinMatch(registry, {
        matchId: existing.matchId,
        socketId: input.socketId,
        userId: input.userId,
        displayName: input.displayName,
      });
      return {
        oldMatchId: oldMatch.matchId,
        newMatch,
        alreadyExisted: true,
      };
    }
  }

  const newMatchId = generateMatchCode(registry);
  const newMatch = createMatchState(newMatchId, {
    socketId: input.socketId,
    userId: input.userId,
    displayName: input.displayName,
  });
  newMatch.roundsTotal = oldMatch.roundsTotal;
  applyPreviousPlaylistForRematch(newMatch, oldMatch.selectedPlaylist);

  registry.matches.set(newMatchId, newMatch);
  registry.userToMatch.set(input.userId, newMatchId);
  registry.socketToMatch.set(input.socketId, newMatchId);

  oldMatch.rematchTargetId = newMatchId;

  return {
    oldMatchId: oldMatch.matchId,
    newMatch,
    alreadyExisted: false,
  };
}
