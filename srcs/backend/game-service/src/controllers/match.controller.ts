import type { Server, Socket } from "socket.io";
import { logInfo } from "../lib/logger.js";
import { matchService } from "../services/match.service.js";
import type {
  CreateMatchPayload,
  JoinMatchPayload,
  SelectPlaylistPayload,
  SharePlaylistsPayload,
} from "../types/socket.payloads.js";
import {
  toPayload,
  readHeader,
  emitMatchError,
  emitMatchState,
  emitRoundCatchUp,
} from "./socket.helpers.js";
import {
  LOCAL_SEED_PLAYLIST,
  LOCAL_SEED_PLAYLIST_ID,
  ROUND_NUMBER,
  SYSTEM_PLAYLIST_OWNER_ID,
} from "../utils/constants.js";

export function registerMatchHandlers(io: Server, socket: Socket): void {
  const emitToMatch = (matchId: string, event: string, data: unknown) => {
    io.to(matchId).emit(event, data);
  };

  socket.on("match:create", async (payload: CreateMatchPayload) => {
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

      const matchWithPlaylist = await matchService.selectPlaylist(
        socket.id,
        {
          playlistId: LOCAL_SEED_PLAYLIST_ID,
          ownerUserId: SYSTEM_PLAYLIST_OWNER_ID,
          name: LOCAL_SEED_PLAYLIST.name,
          imageUrl: LOCAL_SEED_PLAYLIST.imageUrl,
          ownerDisplayName: LOCAL_SEED_PLAYLIST.ownerDisplayName,
          kind: "playlist",
        },
        emitToMatch,
      );

      emitMatchState(socket, matchWithPlaylist);
      socket.emit("match:created", toPayload(matchWithPlaylist));
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
        emitRoundCatchUp(socket, match);
      }
    } catch (error) {
      emitMatchError(socket, error);
    }
  });

  socket.on("match:share_playlists", (payload: SharePlaylistsPayload) => {
    try {
      const match = matchService.sharePlaylists(
        socket.id,
        payload?.playlists ?? [],
      );
      emitMatchState(socket, match);
    } catch (error) {
      emitMatchError(socket, error);
    }
  });

  socket.on("match:select_playlist", async (payload: SelectPlaylistPayload) => {
    try {
      if (!payload?.playlistId || !payload?.ownerUserId) {
        throw new Error("INVALID_PAYLOAD");
      }
      const match = await matchService.selectPlaylist(
        socket.id,
        {
          playlistId: payload.playlistId,
          ownerUserId: payload.ownerUserId,
          name: payload.name,
          imageUrl: payload.imageUrl,
          ownerDisplayName: payload.ownerDisplayName,
          kind: payload.kind,
        },
        emitToMatch,
      );
      emitMatchState(socket, match);
    } catch (error) {
      emitMatchError(socket, error);
    }
  });

  socket.on("match:ready", async () => {
    try {
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
    logInfo(`Socket left the match voluntarily: ${socket.id}`);
  });

  socket.on("match:rematch", () => {
    try {
      const userId = readHeader(socket.handshake.headers, "x-user-id");
      if (!userId) {
        throw new Error("UNAUTHORIZED");
      }
      const displayName =
        readHeader(socket.handshake.headers, "x-user-username") ??
        readHeader(socket.handshake.headers, "x-user-email") ??
        "Guest";
      const result = matchService.requestRematch({
        socketId: socket.id,
        userId,
        displayName,
      });
      const { newMatch, oldMatchId } = result;
      const statePayload = toPayload(newMatch);
      const rematchPayload = {
        previousMatchId: oldMatchId,
        ...statePayload,
      };

      socket.leave(oldMatchId);
      socket.join(newMatch.matchId);

      if (!result.alreadyExisted && newMatch.selectedPlaylist) {
        matchService.startPlaylistPreparation(newMatch.matchId, emitToMatch);
      }
      socket.emit("match:rematch", rematchPayload);
      emitMatchState(socket, newMatch);
    } catch (error) {
      emitMatchError(socket, error);
    }
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
