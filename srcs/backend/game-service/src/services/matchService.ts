import { randomInt } from "node:crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const PLAYLIST_SERVICE_URL =
  process.env.PLAYLIST_SERVICE_URL || "http://playlist-service:4004";
const MIN_ROUNDS = 1;
const MAX_ROUNDS = 5;
// const LOBBY_COUNTDOWN_SECONDS = 5;
const ROUND_COUNTDOWN_SECONDS = 5;
const GUESS_WINDOW_SECONDS = 10;
const COOLDOWN_SECONDS = 5;
const RESOLUTION_SECONDS = 5;
const BASE_SCORE = 100;
const SPEED_MULTIPLIER = 10;
const WRONG_GUESS_PENALTY = 50;
const PLAYLIST_TIMEOUT_MS = 5000;
const SECOND_MS = 1000;

function clampRounds(rounds: number): number {
  return Math.min(MAX_ROUNDS, Math.max(MIN_ROUNDS, rounds));
}

export class MatchService {
  private readonly matches = new Map<string, MatchState>();
  private readonly socketToMatch = new Map<string, string>();
  // private readonly countdownTimers = new Map<string, NodeJS.Timeout>();
  private readonly roundCountdownTimers = new Map<string, NodeJS.Timeout>();
  private readonly guessTimers = new Map<string, NodeJS.Timeout>();
  private readonly resumeTimers = new Map<string, NodeJS.Timeout>();

  generateMatchCode(length = 6): string {
    let code;

    do {
      code = ""; // Reset code for each attempt
      for (let i = 0; i < length; i++) {
        code += ALPHABET[randomInt(ALPHABET.length)];
      }
    } while (this.matches.has(code)); // Ensure the code is unique

    return code;
  }

  createMatch(input: CreateMatchInput): MatchState {
    const matchId: string = this.generateMatchCode();

    // if (this.matches.has(matchId)) {
    //   throw new Error("MATCH_ALREADY_EXISTS");
    // }

    const match: MatchState = {
      matchId,
      expectedPlayers: input.expectedPlayers,
      phase: "lobby",
      players: [
        {
          socketId: input.socketId,
          userId: input.userId,
          displayName: input.displayName,
          ready: false,
          connected: true,
          disconnectedAt: null,
        },
      ],
      roundsTotal: clampRounds(input.roundsTotal ?? 1),
      roundIndex: 0,
      scores: [
        {
          userId: input.userId,
          displayName: input.displayName,
          score: 0,
        },
      ],
      playlist: [],
      playlistError: null,
      round: null,
    };

    this.matches.set(matchId, match);
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
      existingPlayer.socketId = input.socketId;
      existingPlayer.displayName = input.displayName;
      existingPlayer.connected = true;
      existingPlayer.disconnectedAt = null;
      this.ensureScoreEntry(match, existingPlayer);
      this.socketToMatch.set(input.socketId, match.matchId);
      return match;
    }

    if (match.players.length >= match.expectedPlayers) {
      throw new Error("MATCH_FULL");
    }

    match.players.push({
      socketId: input.socketId,
      userId: input.userId,
      displayName: input.displayName,
      ready: false,
      connected: true,
      disconnectedAt: null,
    });

    this.ensureScoreEntry(match, {
      socketId: input.socketId,
      userId: input.userId,
      displayName: input.displayName,
      ready: false,
      connected: true,
      disconnectedAt: null,
    });

    this.socketToMatch.set(input.socketId, match.matchId);

    return match;
  }

  async markReady(
    socketId: string,
    emit: (matchId: string, event: string, data: unknown) => void,
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

    const connectedPlayers = match.players.filter((entry) => entry.connected);
    const countdownStarted =
      match.phase === "lobby" &&
      connectedPlayers.length > 0 &&
      connectedPlayers.every((entry) => entry.ready);

    if (countdownStarted) {
      const previousPhase = match.phase;
      match.phase = "in-game";
      await this.loadPlaylist(match);
      this.startRound(match);
      emit(match.matchId, "match:phase", {
        matchId: match.matchId,
        phase: match.phase,
        previousPhase,
      });
      emit(match.matchId, "round:sync", this.toRoundSyncPayload(match));
    }

    return {
      match,
      countdownStarted,
    };
  }

  markRoundReady(
    socketId: string,
    _emit: (matchId: string, event: string, data: unknown) => void,
  ): { match: MatchState; countdownStarted: boolean } {
    void _emit;
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

    const connectedPlayers = match.players.filter((entry) => entry.connected);
    const countdownStarted = connectedPlayers.every((entry) =>
      match.round?.readyUserIds.includes(entry.userId),
    );

    if (countdownStarted) {
      match.round.phase = "countdown";
      match.round.countdownEndsAt =
        Date.now() + ROUND_COUNTDOWN_SECONDS * SECOND_MS;
      this.startRoundCountdown(match);
    }

    return { match, countdownStarted };
  }

  requestLock(
    socketId: string,
    time: number,
    emit: (matchId: string, event: string, data: unknown) => void,
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

    this.clearTimer(this.guessTimers, match.matchId);
    const timer = setTimeout(() => {
      this.resolveGuess(match, player.userId, false, "timeout", emit);
    }, GUESS_WINDOW_SECONDS * SECOND_MS);
    this.guessTimers.set(match.matchId, timer);

    return match;
  }

  submitGuess(
    socketId: string,
    trackId: string,
    emit: (matchId: string, event: string, data: unknown) => void,
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
    this.resolveGuess(
      match,
      player.userId,
      isCorrect,
      isCorrect ? null : "wrong",
      emit,
    );
    return match;
  }

  handlePreviewEnded(
    socketId: string,
    roundIndex: number,
    emit: (matchId: string, event: string, data: unknown) => void,
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
    this.startRound(match);
    emit(match.matchId, "round:sync", this.toRoundSyncPayload(match));
    return match;
  }

  getRoundSyncPayload(matchId: string) {
    const match = this.getMatch(matchId);
    if (!match || !match.round) {
      return null;
    }

    return {
      matchId: match.matchId,
      roundIndex: match.roundIndex,
      roundsTotal: match.roundsTotal,
      preview: match.round.preview,
      playlistError: match.playlistError,
    };
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
      player.socketId = null;
      player.connected = false;
      player.disconnectedAt = new Date().toISOString();
      console.log(
        `Player ${player.userId} disconnected from match ${match.matchId}`,
      );
    }

    // Check if all players are disconnected
    const allDisconnected = match.players.every((p) => !p.connected);
    if (allDisconnected) {
      console.log(
        `All players disconnected. Match ${match.matchId} will be removed after timeout if no reconnection occurs.`,
      );

      // Set a timeout to remove the match if no players reconnect
      setTimeout(() => {
        const stillDisconnected = match.players.every((p) => !p.connected);
        if (stillDisconnected) {
          console.log(`Match ${match.matchId} removed due to inactivity.`);
          this.matches.delete(match.matchId);
        }
      }, 300000); // 5 minutes timeout
    }

    this.socketToMatch.delete(socketId);
    return match;
  }

  reconnectSocket(playerId: string, newSocketId: string): MatchState {
    for (const match of this.matches.values()) {
      const player = match.players.find((p) => p.userId === playerId);
      if (player) {
        player.socketId = newSocketId; // Restore the player's connection
        player.connected = true;
        player.disconnectedAt = null;
        this.socketToMatch.set(newSocketId, match.matchId);
        console.log(`Player ${playerId} reconnected to match ${match.matchId}`);
        return match;
      }
    }

    throw new Error("MATCH_NOT_FOUND");
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

  private ensureScoreEntry(match: MatchState, player: MatchPlayer): void {
    const existing = match.scores.find(
      (entry) => entry.userId === player.userId,
    );
    if (existing) {
      existing.displayName = player.displayName;
      return;
    }

    match.scores.push({
      userId: player.userId,
      displayName: player.displayName,
      score: 0,
    });
  }

  private startRound(match: MatchState): void {
    const preview = match.playlist[match.roundIndex] ?? null;
    match.round = {
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

  // private startLobbyCountdown(
  //   match: MatchState,
  //   emit: (matchId: string, event: string, data: unknown) => void,
  // ): void {
  //   this.clearTimer(this.countdownTimers, match.matchId);

  //   const timer = setTimeout(() => {
  //     const previousPhase = match.phase;
  //     match.phase = "in-game";
  //     emit(match.matchId, "match:phase", {
  //       matchId: match.matchId,
  //       phase: match.phase,
  //       previousPhase,
  //     });
  //     this.startRound(match);
  //     emit(match.matchId, "round:sync", this.toRoundSyncPayload(match));
  //   }, LOBBY_COUNTDOWN_SECONDS * SECOND_MS);

  //   this.countdownTimers.set(match.matchId, timer);
  // }

  private startRoundCountdown(match: MatchState): void {
    this.clearTimer(this.roundCountdownTimers, match.matchId);

    const timer = setTimeout(() => {
      if (!match.round) {
        return;
      }

      match.round.phase = "playing";
      match.round.countdownEndsAt = null;
    }, ROUND_COUNTDOWN_SECONDS * SECOND_MS);

    this.roundCountdownTimers.set(match.matchId, timer);
  }

  private resolveGuess(
    match: MatchState,
    lockOwnerId: string,
    correct: boolean,
    reason: "wrong" | "timeout" | null,
    emit: (matchId: string, event: string, data: unknown) => void,
  ): void {
    this.clearTimer(this.guessTimers, match.matchId);
    this.clearTimer(this.resumeTimers, match.matchId);

    const round = match.round;
    if (!round) {
      return;
    }

    const scoreEntry = match.scores.find(
      (entry) => entry.userId === lockOwnerId,
    );
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
      const timer = setTimeout(() => {
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
        this.startRound(match);
        emit(match.matchId, "round:sync", this.toRoundSyncPayload(match));
      }, RESOLUTION_SECONDS * SECOND_MS);

      this.resumeTimers.set(match.matchId, timer);
      return;
    }

    const resumeTimer = setTimeout(() => {
      if (!match.round) {
        return;
      }

      const resumeTime = match.round.lockAt;
      match.round.phase = "playing";
      match.round.lockOwnerId = null;
      match.round.lockAt = null;
      match.round.guessEndsAt = null;

      emit(match.matchId, "round:resume", {
        matchId: match.matchId,
        roundIndex: match.round.roundIndex,
        resumeTime,
      });
    }, COOLDOWN_SECONDS * SECOND_MS);

    this.resumeTimers.set(match.matchId, resumeTimer);
  }

  private toRoundSyncPayload(match: MatchState) {
    return {
      matchId: match.matchId,
      roundIndex: match.roundIndex,
      roundsTotal: match.roundsTotal,
      preview: match.round?.preview ?? null,
      playlistError: match.playlistError,
    };
  }

  private clearTimer(
    timers: Map<string, NodeJS.Timeout>,
    matchId: string,
  ): void {
    const timer = timers.get(matchId);
    if (!timer) {
      return;
    }

    clearTimeout(timer);
    timers.delete(matchId);
  }

  private async loadPlaylist(match: MatchState): Promise<void> {
    if (match.playlist.length > 0 || match.playlistError) {
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PLAYLIST_TIMEOUT_MS);

    try {
      const response = await fetch(`${PLAYLIST_SERVICE_URL}/get-playlist`, {
        signal: controller.signal,
      });
      const payload = (await response.json()) as {
        ok: boolean;
        songs?: PlaylistItem[];
        error?: string;
      };

      if (!response.ok || !payload.ok || !payload.songs) {
        match.playlistError = payload.error || "PLAYLIST_FETCH_FAILED";
        return;
      }

      match.playlist = payload.songs;
      match.roundsTotal = Math.min(match.roundsTotal, match.playlist.length);
    } catch (error) {
      match.playlistError =
        error instanceof Error ? error.message : "PLAYLIST_FETCH_FAILED";
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const matchService = new MatchService();
