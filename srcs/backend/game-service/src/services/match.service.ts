import { randomInt } from "node:crypto";
import {
  ALPHABET,
  DISCONNECT_TTL_MS,
  GUESS_WINDOW_SECONDS,
  MAX_PLAYER,
  ROUND_COUNTDOWN_SECONDS,
  SECOND_MS,
} from "../utils/constants.js";
import { loadPlaylist } from "./playlist.service.js";
import { createMatchState, createPlayer, ensureScoreEntry } from "./state.js";
import {
  resolveGuess,
  startRound,
  startRoundCountdown,
  toRoundSyncPayload,
} from "./round.js";
import { replaceTimer } from "./timers.js";

export class MatchService {
  private readonly matches = new Map<string, MatchState>();
  private readonly userToMatch = new Map<string, string>();
  private readonly socketToMatch = new Map<string, string>();
  private readonly roundCountdownTimers = new Map<string, NodeJS.Timeout>();
  private readonly guessTimers = new Map<string, NodeJS.Timeout>();
  private readonly resumeTimers = new Map<string, NodeJS.Timeout>();

  private getConnectedPlayers(match: MatchState): MatchPlayer[] {
    return match.players.filter((entry) => entry.connected);
  }

  generateMatchCode(length = 6): string {
    let code;

    do {
      code = "";
      for (let i = 0; i < length; i++) {
        code += ALPHABET[randomInt(ALPHABET.length)];
      }
    } while (this.matches.has(code));

    return code;
  }

  createMatch(input: CreateMatchInput): MatchState {
    const existingMatchId = this.userToMatch.get(input.userId);
    if (existingMatchId) {
      throw new Error(
        "You cannot create a new game because you are already in-game",
      );
    }

    const matchId = this.generateMatchCode();
    const match = createMatchState(matchId, input);

    this.matches.set(matchId, match);
    this.userToMatch.set(input.userId, matchId);
    this.socketToMatch.set(input.socketId, matchId);

    return match;
  }

  joinMatch(input: JoinMatchInput): MatchState {
    const match = this.getMatchOrThrow(input.matchId);

    const existingPlayer = match.players.find(
      (player) =>
        player.socketId === input.socketId || player.userId === input.userId,
    );

    if (existingPlayer) {
      if (
        existingPlayer.connected &&
        existingPlayer.socketId !== input.socketId
      ) {
        throw new Error(
          "You cannot join to a game because you are already in-game",
        );
      }
      existingPlayer.socketId = input.socketId;
      existingPlayer.displayName = input.displayName;
      existingPlayer.connected = true;
      existingPlayer.disconnectedAt = null;
      ensureScoreEntry(match, existingPlayer);
      this.socketToMatch.set(input.socketId, match.matchId);
      return match;
    }

    if (match.players.length >= MAX_PLAYER) {
      throw new Error("MATCH_FULL");
    }

    const player = createPlayer({
      socketId: input.socketId,
      userId: input.userId,
      displayName: input.displayName,
    });

    match.players.push(player);
    ensureScoreEntry(match, player);

    this.userToMatch.set(input.userId, match.matchId);
    this.socketToMatch.set(input.socketId, match.matchId);

    return match;
  }

  async markReady(
    socketId: string,
    emit: EmitMatchEvent,
  ): Promise<ReadyResult> {
    const match = this.getMatchBySocketOrThrow(socketId);
    if (match.phase !== "lobby") {
      throw new Error("INVALID_STATE");
    }
    const player = match.players.find((entry) => entry.socketId === socketId);

    if (!player) {
      throw new Error("PLAYER_NOT_IN_MATCH");
    }

    player.ready = !player.ready;

    const connectedPlayers = this.getConnectedPlayers(match);
    const countdownStarted =
      match.phase === "lobby" &&
      connectedPlayers.length > 0 &&
      connectedPlayers.every((entry) => entry.ready);

    if (countdownStarted) {
      const previousPhase = match.phase;
      match.phase = "in-game";
      await loadPlaylist(match);
      startRound(match);
      emit(match.matchId, "match:phase", {
        matchId: match.matchId,
        phase: match.phase,
        previousPhase,
      });
      emit(match.matchId, "round:sync", toRoundSyncPayload(match));
    }

    return {
      match,
      countdownStarted,
    };
  }

  markRoundReady(
    socketId: string,
    emit: EmitMatchEvent,
  ): { match: MatchState; countdownStarted: boolean } {
    void emit;
    const match = this.getMatchBySocketOrThrow(socketId);
    if (match.phase !== "in-game" || !match.round) {
      throw new Error("INVALID_STATE");
    }
    if (match.round.phase !== "sync") {
      throw new Error("ROUND_NOT_READY");
    }

    const player = match.players.find((entry) => entry.socketId === socketId);
    if (!player) {
      throw new Error("PLAYER_NOT_IN_MATCH");
    }

    if (!match.round.readyUserIds.includes(player.userId)) {
      match.round.readyUserIds.push(player.userId);
    }

    const connectedPlayers = this.getConnectedPlayers(match);
    const countdownStarted = connectedPlayers.every((entry) =>
      match.round?.readyUserIds.includes(entry.userId),
    );

    if (countdownStarted) {
      match.round.phase = "countdown";
      match.round.countdownEndsAt =
        Date.now() + ROUND_COUNTDOWN_SECONDS * SECOND_MS;
      startRoundCountdown(match, this.roundCountdownTimers);
    }

    return { match, countdownStarted };
  }

  requestLock(
    socketId: string,
    time: number,
    emit: EmitMatchEvent,
  ): MatchState {
    const match = this.getMatchBySocketOrThrow(socketId);
    if (match.phase !== "in-game" || !match.round) {
      throw new Error("INVALID_STATE");
    }

    if (match.round.phase !== "playing") {
      throw new Error("ROUND_NOT_PLAYING");
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
      this.guessTimers,
      match.matchId,
      GUESS_WINDOW_SECONDS * SECOND_MS,
      () => {
        resolveGuess({
          match,
          lockOwnerId: player.userId,
          correct: false,
          reason: "timeout",
          emit,
          guessTimers: this.guessTimers,
          resumeTimers: this.resumeTimers,
        });
      },
    );

    return match;
  }

  submitGuess(
    socketId: string,
    trackId: string,
    emit: EmitMatchEvent,
  ): MatchState {
    const match = this.getMatchBySocketOrThrow(socketId);
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

    const previewId = match.round.preview?.trackId ?? null;
    const isCorrect = Boolean(previewId && trackId === previewId);
    resolveGuess({
      match,
      lockOwnerId: player.userId,
      correct: isCorrect,
      reason: isCorrect ? null : "wrong",
      emit,
      guessTimers: this.guessTimers,
      resumeTimers: this.resumeTimers,
    });
    return match;
  }

  handlePreviewEnded(
    socketId: string,
    roundIndex: number,
    emit: EmitMatchEvent,
  ): MatchState {
    const match = this.getMatchBySocketOrThrow(socketId);

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
      return match;
    }

    match.roundIndex += 1;
    startRound(match);
    emit(match.matchId, "round:sync", toRoundSyncPayload(match));
    return match;
  }

  getRoundSyncPayload(matchId: string) {
    const match = this.getMatch(matchId);
    if (!match || !match.round) {
      return null;
    }

    return toRoundSyncPayload(match);
  }

  getMatch(matchId: string): MatchState | undefined {
    return this.matches.get(matchId);
  }

  getMatchBySocket(socketId: string): MatchState | undefined {
    const matchId = this.socketToMatch.get(socketId);

    if (!matchId) {
      return undefined;
    }

    return this.matches.get(matchId);
  }

  removeSocket(socketId: string): MatchState | undefined {
    const match = this.getMatchBySocket(socketId);

    if (!match) {
      return undefined;
    }

    const player = match.players.find((p) => p.socketId === socketId);
    if (player) {
      this.userToMatch.delete(player.userId);
      player.socketId = null;
      player.connected = false;
      player.disconnectedAt = new Date().toISOString();
      console.log(
        `Player ${player.userId} disconnected from match ${match.matchId}`,
      );
    }

    const allDisconnected = match.players.every((p) => !p.connected);
    if (allDisconnected) {
      console.log(
        `All players disconnected. Match ${match.matchId} will be removed after timeout if no reconnection occurs.`,
      );

      setTimeout(() => {
        const stillDisconnected = match.players.every((p) => !p.connected);
        if (stillDisconnected) {
          console.log(`Match ${match.matchId} removed due to inactivity.`);
          this.matches.delete(match.matchId);
        }
      }, DISCONNECT_TTL_MS);
    }

    this.socketToMatch.delete(socketId);
    return match;
  }

  reconnectSocket(playerId: string, newSocketId: string): MatchState {
    for (const match of this.matches.values()) {
      const player = match.players.find((p) => p.userId === playerId);
      if (player) {
        player.socketId = newSocketId;
        player.connected = true;
        player.disconnectedAt = null;
        this.userToMatch.set(playerId, match.matchId);
        this.socketToMatch.set(newSocketId, match.matchId);
        console.log(`Player ${playerId} reconnected to match ${match.matchId}`);
        return match;
      }
    }

    throw new Error("MATCH_NOT_FOUND");
  }

  getPlayerByUserId(userId: string): MatchPlayer | undefined {
    for (const match of this.matches.values()) {
      const player = match.players.find(
        (p: MatchPlayer) => p.userId === userId,
      );
      if (player && player.connected) {
        return player;
      }
    }
    return undefined;
  }

  private getMatchOrThrow(matchId: string): MatchState {
    const match = this.matches.get(matchId);

    if (!match) {
      throw new Error("MATCH_NOT_FOUND");
    }

    return match;
  }

  private getMatchBySocketOrThrow(socketId: string): MatchState {
    const match = this.getMatchBySocket(socketId);

    if (!match) {
      throw new Error("MATCH_NOT_FOUND");
    }

    return match;
  }
}

export const matchService = new MatchService();
