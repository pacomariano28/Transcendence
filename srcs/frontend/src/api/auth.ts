import { apiJson } from "./http";

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
