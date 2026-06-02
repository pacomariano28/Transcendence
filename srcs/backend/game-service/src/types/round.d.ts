export type ResolveGuessInput = {
  match: MatchState;
  lockOwnerId: string;
  correct: boolean;
  reason: "wrong" | "timeout" | null;
  emit: EmitMatchEvent;
  guessTimers: MatchTimerMap;
  resumeTimers: MatchTimerMap;
};
