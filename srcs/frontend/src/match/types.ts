/**
 * Match module types.
 *
 * Payload types mirror socket events emitted by the game service during a round.
 * `GuessStatus` and `ScoreboardEntry` are client-only shapes for UI state.
 */
import type { ScoreEntry } from "../types/socket.payloads";

export type RoundPreview = {
  isrc: string;
  fileName: string;
};

export type RoundSyncPayload = {
  matchId: string;
  roundIndex: number;
  roundsTotal: number;
  preview: RoundPreview | null;
  playlistError: string | null;
};

export type RoundCountdownPayload = {
  matchId: string;
  roundIndex: number;
  seconds: number;
  endsAt: number;
};

export type RoundLockPayload = {
  matchId: string;
  roundIndex: number;
  lockOwnerId: string;
  lockAt: number | null;
  guessEndsAt: number | null;
};

export type GuessSelectedTrack = {
  isrc: string;
  track: string;
  artist: string;
};

export type RoundGuessResultPayload = {
  matchId: string;
  roundIndex: number;
  lockOwnerId: string;
  correct: boolean;
  reason: "wrong" | "timeout" | null;
  isrc: string | null;
  selectedTrack: GuessSelectedTrack | null;
  scoreDelta: number;
  totalScore: number;
};

export type RoundResumePayload = {
  matchId: string;
  roundIndex: number;
  resumeTime: number | null;
};

export type MatchEndPayload = {
  matchId: string;
  scores: ScoreEntry[];
};

export type GuessStatus = "countdown" | "expired" | "wrong" | "correct";

export type ScoreboardEntry = {
  userId: string;
  displayName: string;
  score: number;
  connected: boolean;
};
