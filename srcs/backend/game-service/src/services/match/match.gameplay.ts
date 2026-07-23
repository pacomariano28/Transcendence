/**
 * In-round gameplay: lock, guess submission, and preview-ended advance.
 *
 * Delegates resolution and scoring to `round.ts`. Timers for guess timeout
 * are owned by MatchService and passed in via MatchTimerContext.
 */
import { GUESS_WINDOW_SECONDS, SECOND_MS } from "../../utils/constants.js";
import { resolveGuess, startRound, toRoundSyncPayload } from "../round.js";
import { replaceTimer } from "../timers.js";
import {
  releasePlayersFromMatch,
  type MatchConnectionContext,
} from "./match.connection.js";
import {
  getMatchBySocketOrThrow,
  type MatchRegistry,
} from "./match.registry.js";
import type { MatchTimerContext } from "./match.timers.js";

export function requestLock(
  registry: MatchRegistry,
  timers: MatchTimerContext,
  connectionCtx: MatchConnectionContext,
  socketId: string,
  time: number,
  emit: EmitMatchEvent,
): MatchState {
  const match = getMatchBySocketOrThrow(registry, socketId);
  if (match.phase !== "in-game" || !match.round) {
    throw new Error("INVALID_STATE");
  }

  if (match.round.phase !== "playing") {
    throw new Error("Someone already locked");
  }

  if (match.round.lockOwnerId) {
    throw new Error("ROUND_ALREADY_LOCKED");
  }

  const player = match.players.find((entry) => entry.socketId === socketId);
  if (!player) {
    throw new Error("PLAYER_NOT_IN_MATCH");
  }

  const now = Date.now();
  match.round.phase = "guessing";
  match.round.lockOwnerId = player.userId;
  match.round.lockAt = time;
  match.round.guessEndsAt = now + GUESS_WINDOW_SECONDS * SECOND_MS;

  emit(match.matchId, "round:lock_confirmed", {
    matchId: match.matchId,
    roundIndex: match.round.roundIndex,
    lockOwnerId: match.round.lockOwnerId,
    lockAt: match.round.lockAt,
    guessEndsAt: match.round.guessEndsAt,
  });

  replaceTimer(
    timers.guessTimers,
    match.matchId,
    GUESS_WINDOW_SECONDS * SECOND_MS,
    () => {
      resolveGuess({
        match,
        lockOwnerId: player.userId,
        correct: false,
        reason: "timeout",
        selectedTrack: null,
        emit,
        guessTimers: timers.guessTimers,
        resumeTimers: timers.resumeTimers,
        onMatchFinished: (finishedMatch) =>
          releasePlayersFromMatch(connectionCtx, finishedMatch),
      });
    },
  );

  return match;
}

export function submitGuess(
  registry: MatchRegistry,
  timers: MatchTimerContext,
  connectionCtx: MatchConnectionContext,
  socketId: string,
  isrc: string,
  track: string,
  artist: string,
  emit: EmitMatchEvent,
): MatchState {
  const match = getMatchBySocketOrThrow(registry, socketId);
  if (match.phase !== "in-game" || !match.round) {
    throw new Error("INVALID_STATE");
  }

  const player = match.players.find((entry) => entry.socketId === socketId);
  if (!player) {
    throw new Error("PLAYER_NOT_IN_MATCH");
  }

  if (match.round.phase !== "guessing") {
    throw new Error("GUESS_NOT_ALLOWED");
  }

  if (match.round.lockOwnerId !== player.userId) {
    throw new Error("NOT_LOCK_OWNER");
  }

  const previewIsrc = match.round.preview?.isrc ?? null;
  const isCorrect = Boolean(previewIsrc && isrc === previewIsrc);
  resolveGuess({
    match,
    lockOwnerId: player.userId,
    correct: isCorrect,
    reason: isCorrect ? null : "wrong",
    selectedTrack: { isrc, track, artist },
    emit,
    guessTimers: timers.guessTimers,
    resumeTimers: timers.resumeTimers,
    onMatchFinished: (finishedMatch) =>
      releasePlayersFromMatch(connectionCtx, finishedMatch),
  });
  return match;
}

export function handlePreviewEnded(
  registry: MatchRegistry,
  connectionCtx: MatchConnectionContext,
  socketId: string,
  roundIndex: number,
  emit: EmitMatchEvent,
): MatchState {
  const match = getMatchBySocketOrThrow(registry, socketId);

  if (match.phase !== "in-game" || !match.round) {
    return match;
  }

  if (match.round.roundIndex !== roundIndex) {
    return match;
  }

  if (match.round.phase !== "playing" || match.round.lockOwnerId) {
    return match;
  }

  if (match.roundIndex + 1 >= match.roundsTotal) {
    const previousPhase = match.phase;
    match.phase = "finished";
    emit(match.matchId, "match:phase", {
      matchId: match.matchId,
      phase: match.phase,
      previousPhase,
    });
    emit(match.matchId, "match:end", {
      matchId: match.matchId,
      scores: match.scores,
    });
    releasePlayersFromMatch(connectionCtx, match);
    return match;
  }

  match.roundIndex += 1;
  startRound(match);
  emit(match.matchId, "round:sync", toRoundSyncPayload(match));
  return match;
}
