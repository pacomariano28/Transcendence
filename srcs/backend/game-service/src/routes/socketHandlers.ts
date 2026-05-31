import type { Server, Socket } from "socket.io";
import { logInfo } from "../lib/logger.js";
import { matchService } from "../services/matchService.js";

type CreateMatchPayload = {
  matchId?: string;
  expectedPlayers: number;
  displayName?: string;
};

type JoinMatchPayload = {
  matchId: string;
  displayName?: string;
};

type MatchStatePayload = {
  matchId: string;
  expectedPlayers: number;
  phase: MatchState["phase"];
  players: Array<{
    userId: string;
    displayName: string;
    ready: boolean;
    connected: boolean;
    disconnectedAt: string | null;
  }>;
};

type AudioTogglePayload = {
  matchId: string;
  action: "play" | "pause";
  time: number;
};

// type RoundReadyPayload = {
//   matchId: string;
// };

type RoundLockPayload = {
  matchId: string;
  time: number;
};

type RoundGuessPayload = {
  matchId: string;
  trackId: string;
};

function readHeader(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | undefined {
  const value = headers[name.toLowerCase()];
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

function toPayload(match: MatchState): MatchStatePayload {
  return {
    matchId: match.matchId,
    expectedPlayers: match.expectedPlayers,
    phase: match.phase,
    players: match.players.map((player) => ({
      userId: player.userId,
      displayName: player.displayName,
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
        const userId = readHeader(socket.handshake.headers, "x-user-id");
        if (!userId) {
          throw new Error("UNAUTHORIZED");
        }
        const displayName =
          payload.displayName ??
          readHeader(socket.handshake.headers, "x-user-username") ??
          readHeader(socket.handshake.headers, "x-user-email") ??
          "Guest";
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
        const userId = readHeader(socket.handshake.headers, "x-user-id");
        if (!userId) {
          throw new Error("UNAUTHORIZED");
        }
        const displayName =
          payload.displayName ??
          readHeader(socket.handshake.headers, "x-user-username") ??
          readHeader(socket.handshake.headers, "x-user-email") ??
          "Guest";
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
        const emitToMatch = (matchId: string, event: string, data: unknown) => {
          io.to(matchId).emit(event, data);
        };
        const result = matchService.markReady(socket.id, emitToMatch);

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

    socket.on("round:ready", () => {
      try {
        const emitToMatch = (matchId: string, event: string, data: unknown) => {
          io.to(matchId).emit(event, data);
        };
        const result = matchService.markRoundReady(socket.id, emitToMatch);
        emitMatchState(socket, result.match);

        if (result.countdownStarted && result.match.round?.countdownEndsAt) {
          io.to(result.match.matchId).emit("round:countdown", {
            matchId: result.match.matchId,
            roundIndex: result.match.round.roundIndex,
            seconds: 5,
            endsAt: result.match.round.countdownEndsAt,
          });
        }
      } catch (error) {
        emitMatchError(socket, error);
      }
    });

    socket.on("round:lock_request", (payload: RoundLockPayload) => {
      try {
        const emitToMatch = (matchId: string, event: string, data: unknown) => {
          io.to(matchId).emit(event, data);
        };
        const match = matchService.requestLock(
          socket.id,
          payload.time,
          emitToMatch,
        );
        emitMatchState(socket, match);
      } catch (error) {
        emitMatchError(socket, error);
      }
    });

    socket.on("round:guess_submit", (payload: RoundGuessPayload) => {
      try {
        const emitToMatch = (matchId: string, event: string, data: unknown) => {
          io.to(matchId).emit(event, data);
        };
        const match = matchService.submitGuess(
          socket.id,
          payload.trackId,
          emitToMatch,
        );
        emitMatchState(socket, match);
      } catch (error) {
        emitMatchError(socket, error);
      }
    });

    socket.on("match:audio:toggle", (payload: AudioTogglePayload) => {
      try {
        logInfo(
          `Audio toggled in match ${payload.matchId}: ${payload.action} at ${payload.time}s`,
        );

        // socket.to(room).emit envia el mensaje a todos en la sala EXCEPTO al remitente.
        // Esto es perfecto porque el remitente ya pausó/reprodujo su propia música localmente.
        socket.to(payload.matchId).emit("match:audio:sync", {
          action: payload.action,
          time: payload.time,
        });
      } catch (error) {
        console.error("Error toggling audio:", error);
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
