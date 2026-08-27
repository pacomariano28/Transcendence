import assert from "node:assert/strict";
import test from "node:test";
import { createMatchState } from "../state.js";
import { removeSocket, type MatchConnectionContext } from "./match.connection.js";
import { joinMatch } from "./match.lifecycle.js";

function createConnectedMatch(): {
  ctx: MatchConnectionContext;
  match: MatchState;
} {
  const match = createMatchState("ROOM01", {
    socketId: "socket-old",
    userId: "user-host",
    displayName: "Old name",
  });

  return {
    match,
    ctx: {
      matches: new Map([[match.matchId, match]]),
      userToMatch: new Map([["user-host", match.matchId]]),
      socketToMatch: new Map([["socket-old", match.matchId]]),
      syncTimers: new Map(),
    },
  };
}

test("a reconnect replaces a socket before the stale disconnect arrives", () => {
  const { ctx, match } = createConnectedMatch();

  const joined = joinMatch(ctx, {
    matchId: match.matchId,
    socketId: "socket-new",
    userId: "user-host",
    displayName: "Current name",
  });

  assert.equal(joined, match);
  assert.equal(match.players.length, 1);
  assert.equal(match.players[0].socketId, "socket-new");
  assert.equal(match.players[0].displayName, "Current name");
  assert.equal(match.players[0].connected, true);
  assert.equal(ctx.socketToMatch.has("socket-old"), false);
  assert.equal(ctx.socketToMatch.get("socket-new"), match.matchId);

  assert.equal(removeSocket(ctx, "socket-old"), undefined);
  assert.equal(match.players[0].socketId, "socket-new");
  assert.equal(match.players[0].connected, true);
});
