const OAUTH_STATE_TTL_MS = 5 * 60 * 1000;

const pendingStates = new Map<string, number>();

function purgeExpiredStates(now = Date.now()): void {
  for (const [state, expiresAt] of pendingStates) {
    if (now > expiresAt) {
      pendingStates.delete(state);
    }
  }
}

export function storeOAuthState(
  state: string,
  ttlMs = OAUTH_STATE_TTL_MS,
): void {
  purgeExpiredStates();
  pendingStates.set(state, Date.now() + ttlMs);
}

export function consumeOAuthState(state: string): boolean {
  purgeExpiredStates();
  const expiresAt = pendingStates.get(state);
  if (expiresAt === undefined) {
    return false;
  }

  pendingStates.delete(state);

  return Date.now() <= expiresAt;
}
