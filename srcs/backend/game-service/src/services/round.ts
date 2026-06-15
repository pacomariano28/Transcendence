import {
  BASE_SCORE,
  COOLDOWN_SECONDS,
  GUESS_WINDOW_SECONDS,
  RESOLUTION_SECONDS,
  ROUND_COUNTDOWN_SECONDS,
  SECOND_MS,
  SPEED_MULTIPLIER,
  WRONG_GUESS_PENALTY,
} from "../utils/constants.js";
import { clearTimer, replaceTimer, type MatchTimerMap } from "./timers.js";
import { createRoundState } from "./state.js";
import type { ResolveGuessInput } from "../types/round.js";

export function startRound(match: MatchState): void {
  match.round = createRoundState(match);
}

export function startRoundCountdown(
  match: MatchState,
  roundCountdownTimers: MatchTimerMap,
): void {
  replaceTimer(
    roundCountdownTimers,
    match.matchId,
    ROUND_COUNTDOWN_SECONDS * SECOND_MS,
    () => {
      if (!match.round) {
        return;
      }

      match.round.phase = "playing";

      match.round.countdownEndsAt = Date.now();
    },
  );
}

export function toRoundSyncPayload(match: MatchState) {
  return {
    matchId: match.matchId,
    roundIndex: match.roundIndex,
    roundsTotal: match.roundsTotal,
    preview: match.round?.preview ?? null,
    playlistError: match.playlistError,
  };
}

export function resolveGuess({
  match,
  lockOwnerId,
  correct,
  reason,
  emit,
  guessTimers,
  resumeTimers,
}: ResolveGuessInput): void {
  clearTimer(guessTimers, match.matchId);
  clearTimer(resumeTimers, match.matchId);

  const round = match.round;
  if (!round) {
    return;
  }

  const scoreEntry = match.scores.find((entry) => entry.userId === lockOwnerId);
  const totalTimeMs = GUESS_WINDOW_SECONDS * SECOND_MS;
  const now = Date.now();
  const startedAt = round.guessEndsAt ? round.guessEndsAt - totalTimeMs : now;
  const elapsedSec = Math.max(0, (now - startedAt) / SECOND_MS);
  const speedBonus = Math.max(
    0,
    Math.floor((GUESS_WINDOW_SECONDS - elapsedSec) * SPEED_MULTIPLIER),
  );
  const scoreDelta = correct ? BASE_SCORE + speedBonus : -WRONG_GUESS_PENALTY;

  if (scoreEntry) {
    scoreEntry.score += scoreDelta;
  }

  round.phase = correct ? "resolution-win" : "resolution-fail";

  emit(match.matchId, "round:guess_result", {
    matchId: match.matchId,
    roundIndex: round.roundIndex,
    lockOwnerId,
    correct,
    reason,
    trackId: round.preview?.trackId ?? null,
    scoreDelta,
    totalScore: scoreEntry?.score ?? scoreDelta,
  });

  if (correct) {
    replaceTimer(
      resumeTimers,
      match.matchId,
      RESOLUTION_SECONDS * SECOND_MS,
      () => {
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
          return;
        }

        match.roundIndex += 1;
        startRound(match);
        emit(match.matchId, "round:sync", toRoundSyncPayload(match));
      },
    );
    return;
  }

  replaceTimer(
    resumeTimers,
    match.matchId,
    COOLDOWN_SECONDS * SECOND_MS,
    () => {
      if (!match.round) {
        return;
      }

      const resumeTime = match.round.lockAt;
      match.round.phase = "playing";
      match.round.lockOwnerId = null;
      match.round.lockAt = null;
      match.round.guessEndsAt = null;

      if (resumeTime !== null) {
        match.round.countdownEndsAt = Date.now() - resumeTime * 1000;
      } else {
        match.round.countdownEndsAt = Date.now();
      }

      emit(match.matchId, "round:resume", {
        matchId: match.matchId,
        roundIndex: match.round.roundIndex,
        resumeTime,
      });
    },
  );
}
