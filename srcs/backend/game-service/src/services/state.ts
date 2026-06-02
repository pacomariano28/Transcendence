import { clampRounds } from "../utils/utils.js";

type PlayerInput = Pick<
  CreateMatchInput,
  "socketId" | "userId" | "displayName"
>;

export function createPlayer(input: PlayerInput): MatchPlayer {
  return {
    socketId: input.socketId,
    userId: input.userId,
    displayName: input.displayName,
    ready: false,
    connected: true,
    disconnectedAt: null,
  };
}

export function createScoreEntry(player: MatchPlayer): ScoreEntry {
  return {
    userId: player.userId,
    displayName: player.displayName,
    score: 0,
  };
}

export function createMatchState(
  matchId: string,
  input: CreateMatchInput,
): MatchState {
  const player = createPlayer(input);

  return {
    matchId,
    expectedPlayers: input.expectedPlayers,
    phase: "lobby",
    players: [player],
    roundsTotal: clampRounds(input.roundsTotal ?? 1),
    roundIndex: 0,
    scores: [createScoreEntry(player)],
    playlist: [],
    playlistError: null,
    round: null,
  };
}

export function ensureScoreEntry(match: MatchState, player: MatchPlayer): void {
  const existing = match.scores.find((entry) => entry.userId === player.userId);
  if (existing) {
    existing.displayName = player.displayName;
    return;
  }

  match.scores.push(createScoreEntry(player));
}

export function createRoundState(match: MatchState): RoundState {
  const preview = match.playlist[match.roundIndex] ?? null;

  return {
    roundIndex: match.roundIndex,
    phase: "sync",
    preview,
    readyUserIds: [],
    lockOwnerId: null,
    lockAt: null,
    guessEndsAt: null,
    countdownEndsAt: null,
  };
}
