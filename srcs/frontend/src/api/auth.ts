import { apiFetch } from "./http";

export type AuthedUser = { id: string; email: string; username?: string };

export async function getMe(): Promise<AuthedUser> {
  const r = await apiFetch("/api/auth/me");
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || "ME_FAILED");
  return data.user;
}

export async function refreshCookie(): Promise<void> {
  const r = await apiFetch("/api/auth/refresh-cookie", { method: "POST" });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || "REFRESH_FAILED");
}
