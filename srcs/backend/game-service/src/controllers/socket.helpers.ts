import { Socket } from "socket.io";
import { MatchStatePayload } from "../types/socket.payloads.js";
import type { RoundGuessTypingBroadcast } from "../types/socket.payloads.js";

export function readHeader(
  headers: Record<string, string | string[] | undefined>,
  name: string,
): string | undefined {
  const value = headers[name.toLowerCase()];
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

export function toPayload(match: MatchState): MatchStatePayload {
  return {
    matchId: match.matchId,
    roundsTotal: match.roundsTotal,
    phase: match.phase,
    hostUserId: match.hostUserId,
    players: match.players.map((player) => ({
      userId: player.userId,
      displayName: player.displayName,
      ready: player.ready,
      connected: player.connected,
      disconnectedAt: player.disconnectedAt,
    })),
    scores: match.scores,
    availablePlaylists: match.availablePlaylists,
    selectedPlaylist: match.selectedPlaylist,
    playlistPrepStatus: match.playlistPrepStatus,
    playlistPrepReady: match.playlistPrepReady,
    playlistPrepNeeded: match.playlistPrepNeeded,
    playlistPrepError: match.playlistPrepError,
  };
}

export function emitMatchState(socket: Socket, match: MatchState): void {
  socket.emit("match:state", toPayload(match));
  socket.to(match.matchId).emit("match:state", toPayload(match));
}

export function emitMatchError(socket: Socket, error: unknown): void {
  const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";

  socket.emit("match:error", { message });
}

export function toGuessTypingPayload(
  match: MatchState,
  text = match.round?.guessTypingText ?? "",
): RoundGuessTypingBroadcast {
  return {
    matchId: match.matchId,
    roundIndex: match.round?.roundIndex ?? 0,
    text,
  };
}

export function emitGuessTyping(
  socket: Socket,
  match: MatchState,
  text = match.round?.guessTypingText ?? "",
): void {
  socket.emit("round:guess_typing", toGuessTypingPayload(match, text));
}

export function emitRoundCatchUp(socket: Socket, match: MatchState): void {
  const round = match.round;
  if (!round || match.phase !== "in-game") {
    return;
  }

  const serverNow = Date.now();

  if (round.phase === "countdown") {
    const remainingSecs = Math.ceil(
      Math.max(0, round.countdownEndsAt! - serverNow) / 1000,
    );
    socket.emit("round:countdown", {
      matchId: match.matchId,
      roundIndex: round.roundIndex,
      seconds: remainingSecs,
      endsAt: round.countdownEndsAt,
      serverNow,
    });
    return;
  }

  if (round.phase === "playing") {
    const startedAt = round.countdownEndsAt;
    const resumeTime = startedAt
      ? Math.max(0, (serverNow - startedAt) / 1000)
      : 0;
    socket.emit("round:resume", {
      matchId: match.matchId,
      roundIndex: round.roundIndex,
      resumeTime,
      startedAt: startedAt ?? serverNow,
      serverNow,
    });
    if (round.skipUserIds.length > 0) {
      socket.emit("round:skip_update", {
        matchId: match.matchId,
        roundIndex: round.roundIndex,
        skipUserIds: [...round.skipUserIds],
      });
    }
    return;
  }

  if (round.phase === "guessing") {
    socket.emit("round:lock_confirmed", {
      matchId: match.matchId,
      roundIndex: round.roundIndex,
      lockOwnerId: round.lockOwnerId,
      lockAt: round.lockAt,
      guessEndsAt: round.guessEndsAt,
      serverNow,
    });
    if (round.guessTypingText) {
      emitGuessTyping(socket, match);
    }
    return;
  }

  if (round.phase === "resolution-fail" || round.phase === "resolution-win") {
    const lockOwnerId = round.lockOwnerId;
    const preview = round.preview;
    const correct = round.phase === "resolution-win" && Boolean(lockOwnerId);

    if (!lockOwnerId) {
      const reason =
        round.phase === "resolution-win" && round.skipUserIds.length > 0
          ? "skip"
          : "no_guess";
      socket.emit("round:guess_result", {
        matchId: match.matchId,
        roundIndex: round.roundIndex,
        lockOwnerId: null,
        correct: false,
        reason,
        isrc: preview?.isrc ?? null,
        selectedTrack: preview
          ? {
              isrc: preview.isrc,
              track: preview.track ?? "",
              artist: preview.artist ?? "",
              imageUrl: preview.imageUrl ?? null,
              spotifyUrl: preview.spotifyUrl ?? null,
            }
          : null,
        scoreDelta: 0,
        totalScore: 0,
      });
      return;
    }

    const scoreEntry = match.scores.find((entry) => entry.userId === lockOwnerId);

    socket.emit("round:guess_result", {
      matchId: match.matchId,
      roundIndex: round.roundIndex,
      lockOwnerId,
      correct,
      reason: correct ? null : "wrong",
      isrc: preview?.isrc ?? null,
      selectedTrack:
        correct && preview
          ? {
              isrc: preview.isrc,
              track: preview.track ?? "",
              artist: preview.artist ?? "",
              imageUrl: preview.imageUrl ?? null,
              spotifyUrl: preview.spotifyUrl ?? null,
            }
          : null,
      scoreDelta: 0,
      totalScore: scoreEntry?.score ?? 0,
    });
  }
}
