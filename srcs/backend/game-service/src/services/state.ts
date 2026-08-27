import { ROUND_NUMBER } from "../utils/constants.js";

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
    phase: "lobby",
    hostUserId: input.userId,
    players: [player],
    roundsTotal: ROUND_NUMBER,
    roundIndex: 0,
    scores: [createScoreEntry(player)],
    playlist: [],
    playlistError: null,
    availablePlaylists: [],
    selectedPlaylist: null,
    playlistPrepStatus: "idle",
    playlistPrepReady: 0,
    playlistPrepNeeded: ROUND_NUMBER,
    playlistPrepError: null,
    preparedSongs: [],
    round: null,
    rematchTargetId: null,
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
    skipUserIds: [],
    lockOwnerId: null,
    lockAt: null,
    guessEndsAt: null,
    countdownEndsAt: null,
    guessTypingText: "",
  };
}
