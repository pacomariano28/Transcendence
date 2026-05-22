import type { Server, Socket } from "socket.io";
import { logInfo } from "../lib/logger.js";
import { matchService } from "../services/matchService.js";

type CreateMatchPayload = {
  matchId?: string;
  playerId: string;
  playerName: string;
  expectedPlayers: number;
};

type JoinMatchPayload = {
  matchId: string;
  playerId: string;
  playerName: string;
};

type MatchStatePayload = {
  matchId: string;
  expectedPlayers: number;
  phase: MatchState["phase"];
  players: Array<{
    playerId: string;
    playerName: string;
    ready: boolean;
  }>;
};

function toPayload(match: MatchState): MatchStatePayload {
  return {
    matchId: match.matchId,
    expectedPlayers: match.expectedPlayers,
    phase: match.phase,
    players: match.players.map((player) => ({
      playerId: player.playerId,
      playerName: player.playerName,
      ready: player.ready,
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
        const match = matchService.createMatch({
          ...payload,
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
        const match = matchService.joinMatch({
          ...payload,
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
