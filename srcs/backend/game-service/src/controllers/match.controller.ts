import type { Server, Socket } from "socket.io";
import { logInfo } from "../lib/logger.js";
import { matchService } from "../services/match.service.js";
import type {
  CreateMatchPayload,
  JoinMatchPayload,
} from "../types/socket.payloads.js";
import {
  toPayload,
  readHeader,
  emitMatchError,
  emitMatchState,
} from "./socket.helpers.js";
import { ROUND_NUMBER } from "../utils/constants.js";

export function registerMatchHandlers(io: Server, socket: Socket): void {
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
        roundsTotal: ROUND_NUMBER,
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

      if (match.phase === "in-game") {
        const roundPayload = matchService.getRoundSyncPayload(match.matchId);
        if (roundPayload) {
          socket.emit("round:sync", roundPayload);
        }
      }
    } catch (error) {
      emitMatchError(socket, error);
    }
  });

  socket.on("match:ready", async () => {
    try {
      const emitToMatch = (matchId: string, event: string, data: unknown) => {
        io.to(matchId).emit(event, data);
      };
      const result = await matchService.markReady(socket.id, emitToMatch);

      emitMatchState(socket, result.match);
    } catch (error) {
      emitMatchError(socket, error);
    }
  });

  socket.on("match:leave", () => {
    const userId = readHeader(socket.handshake.headers, "x-user-id");
    const match = matchService.leaveMatch({
      socketId: socket.id,
      userId: userId ?? undefined,
    });

    if (match) {
      socket.leave(match.matchId);

      io.to(match.matchId).emit("match:state", toPayload(match));
    }
    logInfo(`Socket dejó la partida voluntariamente: ${socket.id}`);
  });

  socket.on("disconnect", () => {
    const match = matchService.removeSocket(socket.id);

    if (match) {
      socket.leave(match.matchId);

      io.to(match.matchId).emit("match:state", toPayload(match));
    }

    logInfo(`Socket disconnected: ${socket.id}`);
  });
}
