import { socket } from "../api/socket";

export const COOLDOWN_DURATION = 5;
const SECOND_MS = 1000;

type StoredCooldown = {
  endTime: number;
  roundIndex: number;
};

type CooldownGuessResultPayload = {
  matchId: string;
  roundIndex: number;
  correct: boolean;
  reason?: "wrong" | "timeout" | "no_guess" | "skip" | null;
  lockOwnerId: string | null;
};

type CooldownResumePayload = {
  matchId: string;
  roundIndex: number;
};

function normalizeMatchCode(raw: string) {
  return (raw ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

function cooldownStorageKey(matchCode: string) {
  return `cooldown_end_${matchCode}`;
}

function pendingCooldownStorageKey(matchCode: string) {
  return `cooldown_pending_${matchCode}`;
}

function parseStoredCooldown(raw: string): StoredCooldown | null {
  try {
    const parsed = JSON.parse(raw) as Partial<StoredCooldown>;
    if (
      Number.isFinite(parsed.endTime) &&
      Number.isFinite(parsed.roundIndex)
    ) {
      return {
        endTime: parsed.endTime as number,
        roundIndex: parsed.roundIndex as number,
      };
    }
  } catch {
    // legacy plain timestamp
  }

  const endTime = Number(raw);
  if (!Number.isFinite(endTime)) return null;
  return { endTime, roundIndex: -1 };
}

export function readStoredCooldown(matchCode: string): StoredCooldown | null {
  if (!matchCode) return null;
  try {
    const raw = localStorage.getItem(cooldownStorageKey(matchCode));
    if (!raw) return null;
    const stored = parseStoredCooldown(raw);
    if (!stored || stored.endTime <= Date.now()) {
      localStorage.removeItem(cooldownStorageKey(matchCode));
      return null;
    }
    return stored;
  } catch {
    return null;
  }
}

export function readStoredCooldownEnd(matchCode: string): number | null {
  return readStoredCooldown(matchCode)?.endTime ?? null;
}

export function writeStoredCooldownEnd(
  matchCode: string,
  endTime: number,
  roundIndex: number,
) {
  localStorage.setItem(
    cooldownStorageKey(matchCode),
    JSON.stringify({ endTime, roundIndex }),
  );
}

export function clearStoredCooldown(matchCode: string) {
  localStorage.removeItem(cooldownStorageKey(matchCode));
}

export function shouldClearCooldownForRound(
  stored: StoredCooldown,
  roundIndex: number,
): boolean {
  if (stored.roundIndex < 0) return false;
  return stored.roundIndex !== roundIndex;
}

export function writePendingCooldown(matchCode: string, roundIndex: number) {
  localStorage.setItem(
    pendingCooldownStorageKey(matchCode),
    String(roundIndex),
  );
}

export function readPendingCooldown(matchCode: string): number | null {
  if (!matchCode) return null;
  try {
    const raw = localStorage.getItem(pendingCooldownStorageKey(matchCode));
    if (raw === null) return null;
    const roundIndex = Number(raw);
    if (!Number.isFinite(roundIndex)) {
      localStorage.removeItem(pendingCooldownStorageKey(matchCode));
      return null;
    }
    return roundIndex;
  } catch {
    return null;
  }
}

export function clearPendingCooldown(matchCode: string) {
  localStorage.removeItem(pendingCooldownStorageKey(matchCode));
}

export function activateCooldownOnResume(
  matchCode: string,
  roundIndex: number,
): number | null {
  const pendingRound = readPendingCooldown(matchCode);
  if (pendingRound === roundIndex) {
    const endTime = Date.now() + COOLDOWN_DURATION * SECOND_MS;
    writeStoredCooldownEnd(matchCode, endTime, roundIndex);
    clearPendingCooldown(matchCode);
    return endTime;
  }
  return readStoredCooldownEnd(matchCode);
}

export function startCooldownPenalty(
  matchCode: string,
  roundIndex: number,
): number {
  const endTime = Date.now() + COOLDOWN_DURATION * SECOND_MS;
  writeStoredCooldownEnd(matchCode, endTime, roundIndex);
  clearPendingCooldown(matchCode);
  return endTime;
}

export function registerMatchCooldownSocketHandlers(
  getUserId: () => string | null,
) {
  const onGuessResult = (payload: CooldownGuessResultPayload) => {
    if (payload.correct || payload.reason === "no_guess" || payload.reason === "skip") return;
    const userId = getUserId();
    if (userId === null || !payload.lockOwnerId || String(payload.lockOwnerId) !== String(userId)) {
      return;
    }

    const matchCode = normalizeMatchCode(payload.matchId);
    if (!matchCode) return;
    writePendingCooldown(matchCode, payload.roundIndex);
  };

  const onResume = (payload: CooldownResumePayload) => {
    const matchCode = normalizeMatchCode(payload.matchId);
    if (!matchCode) return;
    activateCooldownOnResume(matchCode, payload.roundIndex);
  };

  socket.on("round:guess_result", onGuessResult);
  socket.on("round:resume", onResume);

  return () => {
    socket.off("round:guess_result", onGuessResult);
    socket.off("round:resume", onResume);
  };
}
