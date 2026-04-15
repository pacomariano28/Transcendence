import type { Request, Response } from "express";
import { signAccessToken } from "../lib/jwt.js";
import { issueRefreshToken, consumeRefreshToken } from "../lib/refreshTokens.js";
import { registerBodySchema, loginBodySchema, refreshBodySchema } from "../schemas/auth.schemas.js";

import { prisma } from "../lib/prisma.js";
import { hashPassword, verifyPassword } from "../lib/password.js";

/**
 *
 * @brief Registers a new user with the provided email, username, and password.
 * @param req Raw HTTP request whose body should have { email, username, password }
 * @param res HTTP response where we will send the result of the registration attempt.
 * @returns JSON response indicating the result of the registration attempt. On success: { ok: true, message: string, user: { id: string, email: string, username: string } }. On validation failure: { ok: false, error: string, issues?: ZodIssue[] }.
 *
 * @example
 * // Request body
 * {
 *   "email": "user@example.com",
 *   "username": "user",
 *   "password": "password123"
 * }
 */
export async function register(req: Request, res: Response) {
  const parsed = registerBodySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "VALIDATION_ERROR: Invalid request body for register",
      issues: parsed.error.issues,
    });
  }

  const { email, username, password } = parsed.data;

  try {
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash: await hashPassword(password),
      },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    return res.status(201).json({
      ok: true,
      message: "User registered",
      user,
    });
  } catch (err) {
    return res.status(409).json({
      ok: false,
      error: "USER_ALREADY_EXISTS",
    });
  }
}

/**
 * 
 * @brief Authenticates a user with the provided email and password. On success, returns an access token and a refresh token.
 * @param req Raw HTTP request whose body should have { email, password }
 * @param res HTTP response where we will send the result of the login attempt.
 * @returns JSON response indicating the result of the login attempt. On success: { ok: true, message: string, token: string, refreshToken: string }. On validation failure: { ok: false, error: string, issues?: ZodIssue[] }.
 * 
 * @example
 * // Request body
 * {
 *   "email": "user@example.com",
 *   "password": "password123"
 * }

 */
export async function login(req: Request, res: Response) {
  const parsed = loginBodySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "VALIDATION_ERROR: Invalid request body for login",
      issues: parsed.error.issues,
    });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      username: true,
      passwordHash: true,
    },
  });

  if (!user) {
    return res.status(401).json({
      ok: false,
      error: "INVALID_CREDENTIALS",
    });
  }

  const ok = await verifyPassword(password, user.passwordHash);

  if (!ok) {
    return res.status(401).json({
      ok: false,
      error: "INVALID_CREDENTIALS",
    });
  }

  const token = signAccessToken({ sub: user.id, email: user.email, username: user.username });

  const issued = await issueRefreshToken(user.id);

  res.status(200).json({
    ok: true,
    message: "Login successful",
    token,
    refreshToken: issued.refreshToken,
  });
}

/**
 * @brief Deletes the existing refreshToken. Then creates a new refreshToken
 * and a new token.
 *
 * @param request Raw HTTP request whose body should have a valid refreshToken
 * @return JSON response indicating the result of the refresh attempt. On success: { ok: true, token: string, refreshToken: string }. On failure: { ok: false, error: string }.
 * 
 * @example
 * // Request body
 * {
 *   "refreshToken": "your-refresh-token-here"
 * }

 */
export async function refresh(req: Request, res: Response) {
  const parsed = refreshBodySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "VALIDATION_ERROR: Invalid request body for refresh token",
      issues: parsed.error.issues,
    });
  }

  const { refreshToken } = parsed.data;

  try {
    const { userId } = await consumeRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        ok: false,
        error: "INVALID_REFRESH_TOKEN",
      });
    }

    const token = signAccessToken({
      sub: userId,
      email: user.email,
      username: user.username,
    });

    // 2) Nuevo refresh token (rotación)
    const issued = await issueRefreshToken(userId);

    return res.status(200).json({
      ok: true,
      token,
      refreshToken: issued.refreshToken,
    });
  } catch (err) {
    const code = err instanceof Error ? err.message : "";

    if (code === "EXPIRED_REFRESH_TOKEN") {
      return res.status(401).json({
        ok: false,
        error: "Refresh token expired",
      });
    }

    return res.status(401).json({
      ok: false,
      error: "Invalid refresh token",
    });
  }
}

/**
 * @brief Protected endpoint that returns the current authenticated user's information. Requires a valid access token in the Authorization header.
 *
 * @param _req
 * @param res
 * @returns JSON response with the authenticated user's information. On success: { ok: true, user: { id: string, email: string, username: string } }. On failure (e.g. missing/invalid token): 401 Unauthorized with { ok: false, error: string }.
 */
export function me(_req: Request, res: Response) {
  res.status(200).json({
    ok: true,
    user: res.locals.user,
  });
}

/**
 * Testing
 
 * Register a new user:
 
    curl -i -sS -X POST "http://localhost:4002/auth/register" \
    -H 'Content-Type: application/json' \
    -d '{"email":"user1@gmail.com","username":"user1","password":"password123"}'
 
* Get all the Users in DB:

    docker exec -it songuess-postgres psql -U postgres_user -d postgres_db -c \
    'SELECT id, email, username, "createdAt" FROM auth."User" ORDER BY "createdAt" DESC LIMIT 20;'


 * Get all refresh tokens in DB:
    docker exec -it songuess-postgres psql -U postgres_user -d postgres_db -c 'SELECT id, "userId", "expiresAt", "revokedAt", "createdAt" FROM auth."RefreshToken" ORDER BY "createdAt" DESC;'
 */
