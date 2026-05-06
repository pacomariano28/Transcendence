import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { signAccessToken } from "../lib/jwt.js";
import { issueRefreshToken, consumeRefreshToken } from "../lib/refreshTokens.js";
import type { Request } from "express";

export type RegisterInput = { email: string; username: string; password: string };
export type LoginInput = { email: string; password: string };

export type AuthedUser = {
  id: string;
  email: string;
  username?: string;
};

export async function registerUser(input: RegisterInput) {
  try {
    const user = await prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        passwordHash: await hashPassword(input.password),
      },
      select: { id: true, email: true, username: true },
    });

    return user;
  } catch {
    // Prisma throws on unique constraint violations; we map that to a stable error code.
    throw new Error("USER_ALREADY_EXISTS");
  }
}

export async function loginUser(
  input: LoginInput
): Promise<{ token: string; refreshToken: string }> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, email: true, username: true, passwordHash: true },
  });

  if (!user) throw new Error("INVALID_CREDENTIALS");

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) throw new Error("INVALID_CREDENTIALS");

  const token = signAccessToken({ sub: user.id, email: user.email, username: user.username });
  const issued = await issueRefreshToken(user.id);

  return { token, refreshToken: issued.refreshToken };
}

export async function refreshSession(
  refreshToken: string
): Promise<{ token: string; refreshToken: string }> {
  let userId: string;

  try {
    ({ userId } = await consumeRefreshToken(refreshToken));
  } catch (err: any) {
    const code = err instanceof Error ? err.message : "";

    if (code === "EXPIRED_REFRESH_TOKEN") {
      throw new Error("EXPIRED_REFRESH_TOKEN");
    }

    throw new Error("INVALID_REFRESH_TOKEN");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, username: true },
  });

  if (!user) throw new Error("INVALID_REFRESH_TOKEN");

  const token = signAccessToken({ sub: userId, email: user.email, username: user.username });
  const issued = await issueRefreshToken(userId);

  return { token, refreshToken: issued.refreshToken };
}

/**
 * Extracts the authenticated user from x-user-* headers injected by the api-gateway.
 * Returns null if required headers are missing.
 */
export function getAuthedUserFromHeaders(req: Request): AuthedUser | null {
  const id = req.header("x-user-id");
  const email = req.header("x-user-email");
  const username = req.header("x-user-username") ?? undefined;

  if (!id || !email) return null;

  return { id, email, username };
}
