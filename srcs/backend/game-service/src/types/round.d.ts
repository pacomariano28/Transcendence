import type { GuessSelectedTrack } from "./socket.payloads.js";

export type ResolveGuessInput = {
  match: MatchState;
  lockOwnerId: string;
  correct: boolean;
  reason: "wrong" | "timeout" | null;
  selectedTrack: GuessSelectedTrack | null;
  emit: EmitMatchEvent;
  guessTimers: MatchTimerMap;
  resumeTimers: MatchTimerMap;
};
