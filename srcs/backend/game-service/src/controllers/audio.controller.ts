import { Socket } from "socket.io";
import { logInfo } from "../lib/logger.js";
import { matchService } from "../services/match.service.js";
import { emitMatchError } from "./socket.helpers.js";
import { validateAudioTogglePayload } from "./socket.validation.js";

export function registerAudioHandlers(socket: Socket): void {
  socket.on("match:audio:toggle", (rawPayload: unknown) => {
    try {
      const payload = validateAudioTogglePayload(rawPayload);
      const match = matchService.getMatchBySocket(socket.id);
      if (!match || payload.matchId !== match.matchId) {
        throw new Error("INVALID_MATCH");
      }
      logInfo(
        `Audio toggled in match ${payload.matchId}: ${payload.action} at ${payload.time}s`,
      );

      socket.to(payload.matchId).emit("match:audio:sync", {
        action: payload.action,
        time: payload.time,
      });
    } catch (error) {
      console.error("Error toggling audio:", error);
      emitMatchError(socket, error);
    }
  });
}
