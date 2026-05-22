import { randomInt } from "node:crypto";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export class MatchService {
  private readonly matches = new Map<string, MatchState>();
  private readonly socketToMatch = new Map<string, string>();

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

    this.socketToMatch.set(input.socketId, match.matchId);

    return match;
  }

  markReady(
    socketId: string,
    emit: (event: string, data: unknown) => void,
  ): ReadyResult {
    const match = this.getMatchBySocketOrThrow(socketId);
    if (match.phase !== "lobby") {
      throw new Error("INVALID_STATE");
    }
    const player = match.players.find((entry) => entry.socketId === socketId);

    if (!player) {
      throw new Error("PLAYER_NOT_IN_MATCH");
    }

    player.ready = true;

    const countdownStarted =
      match.phase === "lobby" &&
      match.players.length === match.expectedPlayers &&
      match.players.every((entry) => entry.ready);

    if (countdownStarted) {
      match.phase = "countdown";

      // Start a 10-second countdown
      let countdown = 3;
      const interval = setInterval(() => {
        countdown -= 1;
        emit("countdown", { matchId: match.matchId, countdown }); // Emit countdown updates

        if (countdown === 0) {
          clearInterval(interval);
          match.phase = "in-game";
          emit("match-started", { matchId: match.matchId }); // Notify that the match has started
        }
      }, 1000);
    }

    return {
      match,
      countdownStarted,
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
}

export const matchService = new MatchService();
