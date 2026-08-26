const DEFAULT_RETURN_TO = "/profile";

export const AUTH_RETURN_TO_KEY = "authReturnTo";

export function getSafeReturnTo(raw: string | null | undefined): string {
  if (!raw) return DEFAULT_RETURN_TO;

  try {
    const decoded = decodeURIComponent(raw);
    if (decoded.startsWith("/") && !decoded.startsWith("//")) {
      return decoded;
    }
  } catch {
    // ignore malformed returnTo values
  }

  return DEFAULT_RETURN_TO;
}

export function buildLoginPath(returnTo: string): string {
  return `/login?returnTo=${encodeURIComponent(returnTo)}`;
}

export function storeAuthReturnTo(returnTo: string | null | undefined) {
  if (!returnTo) return;
  sessionStorage.setItem(AUTH_RETURN_TO_KEY, returnTo);
}

export function peekAuthReturnTo(): string | null {
  return sessionStorage.getItem(AUTH_RETURN_TO_KEY);
}

export function clearAuthReturnTo() {
  sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
}

export function resolveReturnTo(rawFromUrl: string | null | undefined): string {
  return getSafeReturnTo(rawFromUrl ?? peekAuthReturnTo());
}

export function redirectToLogin(
  returnTo: string,
  navigate: (path: string) => void,
) {
  storeAuthReturnTo(returnTo);
  navigate(buildLoginPath(returnTo));
}

export function consumeAuthReturnTo(): string | null {
  const stored = sessionStorage.getItem(AUTH_RETURN_TO_KEY);
  if (!stored) return null;
  sessionStorage.removeItem(AUTH_RETURN_TO_KEY);
  return stored;
}
