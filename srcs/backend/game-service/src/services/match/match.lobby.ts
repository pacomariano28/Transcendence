/**
 * Lobby ready toggle and game start.
 *
 * When every connected player is ready, validates song availability, loads the
 * playlist, and transitions the match from lobby to in-game.
 */
import { fetchAvailableSongCount } from "../../clients/playlist.client.js";
import { loadPlaylist } from "../playlist.service.js";
import { startRound, toRoundSyncPayload } from "../round.js";
import {
  getMatchBySocketOrThrow,
  type MatchRegistry,
} from "./match.registry.js";
import { getConnectedPlayers } from "./match.utils.js";

export async function markReady(
  registry: MatchRegistry,
  socketId: string,
  emit: EmitMatchEvent,
): Promise<ReadyResult> {
  const match = getMatchBySocketOrThrow(registry, socketId);

  // No-op outside lobby (e.g. reconnect during in-game) — avoids breaking clients.
  if (match.phase !== "lobby") {
    return {
      match,
      countdownStarted: false,
    };
  }

  const player = match.players.find((entry) => entry.socketId === socketId);

  if (!player) {
    throw new Error("PLAYER_NOT_IN_MATCH");
  }

  player.ready = !player.ready;

  const connectedPlayers = getConnectedPlayers(match);
  const countdownStarted =
    match.phase === "lobby" &&
    connectedPlayers.length > 0 &&
    connectedPlayers.every((entry) => entry.ready);

  if (countdownStarted) {
    const requiredRounds = match.roundsTotal;
    const availability = await fetchAvailableSongCount();

    if (!availability.ok || availability.count < requiredRounds) {
      connectedPlayers.forEach((entry) => {
        entry.ready = false;
      });
      emit(match.matchId, "match:error", {
        message: "NOT_ENOUGH_SONGS_AVAILABLE",
      });
      return {
        match,
        countdownStarted: false,
      };
    }

    const previousPhase = match.phase;
    await loadPlaylist(match);

    if (match.playlistError || match.playlist.length < requiredRounds) {
      const errorMessage = match.playlistError ?? "NOT_ENOUGH_SONGS_AVAILABLE";
      match.playlist = [];
      match.playlistError = null;
      connectedPlayers.forEach((entry) => {
        entry.ready = false;
      });
      emit(match.matchId, "match:error", {
        message: errorMessage,
      });
      return {
        match,
        countdownStarted: false,
      };
    }

    match.phase = "in-game";
    startRound(match);
    emit(match.matchId, "match:phase", {
      matchId: match.matchId,
      phase: match.phase,
      previousPhase,
    });
    emit(match.matchId, "round:sync", toRoundSyncPayload(match));
  }

  return {
    match,
    countdownStarted,
  };
}
