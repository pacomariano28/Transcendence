import type { Server, Socket } from "socket.io";
import { matchService } from "../services/match.service.js";
import type {
  RoundLockPayload,
  RoundGuessPayload,
  RoundPreviewEndedPayload,
} from "../types/socket.payloads.js";
import {
  emitMatchError,
  emitMatchState,
  emitRoundCatchUp,
} from "./socket.helpers.js";
import { ROUND_COUNTDOWN_SECONDS } from "../utils/constants.js";

export function registerRoundHandlers(io: Server, socket: Socket): void {
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
          seconds: ROUND_COUNTDOWN_SECONDS,
          endsAt: result.match.round.countdownEndsAt,
        });
      }

      if (result.catchUp && result.match.round) {
        emitRoundCatchUp(socket, result.match);
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

  socket.on("round:preview_ended", (payload: RoundPreviewEndedPayload) => {
    try {
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
}
