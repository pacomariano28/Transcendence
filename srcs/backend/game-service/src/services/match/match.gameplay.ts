/**
 * In-round gameplay: lock, guess submission, preview-ended advance, and skip.
 *
 * Delegates resolution and scoring to `round.ts`. Timers for guess timeout
 * are owned by MatchService and passed in via MatchTimerContext.
 */
import {
  GUESS_WINDOW_SECONDS,
  SECOND_MS,
  SKIP_FADE_MS,
} from "../../utils/constants.js";
import { tracksMatchForGuess } from "../../utils/trackNormalization.js";
import { resolveGuess, revealUnansweredRound } from "../round.js";
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
import { getConnectedPlayers } from "./match.utils.js";

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
  const previewTrack = match.round.preview?.track ?? "";
  const previewArtist = match.round.preview?.artist ?? "";
  const isCorrect = Boolean(
    previewIsrc &&
      (isrc === previewIsrc ||
        tracksMatchForGuess(track, artist, previewTrack, previewArtist)),
  );
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
  timers: MatchTimerContext,
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

  revealUnansweredRound({
    match,
    emit,
    resumeTimers: timers.resumeTimers,
    onMatchFinished: (finishedMatch) =>
      releasePlayersFromMatch(connectionCtx, finishedMatch),
  });

  return match;
}

export function requestSkip(
  registry: MatchRegistry,
  timers: MatchTimerContext,
  connectionCtx: MatchConnectionContext,
  socketId: string,
  emit: EmitMatchEvent,
): MatchState {
  const match = getMatchBySocketOrThrow(registry, socketId);
  if (match.phase !== "in-game" || !match.round) {
    throw new Error("INVALID_STATE");
  }

  const round = match.round;
  if (round.phase !== "playing") {
    throw new Error("SKIP_NOT_ALLOWED");
  }

  if (round.lockOwnerId) {
    throw new Error("ROUND_ALREADY_LOCKED");
  }

  const player = match.players.find((entry) => entry.socketId === socketId);
  if (!player) {
    throw new Error("PLAYER_NOT_IN_MATCH");
  }

  if (round.skipUserIds.includes(player.userId)) {
    throw new Error("ALREADY_SKIPPED");
  }

  round.skipUserIds.push(player.userId);

  emit(match.matchId, "round:skip_update", {
    matchId: match.matchId,
    roundIndex: round.roundIndex,
    skipUserIds: [...round.skipUserIds],
  });

  const connectedPlayers = getConnectedPlayers(match);
  const allSkipped =
    connectedPlayers.length > 0 &&
    connectedPlayers.every((entry) => round.skipUserIds.includes(entry.userId));

  if (allSkipped) {
    round.phase = "resolution-win";

    emit(match.matchId, "round:skip_complete", {
      matchId: match.matchId,
      roundIndex: round.roundIndex,
    });

    replaceTimer(
      timers.resumeTimers,
      match.matchId,
      SKIP_FADE_MS,
      () => {
        if (!match.round || match.round.roundIndex !== round.roundIndex) {
          return;
        }

        revealUnansweredRound({
          match,
          emit,
          resumeTimers: timers.resumeTimers,
          onMatchFinished: (finishedMatch) =>
            releasePlayersFromMatch(connectionCtx, finishedMatch),
          reason: "skip",
        });
      },
    );
  }

  return match;
}
