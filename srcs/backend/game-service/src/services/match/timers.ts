export type MatchTimerMap = Map<string, NodeJS.Timeout>;

export function clearTimer(timers: MatchTimerMap, matchId: string): void {
  const timer = timers.get(matchId);
  if (!timer) {
    return;
  }

  clearTimeout(timer);
  timers.delete(matchId);
}

export function replaceTimer(
  timers: MatchTimerMap,
  matchId: string,
  delayMs: number,
  handler: () => void,
): NodeJS.Timeout {
  clearTimer(timers, matchId);

  const timer = setTimeout(handler, delayMs);
  timers.set(matchId, timer);

  return timer;
}
