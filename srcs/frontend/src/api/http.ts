const AUTH_PATHS_WITHOUT_401_RETRY = new Set([
  "/api/auth/me",
  "/api/auth/refresh-cookie",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
]);

// Must match access_token cookie maxAge in sessionCookies.service.ts (15 minutes).
const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
const SESSION_EXPIRES_AT_KEY = "sessionExpiresAt";
const REFRESH_LOCK_KEY = "authRefreshLock";
const REFRESH_LOCK_MAX_MS = 10_000;
// Refresh before the cookie actually expires to avoid edge-case 401s.
const REFRESH_BUFFER_MS = 90 * 1000;

let refreshInFlight: Promise<void> | null = null;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function tryAcquireRefreshLock(): boolean {
  const now = Date.now();
  const lock = localStorage.getItem(REFRESH_LOCK_KEY);
  if (lock && now - Number(lock) < REFRESH_LOCK_MAX_MS) {
    return false;
  }
  localStorage.setItem(REFRESH_LOCK_KEY, String(now));
  return true;
}

function releaseRefreshLock() {
  localStorage.removeItem(REFRESH_LOCK_KEY);
}

async function waitForOtherTabRefresh(maxWaitMs = REFRESH_LOCK_MAX_MS) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < maxWaitMs) {
    if (!localStorage.getItem(REFRESH_LOCK_KEY)) {
      return;
    }
    await sleep(50);
  }
}

export function markSessionValidated() {
  localStorage.setItem(
    SESSION_EXPIRES_AT_KEY,
    String(Date.now() + ACCESS_TOKEN_MAX_AGE_MS),
  );
}

export function resetSessionValidation() {
  localStorage.removeItem(SESSION_EXPIRES_AT_KEY);
  localStorage.removeItem(REFRESH_LOCK_KEY);
}

async function ensureSessionFresh() {
  if (localStorage.getItem("isLoggedIn") !== "true") return;

  const expiresAt = Number(localStorage.getItem(SESSION_EXPIRES_AT_KEY) || 0);
  if (expiresAt > Date.now() + REFRESH_BUFFER_MS) {
    return;
  }

  await refreshSessionCookie();
}

export async function refreshSessionCookie(): Promise<void> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      if (!tryAcquireRefreshLock()) {
        await waitForOtherTabRefresh();
        return;
      }

      try {
        const res = await apiFetch("/api/auth/refresh-cookie", {
          method: "POST",
        });
        const data = await readResponseBody(res);

        if (!res.ok) {
          const message =
            typeof data === "string"
              ? data
              : data && typeof data === "object" && "error" in data
                ? String((data as { error?: unknown }).error)
                : `HTTP_${res.status}`;
          throw new Error(message);
        }

        markSessionValidated();
      } finally {
        releaseRefreshLock();
      }
    })().finally(() => {
      refreshInFlight = null;
    });
  }

  return refreshInFlight;
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    credentials: "include",
  });

  return res;
}

type ApiError = Error & {
  status?: number;
  data?: unknown;
};

async function readResponseBody(res: Response) {
  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return res.json().catch(() => null);
  }

  return res.text().catch(() => null);
}

export async function apiJson<T>(
  path: string,
  init: RequestInit = {},
  retried = false,
): Promise<T> {
  if (!retried && !AUTH_PATHS_WITHOUT_401_RETRY.has(path)) {
    await ensureSessionFresh();
  }

  const res = await apiFetch(path, init);
  const data = await readResponseBody(res);

  if (!res.ok) {
    if (
      res.status === 401 &&
      !retried &&
      !AUTH_PATHS_WITHOUT_401_RETRY.has(path)
    ) {
      resetSessionValidation();
      await refreshSessionCookie();
      return apiJson<T>(path, init, true);
    }

    const message =
      typeof data === "string"
        ? data
        : data && typeof data === "object" && "error" in data
          ? String((data as { error?: unknown }).error)
          : `HTTP_${res.status}`;
    const err = new Error(message) as ApiError;
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

export async function apiJsonPost<T>(
  path: string,
  payload: unknown,
  init: RequestInit = {},
): Promise<T> {
  if (localStorage.getItem("isLoggedIn") === "true") {
    await ensureSessionFresh();
  }

  const res = await fetch(path, {
    ...init,
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    credentials: "include",
  });

  const data = await readResponseBody(res);

  if (!res.ok)
    throw new Error(
      data &&
        typeof data === "object" &&
        "message" in data &&
        (data as { message?: unknown }).message === "MATCH_NOT_FOUND"
        ? "MATCH_NOT_FOUND"
        : data &&
            typeof data === "object" &&
            "error" in data &&
            typeof (data as { error?: unknown }).error === "string"
          ? String((data as { error: string }).error)
          : `HTTP_${res.status}`,
    );

  return data as T;
}
