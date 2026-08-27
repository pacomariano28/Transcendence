/**
 * Lightweight NTP-style clock sync over Socket.IO.
 *
 * offsetMs approximates (serverNow - clientNow) so callers can derive:
 *   syncedNow() ≈ server wall-clock time
 */
import type { Socket } from "socket.io-client";

const PING_INTERVAL_MS = 4000;
const AUDIO_SYNC_TOLERANCE_MS = 250;

type TimePongPayload = {
  clientSentAt: number;
  serverRecvAt: number;
  serverSentAt: number;
};

let offsetMs = 0;
let rttMs = 0;
let pingTimer: number | null = null;
let activeSocket: Socket | null = null;

function onPong(payload: TimePongPayload) {
  const clientRecvAt = Date.now();
  if (
    typeof payload.clientSentAt !== "number" ||
    typeof payload.serverRecvAt !== "number" ||
    typeof payload.serverSentAt !== "number" ||
    !Number.isFinite(payload.clientSentAt) ||
    !Number.isFinite(payload.serverRecvAt) ||
    !Number.isFinite(payload.serverSentAt)
  ) {
    return;
  }

  const rtt = Math.max(0, clientRecvAt - payload.clientSentAt);
  // Classic NTP offset: halfway through the round-trip.
  const nextOffset =
    (payload.serverRecvAt -
      payload.clientSentAt +
      (payload.serverSentAt - clientRecvAt)) /
    2;

  rttMs = rtt;
  offsetMs = nextOffset;
}

function sendPing() {
  if (!activeSocket?.connected) return;
  activeSocket.emit("time:ping", { clientSentAt: Date.now() });
}

/**
 * One-way reinforcement when a game payload includes serverNow.
 * Only applied when RTT is already known and small, to avoid noisy updates.
 */
export function noteServerNow(serverNow: number | null | undefined) {
  if (
    typeof serverNow !== "number" ||
    !Number.isFinite(serverNow) ||
    rttMs <= 0 ||
    rttMs > 80
  ) {
    return;
  }
  const estimatedOffset = serverNow + rttMs / 2 - Date.now();
  offsetMs = offsetMs * 0.7 + estimatedOffset * 0.3;
}

export function syncedNow(): number {
  return Date.now() + offsetMs;
}

export function getOffsetMs(): number {
  return offsetMs;
}

export function getRttMs(): number {
  return rttMs;
}

export function getAudioSyncToleranceMs(): number {
  return AUDIO_SYNC_TOLERANCE_MS;
}

export function startClockSync(socket: Socket): void {
  if (activeSocket === socket && pingTimer !== null) {
    sendPing();
    return;
  }

  stopClockSync();
  activeSocket = socket;
  socket.on("time:pong", onPong);
  sendPing();
  pingTimer = window.setInterval(sendPing, PING_INTERVAL_MS);
}

export function stopClockSync(): void {
  if (pingTimer !== null) {
    window.clearInterval(pingTimer);
    pingTimer = null;
  }
  if (activeSocket) {
    activeSocket.off("time:pong", onPong);
    activeSocket = null;
  }
}
