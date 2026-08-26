/**
 * Lobby ready toggle and game start.
 *
 * When every connected player is ready, validates song availability, loads the
 * playlist, and transitions the match from lobby to in-game.
 */
import { loadPlaylist } from "../playlist.service.js";
import { startRound, toRoundSyncPayload } from "../round.js";
import { MIN_PLAYABLE_SONGS } from "../../utils/constants.js";
import {
  getMatchBySocketOrThrow,
  type MatchRegistry,
} from "./match.registry.js";
import { getConnectedPlayers } from "./match.utils.js";

export type MatchLobbyContext = MatchRegistry & {
  /** Match ids whose lobby-to-game transition is currently awaiting I/O. */
  startingMatchIds: Set<string>;
};

type LoadPlaylist = (match: MatchState) => Promise<void>;

export async function markReady(
  ctx: MatchLobbyContext,
  socketId: string,
  emit: EmitMatchEvent,
  loadPlaylistForMatch: LoadPlaylist = loadPlaylist,
): Promise<ReadyResult> {
  const match = getMatchBySocketOrThrow(ctx, socketId);

  if (match.phase !== "lobby") {
    return {
      match,
      countdownStarted: false,
    };
  }

  // Claiming the transition happens synchronously before loadPlaylist's first
  // await. Any ready event arriving while the playlist is loading must be a
  // no-op; otherwise two callers can both start the same match.
  if (ctx.startingMatchIds.has(match.matchId)) {
    return {
      match,
      countdownStarted: false,
    };
  }

  const player = match.players.find((entry) => entry.socketId === socketId);

  if (!player) {
    throw new Error("PLAYER_NOT_IN_MATCH");
  }

  if (!match.selectedPlaylist || match.playlistPrepStatus !== "ready") {
    throw new Error("PLAYLIST_NOT_READY");
  }

  player.ready = !player.ready;

  const connectedPlayers = getConnectedPlayers(match);
  const countdownStarted =
    match.phase === "lobby" &&
    connectedPlayers.length > 0 &&
    connectedPlayers.every((entry) => entry.ready);

  if (countdownStarted) {
    const requiredRounds = Math.max(match.roundsTotal, MIN_PLAYABLE_SONGS);

    if (match.preparedSongs.length < requiredRounds) {
      connectedPlayers.forEach((entry) => {
        entry.ready = false;
      });
      emit(match.matchId, "match:error", {
        message: "PLAYLIST_NOT_ENOUGH_PLAYABLE_SONGS",
      });
      return {
        match,
        countdownStarted: false,
      };
    }

    ctx.startingMatchIds.add(match.matchId);

    try {
      await loadPlaylistForMatch(match);

      if (match.playlistError || match.playlist.length < requiredRounds) {
        const errorMessage =
          match.playlistError ?? "NOT_ENOUGH_SONGS_AVAILABLE";
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

      // The match may have been removed while playlist I/O was in flight.
      // Never transition a stale object that is no longer authoritative.
      if (ctx.matches.get(match.matchId) !== match || match.phase !== "lobby") {
        return {
          match,
          countdownStarted: false,
        };
      }

      const previousPhase = match.phase;
      match.phase = "in-game";
      startRound(match);
      emit(match.matchId, "match:phase", {
        matchId: match.matchId,
        phase: match.phase,
        previousPhase,
      });
      emit(match.matchId, "round:sync", toRoundSyncPayload(match));
    } catch (error) {
      // Restore a retryable lobby if playlist loading throws unexpectedly.
      match.playlist = [];
      match.playlistError = null;
      connectedPlayers.forEach((entry) => {
        entry.ready = false;
      });
      throw error;
    } finally {
      ctx.startingMatchIds.delete(match.matchId);
    }
  }

  return {
    match,
    countdownStarted,
  };
}
