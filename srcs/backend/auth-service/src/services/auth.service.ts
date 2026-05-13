import type { Request } from "express";
import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { signAccessToken } from "../lib/jwt.js";
import {
  issueRefreshToken,
  consumeRefreshToken,
} from "../lib/refreshTokens.js";

export type RegisterInput = {
  email: string;
  username: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthedUser = {
  id: string;
  email: string;
  username?: string;
};

/**
 *
 * @brief Creates a new user account and stores the password as a secure hash with **prisma**.
 * @param input Registration payload **{ email, username, password }**.
 * @returns The created user record (public fields only). On success: { id: string, email: string, username: string }.
 *
 * @example
 * // Service call
 * await registerUser({ email: "user@example.com", username: "user", password: "password123" });
 */
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
    // Prisma typically throws on unique constraint violations; expose a stable error code to the controller.
    throw new Error("USER_ALREADY_EXISTS");
  }
}

/**
 *
 * @brief Authenticates a user via prisma and issues a short-lived access token plus a rotated refresh token.
 * @param input Login payload **{ email, password }**.
 * @returns Session tokens. On success: { token: string, refreshToken: string }.
 *
 * @example
 * // Service call
 * const { token, refreshToken } = await loginUser({ email: "user@example.com", password: "password123" });
 */
export async function loginUser(
  input: LoginInput,
): Promise<{ token: string; refreshToken: string }> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true, email: true, username: true, passwordHash: true },
  });

  if (!user) throw new Error("Wrong credentials");

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) throw new Error("Wrong credentials");

  const token = signAccessToken({
    sub: user.id,
    email: user.email,
    username: user.username,
  });
  const issued = await issueRefreshToken(user.id);

  return { token, refreshToken: issued.refreshToken };
}

/**
 *
 * @brief Rotates a refresh token by consuming the provided refresh token and issuing a new refresh token and access token pair.
 * @param refreshToken Previously issued refresh token to be consumed (revoked) and rotated.
 * @returns New session tokens. On success: { token: string, refreshToken: string }.
 *
 * @example
 * // Service call
 * const { token, refreshToken } = await refreshSession("<refresh-token>");
 */
export async function refreshSession(
  refreshToken: string,
): Promise<{ token: string; refreshToken: string }> {
  let userId: string;

  try {
    ({ userId } = await consumeRefreshToken(refreshToken));
  } catch (err: unknown) {
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

  const token = signAccessToken({
    sub: userId,
    email: user.email,
    username: user.username,
  });
  const issued = await issueRefreshToken(userId);

  return { token, refreshToken: issued.refreshToken };
}

/**
 *
 * @brief Extracts the authenticated user from x-user-* headers injected by the api-gateway.
 * @param req Raw HTTP request whose headers should include x-user-id and x-user-email (and optionally x-user-username).
 * @returns The authenticated user info { id, email, username? } or null if required headers are missing.
 *
 * @example
 * // Gateway-injected headers:
 * // x-user-id: "uuid"
 * // x-user-email: "user@example.com"
 * // x-user-username: "user"
 */
export function getAuthedUserFromHeaders(req: Request): AuthedUser | null {
  const id = req.header("x-user-id");
  const email = req.header("x-user-email");
  const username = req.header("x-user-username") ?? undefined;

  if (!id || !email) return null;

  return { id, email, username };
}
