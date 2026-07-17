/**
 * Timer map handles owned by MatchService, grouped for modules that schedule
 * round countdown, guess timeout, resume, or forced sync countdown.
 */
import type { MatchTimerMap } from "../timers.js";

export type MatchTimerContext = {
  roundCountdownTimers: MatchTimerMap;
  guessTimers: MatchTimerMap;
  resumeTimers: MatchTimerMap;
  syncTimers: MatchTimerMap;
};
