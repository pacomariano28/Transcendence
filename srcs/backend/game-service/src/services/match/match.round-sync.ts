/**
 * Per-round sync phase before countdown.
 *
 * Each connected player must ack `round:ready` (fired once the browser's
 * audio element has buffered the round's preview track). If one player
 * never acks — slow connection, backgrounded tab, etc — FORCE_COUNTDOWN_MS
 * starts the countdown anyway once the first player is ready, so the round
 * cannot stall forever waiting on a straggler.
 */
import {
  FORCE_COUNTDOWN_MS,
  ROUND_COUNTDOWN_SECONDS,
  SECOND_MS,
} from "../../utils/constants.js";
import { startRoundCountdown } from "../round.js";
import {
  getMatchBySocketOrThrow,
  type MatchRegistry,
} from "./match.registry.js";
import type { MatchTimerContext } from "./match.timers.js";
import { getConnectedPlayers } from "./match.utils.js";

export function markRoundReady(
  registry: MatchRegistry,
  timers: MatchTimerContext,
  socketId: string,
  emit: EmitMatchEvent,
): { match: MatchState; countdownStarted: boolean; catchUp?: boolean } {
  const match = getMatchBySocketOrThrow(registry, socketId);
  if (match.phase !== "in-game" || !match.round) {
    throw new Error("INVALID_STATE");
  }

  if (match.round.phase !== "sync") {
    return { match, countdownStarted: false, catchUp: true };
  }

  const player = match.players.find((entry) => entry.socketId === socketId);
  if (!player) {
    throw new Error("PLAYER_NOT_IN_MATCH");
  }

  if (!match.round.readyUserIds.includes(player.userId)) {
    match.round.readyUserIds.push(player.userId);
  }

  const connectedPlayers = getConnectedPlayers(match);
  const countdownStarted = connectedPlayers.every((entry) =>
    match.round?.readyUserIds.includes(entry.userId),
  );

  if (countdownStarted) {
    const syncTimer = timers.syncTimers.get(match.matchId);
    if (syncTimer) {
      global.clearTimeout(syncTimer);
      timers.syncTimers.delete(match.matchId);
    }

    match.round.phase = "countdown";
    match.round.countdownEndsAt =
      Date.now() + ROUND_COUNTDOWN_SECONDS * SECOND_MS;
    startRoundCountdown(match, timers.roundCountdownTimers, emit);
  } else if (!timers.syncTimers.has(match.matchId)) {
    const timer = global.setTimeout(() => {
      timers.syncTimers.delete(match.matchId);

      if (
        match.phase === "in-game" &&
        match.round &&
        match.round.phase === "sync"
      ) {
        console.log(
          `[Match ${match.matchId}] Forcing round start due to missing player.`,
        );

        match.round.phase = "countdown";
        match.round.countdownEndsAt =
          Date.now() + ROUND_COUNTDOWN_SECONDS * SECOND_MS;
        startRoundCountdown(match, timers.roundCountdownTimers, emit);

        emit(match.matchId, "round:countdown", {
          matchId: match.matchId,
          roundIndex: match.round.roundIndex,
          seconds: ROUND_COUNTDOWN_SECONDS,
          endsAt: match.round.countdownEndsAt,
          serverNow: Date.now(),
        });
      }
    }, FORCE_COUNTDOWN_MS);

    timers.syncTimers.set(match.matchId, timer);
  }

  return { match, countdownStarted };
}
