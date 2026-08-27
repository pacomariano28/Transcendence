const OAUTH_STATE_TTL_MS = 5 * 60 * 1000;

type OAuthPendingState = {
  expiresAt: number;
  returnTo?: string;
};

const pendingStates = new Map<string, OAuthPendingState>();

function purgeExpiredStates(now = Date.now()): void {
  for (const [state, entry] of pendingStates) {
    if (now > entry.expiresAt) {
      pendingStates.delete(state);
    }
  }
}

export type OAuthStateConsumption = {
  valid: boolean;
  returnTo?: string;
};

export function storeOAuthState(
  state: string,
  options?: { ttlMs?: number; returnTo?: string },
): void {
  purgeExpiredStates();
  pendingStates.set(state, {
    expiresAt: Date.now() + (options?.ttlMs ?? OAUTH_STATE_TTL_MS),
    returnTo: options?.returnTo,
  });
}

export function consumeOAuthState(state: string): OAuthStateConsumption {
  purgeExpiredStates();
  const entry = pendingStates.get(state);
  if (entry === undefined) {
    return { valid: false };
  }

  pendingStates.delete(state);

  if (Date.now() > entry.expiresAt) {
    return { valid: false };
  }

  return {
    valid: true,
    returnTo: entry.returnTo,
  };
}

export function getSafeOAuthReturnTo(
  raw: string | null | undefined,
): string | undefined {
  if (!raw) return undefined;

  try {
    const decoded = decodeURIComponent(raw);
    if (decoded.startsWith("/") && !decoded.startsWith("//")) {
      return decoded;
    }
  } catch {
    // ignore malformed returnTo values
  }

  return undefined;
}
