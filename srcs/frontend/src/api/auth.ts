import { apiJson } from "./http";

export type AuthedUser = { id: string; email: string; username?: string };

export async function getMe(): Promise<AuthedUser> {
  const data = await apiJson<{ user: AuthedUser }>("/api/auth/me");
  return data.user;
}

export async function refreshCookie(): Promise<void> {
  await apiJson("/api/auth/refresh-cookie", { method: "POST" });
}

export async function login(email: string, password: string): Promise<void> {
  await apiJson("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(
  email: string,
  username: string,
  password: string,
): Promise<void> {
  await apiJson("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, username, password }),
  });
}

export async function logout(): Promise<void> {
  await apiJson("/api/auth/logout", { method: "POST" });
}
