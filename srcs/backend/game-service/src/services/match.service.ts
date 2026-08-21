/**
 * Match service orchestrator.
 *
 * Owns in-memory registries (matches, player/socket indexes, timers) and delegates
 * all behavior to modules under `services/match/`. Controllers import this class
 * via the singleton `matchService`; they must not import the submodules directly.
 *
 * Match lifecycle (server is source of truth):
 *   lobby → in-game → (round sync → countdown → playing → guessing → resolution) → finished
 *
 * Submodules:
 *   match.registry     — lookups and player/match queries
 *   match.lifecycle    — create / join
 *   match.lobby        — ready toggle and game start
 *   match.round-sync   — per-round sync and countdown
 *   match.gameplay     — lock, guess, preview-ended
 *   match.connection   — disconnect, reconnect, idle cleanup
 */
import {
  leaveMatch as leaveMatchConnection,
  reconnectSocket as reconnectSocketConnection,
  removeSocket as removeSocketConnection,
} from "./match/match.connection.js";
import {
  handlePreviewEnded as handlePreviewEndedAction,
  requestLock as requestLockAction,
  requestSkip as requestSkipAction,
  submitGuess as submitGuessAction,
} from "./match/match.gameplay.js";
import {
  createMatch as createMatchAction,
  generateMatchCode as generateMatchCodeAction,
  joinMatch as joinMatchAction,
} from "./match/match.lifecycle.js";
import { markReady as markReadyAction } from "./match/match.lobby.js";
import {
  clearPlaylistsForUser,
  selectPlaylist as selectPlaylistAction,
  sharePlaylists as sharePlaylistsAction,
  startPlaylistPreparation as startPlaylistPreparationAction,
} from "./match/match.playlists.js";
import { requestRematch as requestRematchAction } from "./match/match.rematch.js";
import {
  getMatch as getMatchFromRegistry,
  getMatchBySocket as getMatchBySocketFromRegistry,
  getMatchOrThrow as getMatchOrThrowFromRegistry,
  getPlayerByUserId as getPlayerByUserIdFromRegistry,
  getRoundSyncPayload as getRoundSyncPayloadFromRegistry,
  type MatchRegistry,
} from "./match/match.registry.js";
import { markRoundReady as markRoundReadyAction } from "./match/match.round-sync.js";
import type { MatchTimerContext } from "./match/match.timers.js";

export class MatchService {
  private readonly matches = new Map<string, MatchState>();
  private readonly userToMatch = new Map<string, string>();
  private readonly socketToMatch = new Map<string, string>();
  private readonly roundCountdownTimers = new Map<string, NodeJS.Timeout>();
  private readonly guessTimers = new Map<string, NodeJS.Timeout>();
  private readonly resumeTimers = new Map<string, NodeJS.Timeout>();
  private readonly syncTimers = new Map<string, NodeJS.Timeout>();

  private get registry(): MatchRegistry {
    return {
      matches: this.matches,
      userToMatch: this.userToMatch,
      socketToMatch: this.socketToMatch,
    };
  }

  private get timers(): MatchTimerContext {
    return {
      roundCountdownTimers: this.roundCountdownTimers,
      guessTimers: this.guessTimers,
      resumeTimers: this.resumeTimers,
      syncTimers: this.syncTimers,
    };
  }

  private get connectionContext() {
    return { ...this.registry, syncTimers: this.syncTimers };
  }

  generateMatchCode(length = 6): string {
    return generateMatchCodeAction(this.registry, length);
  }

  createMatch(input: CreateMatchInput): MatchState {
    return createMatchAction(this.registry, this.connectionContext, input);
  }

  joinMatch(input: JoinMatchInput): MatchState {
    return joinMatchAction(this.registry, input);
  }

  requestRematch(input: RematchRequestInput): RematchResult {
    return requestRematchAction(this.registry, input);
  }

  markReady(socketId: string, emit: EmitMatchEvent): Promise<ReadyResult> {
    return markReadyAction(this.registry, socketId, emit);
  }

  sharePlaylists(
    socketId: string,
    playlists: Array<{
      id: string;
      name: string;
      imageUrl?: string | null;
      trackCount?: number;
    }>,
  ): MatchState {
    return sharePlaylistsAction(this.registry, socketId, playlists);
  }

  selectPlaylist(
    socketId: string,
    input: {
      playlistId: string;
      ownerUserId: string;
      name?: string;
      imageUrl?: string | null;
      ownerDisplayName?: string;
      kind?: "playlist" | "album";
    },
    emit: EmitMatchEvent,
  ): Promise<MatchState> {
    return selectPlaylistAction(this.registry, socketId, input, emit);
  }

  startPlaylistPreparation(matchId: string, emit: EmitMatchEvent): void {
    startPlaylistPreparationAction(this.registry, matchId, emit);
  }

  markRoundReady(
    socketId: string,
    emit: EmitMatchEvent,
  ): { match: MatchState; countdownStarted: boolean; catchUp?: boolean } {
    return markRoundReadyAction(this.registry, this.timers, socketId, emit);
  }

  requestLock(
    socketId: string,
    time: number,
    emit: EmitMatchEvent,
  ): MatchState {
    return requestLockAction(
      this.registry,
      this.timers,
      this.connectionContext,
      socketId,
      time,
      emit,
    );
  }

  submitGuess(
    socketId: string,
    isrc: string,
    track: string,
    artist: string,
    emit: EmitMatchEvent,
  ): MatchState {
    return submitGuessAction(
      this.registry,
      this.timers,
      this.connectionContext,
      socketId,
      isrc,
      track,
      artist,
      emit,
    );
  }

  handlePreviewEnded(
    socketId: string,
    roundIndex: number,
    emit: EmitMatchEvent,
  ): MatchState {
    return handlePreviewEndedAction(
      this.registry,
      this.timers,
      this.connectionContext,
      socketId,
      roundIndex,
      emit,
    );
  }

  requestSkip(socketId: string, emit: EmitMatchEvent): MatchState {
    return requestSkipAction(
      this.registry,
      this.timers,
      this.connectionContext,
      socketId,
      emit,
    );
  }

  getRoundSyncPayload(matchId: string) {
    return getRoundSyncPayloadFromRegistry(this.registry, matchId);
  }

  getMatch(matchId: string): MatchState | undefined {
    return getMatchFromRegistry(this.registry, matchId);
  }

  getMatchBySocket(socketId: string): MatchState | undefined {
    return getMatchBySocketFromRegistry(this.registry, socketId);
  }

  removeSocket(socketId: string): MatchState | undefined {
    const match = this.getMatchBySocket(socketId);
    const userId = match?.players.find((p) => p.socketId === socketId)?.userId;
    const result = removeSocketConnection(this.connectionContext, socketId);
    if (result && userId) {
      clearPlaylistsForUser(result, userId);
    }
    return result;
  }

  leaveMatch(input: {
    socketId: string;
    userId?: string;
  }): MatchState | undefined {
    const matchBefore = this.getMatchBySocket(input.socketId);
    const userId =
      input.userId ??
      matchBefore?.players.find((p) => p.socketId === input.socketId)?.userId;

    const match = leaveMatchConnection(this.connectionContext, input);
    if (match && userId) {
      clearPlaylistsForUser(match, userId);
    }
    return match;
  }

  reconnectSocket(playerId: string, newSocketId: string): MatchState {
    return reconnectSocketConnection(
      this.connectionContext,
      playerId,
      newSocketId,
    );
  }

  getPlayerByUserId(userId: string): MatchPlayer | undefined {
    return getPlayerByUserIdFromRegistry(this.registry, userId);
  }

  getMatchOrThrow(matchId: string): MatchState {
    return getMatchOrThrowFromRegistry(this.registry, matchId);
  }
}

export const matchService = new MatchService();
