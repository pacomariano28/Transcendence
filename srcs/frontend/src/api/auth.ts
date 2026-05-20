import { apiFetch } from "./http";

export type SpotifyArtist = {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  imageUrl: string | null;
};

export type SpotifyTrack = {
  id: string;
  name: string;
  artists: Array<{
    id: string;
    name: string;
  }>;
  popularity: number;
  imageUrl: string | null;
};

export type SpotifyGenre = {
  name: string;
  weight: number;
};

export type SpotifyProfile = {
  spotifyUserId: string;
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
  topArtists: SpotifyArtist[];
  topGenres: SpotifyGenre[];
  topTrackMonth: SpotifyTrack[];
  topTrackAllTime: SpotifyTrack[];
  syncedAt: string | null;
};

export type AuthedUser = {
  id: string;
  email: string;
  username: string;
  spotifyProfile?: SpotifyProfile | null;
};

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

export async function login(email: string, password: string): Promise<void> {
  const r = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || "LOGIN_FAILED");
}

export async function register(
  email: string,
  username: string,
  password: string,
): Promise<void> {
  const r = await apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, username, password }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || "REGISTER_FAILED");
}

export async function logout(): Promise<void> {
  const r = await apiFetch("/api/auth/logout", { method: "POST" });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || "LOGOUT_FAILED");
}
