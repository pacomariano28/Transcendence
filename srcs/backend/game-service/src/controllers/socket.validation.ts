import { GUESS_TYPING_MAX_LENGTH } from "../utils/constants.js";
import type {
  AudioTogglePayload,
  CreateMatchPayload,
  JoinMatchPayload,
  RoundGuessPayload,
  RoundGuessTypingPayload,
  RoundLockPayload,
  RoundPreviewEndedPayload,
  RoundSkipPayload,
  SelectPlaylistPayload,
  SharePlaylistsPayload,
} from "../types/socket.payloads.js";

const MATCH_CODE_PATTERN = /^[A-Z0-9]{6}$/;
const MAX_DISPLAY_NAME_LENGTH = 64;
const MAX_TRACK_TEXT_LENGTH = 256;
const MAX_PREVIEW_TIME_SECONDS = 30;

function invalidPayload(): never {
  throw new Error("INVALID_PAYLOAD");
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return invalidPayload();
  }
  return value as Record<string, unknown>;
}

function stringValue(
  value: unknown,
  maxLength: number,
  required = true,
): string | undefined {
  if (value === undefined && !required) return undefined;
  if (typeof value !== "string") return invalidPayload();
  const normalized = value.trim();
  if ((required && !normalized) || normalized.length > maxLength) {
    return invalidPayload();
  }
  return normalized;
}

function optionalNullableString(
  value: unknown,
  maxLength: number,
): string | null | undefined {
  if (value === null) return null;
  return stringValue(value, maxLength, false);
}

function matchId(value: unknown): string {
  const code = stringValue(value, 6);
  if (!code || !MATCH_CODE_PATTERN.test(code)) return invalidPayload();
  return code;
}

function finiteNumber(value: unknown, min: number, max: number): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < min ||
    value > max
  ) {
    return invalidPayload();
  }
  return value;
}

export function validateCreateMatchPayload(value: unknown): CreateMatchPayload {
  const input = value === undefined ? {} : record(value);
  return {
    displayName: stringValue(input.displayName, MAX_DISPLAY_NAME_LENGTH, false),
  };
}

export function validateJoinMatchPayload(value: unknown): JoinMatchPayload {
  const input = record(value);
  return {
    matchId: matchId(input.matchId),
    displayName: stringValue(input.displayName, MAX_DISPLAY_NAME_LENGTH, false),
  };
}

export function validateSharePlaylistsPayload(
  value: unknown,
): SharePlaylistsPayload {
  const input = record(value);
  if (!Array.isArray(input.playlists) || input.playlists.length > 50) {
    return invalidPayload();
  }
  return {
    playlists: input.playlists.map((item) => {
      const playlist = record(item);
      const trackCount = playlist.trackCount;
      if (
        trackCount !== undefined &&
        (!Number.isInteger(trackCount) ||
          (trackCount as number) < 0 ||
          (trackCount as number) > 100_000)
      ) {
        return invalidPayload();
      }
      return {
        id: stringValue(playlist.id, 128)!,
        name: stringValue(playlist.name, 256)!,
        imageUrl: optionalNullableString(playlist.imageUrl, 2048),
        trackCount: trackCount as number | undefined,
      };
    }),
  };
}

export function validateSelectPlaylistPayload(
  value: unknown,
): SelectPlaylistPayload {
  const input = record(value);
  const kind = input.kind;
  if (kind !== undefined && kind !== "playlist" && kind !== "album") {
    return invalidPayload();
  }
  return {
    playlistId: stringValue(input.playlistId, 128)!,
    ownerUserId: stringValue(input.ownerUserId, 128)!,
    name: stringValue(input.name, 256, false),
    imageUrl: optionalNullableString(input.imageUrl, 2048),
    ownerDisplayName: stringValue(input.ownerDisplayName, 64, false),
    kind,
  };
}

export function validateAudioTogglePayload(value: unknown): AudioTogglePayload {
  const input = record(value);
  if (input.action !== "play" && input.action !== "pause") {
    return invalidPayload();
  }
  return {
    matchId: matchId(input.matchId),
    action: input.action,
    time: finiteNumber(input.time, 0, MAX_PREVIEW_TIME_SECONDS),
  };
}

export function validateRoundLockPayload(value: unknown): RoundLockPayload {
  const input = record(value);
  return {
    matchId: matchId(input.matchId),
    time: finiteNumber(input.time, 0, MAX_PREVIEW_TIME_SECONDS),
  };
}

export function validateRoundGuessPayload(value: unknown): RoundGuessPayload {
  const input = record(value);
  return {
    matchId: matchId(input.matchId),
    isrc: stringValue(input.isrc, 32)!,
    track: stringValue(input.track, MAX_TRACK_TEXT_LENGTH)!,
    artist: stringValue(input.artist, MAX_TRACK_TEXT_LENGTH)!,
  };
}

export function validateRoundGuessTypingPayload(
  value: unknown,
): RoundGuessTypingPayload {
  const input = record(value);
  return {
    matchId: input.matchId === undefined ? undefined : matchId(input.matchId),
    text: stringValue(input.text, GUESS_TYPING_MAX_LENGTH, false) ?? "",
  };
}

export function validateRoundPreviewEndedPayload(
  value: unknown,
): RoundPreviewEndedPayload {
  const input = record(value);
  const roundIndex = finiteNumber(input.roundIndex, 0, 100);
  if (!Number.isInteger(roundIndex)) return invalidPayload();
  return {
    matchId: matchId(input.matchId),
    roundIndex,
  };
}

export function validateRoundSkipPayload(value: unknown): RoundSkipPayload {
  const input = record(value);
  return { matchId: matchId(input.matchId) };
}
