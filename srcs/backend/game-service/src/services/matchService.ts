export class MatchService {
  private readonly matches = new Map<string, MatchState>();
  private readonly socketToMatch = new Map<string, string>();

  createMatch(input: CreateMatchInput): MatchState {
    const matchId: string = input.matchId || "";

    if (this.matches.has(matchId)) {
      throw new Error("MATCH_ALREADY_EXISTS");
    }

    const match: MatchState = {
      matchId,
      expectedPlayers: input.expectedPlayers,
      phase: "lobby",
      players: [
        {
          socketId: input.socketId,
          playerId: input.playerId,
          playerName: input.playerName,
          ready: false,
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
        player.socketId === input.socketId ||
        player.playerId === input.playerId,
    );

    if (existingPlayer) {
      existingPlayer.socketId = input.socketId;
      existingPlayer.playerName = input.playerName;
      this.socketToMatch.set(input.socketId, match.matchId);
      return match;
    }

    match.players.push({
      socketId: input.socketId,
      playerId: input.playerId,
      playerName: input.playerName,
      ready: false,
    });

    this.socketToMatch.set(input.socketId, match.matchId);

    return match;
  }

  markReady(socketId: string): ReadyResult {
    const match = this.getMatchBySocketOrThrow(socketId);
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

    match.players = match.players.filter(
      (player) => player.socketId !== socketId,
    );
    this.socketToMatch.delete(socketId);

    if (match.players.length === 0) {
      this.matches.delete(match.matchId);
    }

    return match;
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
