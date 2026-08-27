import type { Server, Socket } from "socket.io";
import { matchService } from "../services/match.service.js";
import {
  emitMatchError,
  emitMatchState,
  emitRoundCatchUp,
  toGuessTypingPayload,
} from "./socket.helpers.js";
import { ROUND_COUNTDOWN_SECONDS } from "../utils/constants.js";
import {
  validateRoundGuessPayload,
  validateRoundGuessTypingPayload,
  validateRoundLockPayload,
  validateRoundPreviewEndedPayload,
  validateRoundSkipPayload,
} from "./socket.validation.js";

export function registerRoundHandlers(io: Server, socket: Socket): void {
  const assertCurrentMatch = (payloadMatchId: string): void => {
    const match = matchService.getMatchBySocket(socket.id);
    if (!match || match.matchId !== payloadMatchId) {
      throw new Error("INVALID_MATCH");
    }
  };

  socket.on("time:ping", (rawPayload: unknown) => {
    const serverRecvAt = Date.now();
    const payload =
      rawPayload && typeof rawPayload === "object" && !Array.isArray(rawPayload)
        ? (rawPayload as Record<string, unknown>)
        : null;
    const clientSentAt =
      payload &&
      typeof payload.clientSentAt === "number" &&
      Number.isFinite(payload.clientSentAt)
        ? payload.clientSentAt
        : null;
    if (clientSentAt === null) return;

    socket.emit("time:pong", {
      clientSentAt,
      serverRecvAt,
      serverSentAt: Date.now(),
    });
  });

  socket.on("round:ready", () => {
    try {
      const emitToMatch = (matchId: string, event: string, data: unknown) => {
        io.to(matchId).emit(event, data);
      };
      const result = matchService.markRoundReady(socket.id, emitToMatch);
      emitMatchState(socket, result.match);

      if (result.countdownStarted && result.match.round?.countdownEndsAt) {
        const serverNow = Date.now();
        io.to(result.match.matchId).emit("round:countdown", {
          matchId: result.match.matchId,
          roundIndex: result.match.round.roundIndex,
          seconds: ROUND_COUNTDOWN_SECONDS,
          endsAt: result.match.round.countdownEndsAt,
          serverNow,
        });
      }

      if (result.catchUp && result.match.round) {
        emitRoundCatchUp(socket, result.match);
      }
    } catch (error) {
      emitMatchError(socket, error);
    }
  });

  socket.on("round:lock_request", (rawPayload: unknown) => {
    try {
      const payload = validateRoundLockPayload(rawPayload);
      assertCurrentMatch(payload.matchId);
      const emitToMatch = (matchId: string, event: string, data: unknown) => {
        io.to(matchId).emit(event, data);
      };
      const match = matchService.requestLock(socket.id, emitToMatch);
      emitMatchState(socket, match);
    } catch (error) {
      emitMatchError(socket, error);
    }
  });

  socket.on("round:guess_submit", (rawPayload: unknown) => {
    try {
      const payload = validateRoundGuessPayload(rawPayload);
      assertCurrentMatch(payload.matchId);
      const emitToMatch = (matchId: string, event: string, data: unknown) => {
        io.to(matchId).emit(event, data);
      };
      const match = matchService.submitGuess(
        socket.id,
        payload.isrc,
        payload.track,
        payload.artist,
        emitToMatch,
      );
      emitMatchState(socket, match);
    } catch (error) {
      emitMatchError(socket, error);
    }
  });

  socket.on("round:guess_typing", (rawPayload: unknown) => {
    try {
      const payload = validateRoundGuessTypingPayload(rawPayload);
      if (payload.matchId) assertCurrentMatch(payload.matchId);
      const result = matchService.updateGuessTyping(socket.id, payload.text);
      if (!result) return;

      socket
        .to(result.match.matchId)
        .emit(
          "round:guess_typing",
          toGuessTypingPayload(result.match, result.text),
        );
    } catch (error) {
      emitMatchError(socket, error);
    }
  });

  socket.on("round:preview_ended", (rawPayload: unknown) => {
    try {
      const payload = validateRoundPreviewEndedPayload(rawPayload);
      assertCurrentMatch(payload.matchId);
      const emitToMatch = (matchId: string, event: string, data: unknown) => {
        io.to(matchId).emit(event, data);
      };
      const match = matchService.handlePreviewEnded(
        socket.id,
        payload.roundIndex,
        emitToMatch,
      );
      emitMatchState(socket, match);
    } catch (error) {
      emitMatchError(socket, error);
    }
  });

  socket.on("round:skip_request", (rawPayload: unknown) => {
    try {
      const payload = validateRoundSkipPayload(rawPayload);
      assertCurrentMatch(payload.matchId);
      const emitToMatch = (matchId: string, event: string, data: unknown) => {
        io.to(matchId).emit(event, data);
      };
      const match = matchService.requestSkip(socket.id, emitToMatch);
      emitMatchState(socket, match);
    } catch (error) {
      emitMatchError(socket, error);
    }
  });
}
