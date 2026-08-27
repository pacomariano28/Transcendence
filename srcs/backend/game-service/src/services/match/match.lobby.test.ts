import assert from "node:assert/strict";
import test from "node:test";
import {
  createMatchState,
  createPlayer,
  ensureScoreEntry,
} from "../state.js";
import { markReady, type MatchLobbyContext } from "./match.lobby.js";

function createReadyLobby(): {
  ctx: MatchLobbyContext;
  match: MatchState;
} {
  const match = createMatchState("ROOM01", {
    socketId: "socket-host",
    userId: "user-host",
    displayName: "Host",
  });
  const guest = createPlayer({
    socketId: "socket-guest",
    userId: "user-guest",
    displayName: "Guest",
  });

  match.players.push(guest);
  ensureScoreEntry(match, guest);
  match.players[0].ready = true;
  match.selectedPlaylist = {
    id: "playlist-1",
    name: "Test playlist",
    ownerUserId: "user-host",
    ownerDisplayName: "Host",
  };
  match.playlistPrepStatus = "ready";
  match.preparedSongs = Array.from({ length: 5 }, (_, index) => ({
    isrc: `ISRC${index}`,
    fileName: `preview-${index}.mp3`,
    title: `Track ${index}`,
    artist: "Artist",
  }));

  return {
    match,
    ctx: {
      matches: new Map([[match.matchId, match]]),
      userToMatch: new Map([
        ["user-host", match.matchId],
        ["user-guest", match.matchId],
      ]),
      socketToMatch: new Map([
        ["socket-host", match.matchId],
        ["socket-guest", match.matchId],
      ]),
      startingMatchIds: new Set(),
    },
  };
}

function playableSongs(): PlaylistItem[] {
  return Array.from({ length: 5 }, (_, index) => ({
    isrc: `ISRC${index}`,
    fileName: `preview-${index}.mp3`,
    track: `Track ${index}`,
    artist: "Artist",
  }));
}

test("a burst of concurrent ready events starts a match only once", async () => {
  const { ctx, match } = createReadyLobby();
  const events: string[] = [];
  let releasePlaylist!: () => void;
  const playlistGate = new Promise<void>((resolve) => {
    releasePlaylist = resolve;
  });
  let loadCalls = 0;

  const loadPlaylist = async (currentMatch: MatchState): Promise<void> => {
    loadCalls += 1;
    await playlistGate;
    currentMatch.playlist = playableSongs();
  };
  const emit: EmitMatchEvent = (_matchId, event) => {
    events.push(event);
  };

  const firstReady = markReady(
    ctx,
    "socket-guest",
    emit,
    loadPlaylist,
  );

  assert.equal(ctx.startingMatchIds.has(match.matchId), true);

  const overlappingReady = await Promise.all(
    Array.from({ length: 25 }, () =>
      markReady(ctx, "socket-host", emit, loadPlaylist),
    ),
  );

  assert.equal(
    overlappingReady.every((result) => !result.countdownStarted),
    true,
  );
  assert.equal(match.players[0].ready, true);

  releasePlaylist();
  const started = await firstReady;

  assert.equal(started.countdownStarted, true);
  assert.equal(loadCalls, 1);
  assert.equal(match.phase, "in-game");
  assert.ok(match.round);
  assert.equal(events.filter((event) => event === "match:phase").length, 1);
  assert.equal(events.filter((event) => event === "round:sync").length, 1);
  assert.equal(ctx.startingMatchIds.size, 0);
});

test("a failed start releases the guard and restores a retryable lobby", async () => {
  const { ctx, match } = createReadyLobby();
  const emit: EmitMatchEvent = () => undefined;

  await assert.rejects(
    markReady(ctx, "socket-guest", emit, async () => {
      throw new Error("PLAYLIST_LOAD_FAILED");
    }),
    /PLAYLIST_LOAD_FAILED/,
  );

  assert.equal(match.phase, "lobby");
  assert.equal(match.players.every((player) => !player.ready), true);
  assert.equal(ctx.startingMatchIds.size, 0);

  match.players[0].ready = true;
  const retried = await markReady(ctx, "socket-guest", emit, async (current) => {
    current.playlist = playableSongs();
  });

  assert.equal(retried.countdownStarted, true);
  assert.equal(match.phase, "in-game");
  assert.equal(ctx.startingMatchIds.size, 0);
});
