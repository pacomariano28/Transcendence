import type { Server, Socket } from "socket.io";
import { logInfo } from "../lib/logger.js";
import { matchService } from "../services/matchService.js";

type CreateMatchPayload = {
  matchId?: string;
  expectedPlayers: number;
  displayName?: string;
  userId?: string;
  playerId?: string;
  playerName?: string;
};

type JoinMatchPayload = {
  matchId: string;
  displayName?: string;
  userId?: string;
  playerId?: string;
  playerName?: string;
};

type MatchStatePayload = {
  matchId: string;
  expectedPlayers: number;
  phase: MatchState["phase"];
  players: Array<{
    userId: string;
    displayName: string;
    playerId?: string;
    playerName?: string;
    ready: boolean;
    connected: boolean;
    disconnectedAt: string | null;
  }>;
};

function toPayload(match: MatchState): MatchStatePayload {
  return {
    matchId: match.matchId,
    expectedPlayers: match.expectedPlayers,
    phase: match.phase,
    players: match.players.map((player) => ({
      userId: player.userId,
      displayName: player.displayName,
      playerId: player.userId,
      playerName: player.displayName,
      ready: player.ready,
      connected: player.connected,
      disconnectedAt: player.disconnectedAt,
    })),
  };
}

function emitMatchState(socket: Socket, match: MatchState): void {
  socket.emit("match:state", toPayload(match));
  socket.to(match.matchId).emit("match:state", toPayload(match));
}

function emitMatchError(socket: Socket, error: unknown): void {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  socket.emit("match:error", { message });
}

export function registerSocketHandlers(io: Server): void {
  io.on("connection", (socket) => {
    logInfo(`Socket connected: ${socket.id}`);

    socket.on("match:create", (payload: CreateMatchPayload) => {
      console.log("Event received: match:create", payload);
      try {
        const userId = payload.userId ?? payload.playerId;
        if (!userId) {
          throw new Error("UNAUTHORIZED");
        }
        const displayName =
          payload.displayName ?? payload.playerName ?? "Guest";
        const match = matchService.createMatch({
          expectedPlayers: payload.expectedPlayers,
          userId,
          displayName,
          socketId: socket.id,
        });

        console.log("Match created:", match);
        socket.join(match.matchId);
        emitMatchState(socket, match);
        socket.emit("match:created", toPayload(match));
      } catch (error) {
        console.error("Error creating match:", error);
        emitMatchError(socket, error);
      }
    });

    socket.on("match:join", (payload: JoinMatchPayload) => {
      try {
        const userId = payload.userId ?? payload.playerId;
        if (!userId) {
          throw new Error("UNAUTHORIZED");
        }
        const displayName =
          payload.displayName ?? payload.playerName ?? "Guest";
        const match = matchService.joinMatch({
          matchId: payload.matchId,
          userId,
          displayName,
          socketId: socket.id,
        });

        socket.join(match.matchId);
        emitMatchState(socket, match);
        socket.emit("match:joined", toPayload(match));
      } catch (error) {
        emitMatchError(socket, error);
      }
    });

    socket.on("match:ready", () => {
      try {
        const result = matchService.markReady(socket.id, () => undefined);

        emitMatchState(socket, result.match);

        if (result.countdownStarted) {
          io.to(result.match.matchId).emit("match:countdown", {
            seconds: 5,
          });
          logInfo(`Match ${result.match.matchId} countdown started`);
        }
      } catch (error) {
        emitMatchError(socket, error);
      }
    });

    socket.on("disconnect", () => {
      const match = matchService.removeSocket(socket.id);

      if (match) {
        io.to(match.matchId).emit("match:state", toPayload(match));
      }

      logInfo(`Socket disconnected: ${socket.id}`);
    });
  });
}
