import assert from "node:assert/strict";
import test from "node:test";
import {
  validateAudioTogglePayload,
  validateJoinMatchPayload,
  validateRoundGuessPayload,
  validateRoundLockPayload,
  validateRoundPreviewEndedPayload,
  validateSharePlaylistsPayload,
} from "../../controllers/socket.validation.js";

test("lock payload requires matchId; time is optional and validated when present", () => {
  assert.deepEqual(validateRoundLockPayload({ matchId: "ROOM01" }), {
    matchId: "ROOM01",
  });

  assert.deepEqual(
    validateRoundLockPayload({ matchId: "ROOM01", time: 12.5 }),
    { matchId: "ROOM01", time: 12.5 },
  );

  const invalidTimes = [-99_999.5, Number.NaN, Number.POSITIVE_INFINITY, 31];
  for (const time of invalidTimes) {
    assert.throws(
      () => validateRoundLockPayload({ matchId: "ROOM01", time }),
      /INVALID_PAYLOAD/,
    );
  }
});

test("malformed match, guess, preview, audio, and playlist payloads fail", () => {
  assert.throws(() => validateJoinMatchPayload({ matchId: "../../" }));
  assert.throws(() =>
    validateRoundGuessPayload({
      matchId: "ROOM01",
      isrc: "",
      track: "Track",
      artist: "Artist",
    }),
  );
  assert.throws(() =>
    validateRoundPreviewEndedPayload({ matchId: "ROOM01", roundIndex: 1.5 }),
  );
  assert.throws(() =>
    validateAudioTogglePayload({
      matchId: "ROOM01",
      action: "rewind",
      time: 3,
    }),
  );
  assert.throws(() => validateSharePlaylistsPayload({ playlists: "all" }));
});

test("valid representative payloads are normalized", () => {
  assert.deepEqual(
    validateJoinMatchPayload({ matchId: " ROOM01 ", displayName: " Rachid " }),
    { matchId: "ROOM01", displayName: "Rachid" },
  );
  assert.deepEqual(validateSharePlaylistsPayload({ playlists: [] }), {
    playlists: [],
  });
});
