import { Socket } from "socket.io";
import type { AudioTogglePayload } from "../types/socket.payloads.js";
import { logInfo } from "../lib/logger.js";

export function registerAudioHandlers(socket: Socket): void {
  socket.on("match:audio:toggle", (payload: AudioTogglePayload) => {
    try {
      logInfo(
        `Audio toggled in match ${payload.matchId}: ${payload.action} at ${payload.time}s`,
      );

      socket.to(payload.matchId).emit("match:audio:sync", {
        action: payload.action,
        time: payload.time,
      });
    } catch (error) {
      console.error("Error toggling audio:", error);
    }
  });
}
