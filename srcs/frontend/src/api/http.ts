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

/* export async function apiJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await apiFetch(path, init);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error((data as any)?.error || `HTTP_${res.status}`);
    (err as any).status = res.status;
    (err as any).data = data;
    throw err;
  }

  return data as T;
}
 */
