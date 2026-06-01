import type { Server } from "socket.io";
import { logInfo } from "../lib/logger.js";
import { registerMatchHandlers } from "../controllers/match.controller.js";
import { registerRoundHandlers } from "../controllers/round.controller.js";
import { registerAudioHandlers } from "../controllers/audio.controller.js";

export function registerSocketRoutes(io: Server): void {
  io.on("connection", (socket) => {
    logInfo(`Socket connected: ${socket.id}`);

    registerMatchHandlers(io, socket);
    registerRoundHandlers(io, socket);
    registerAudioHandlers(socket);
  });
}
