import type { Request, Response } from "express";
<<<<<<< HEAD
import { prisma } from "../lib/prisma.js";
import {
  registerBodySchema,
  loginBodySchema,
  refreshBodySchema,
} from "../schemas/auth.schemas.js";
import {
  clearAuthCookies,
  setAuthCookies,
} from "../services/sessionCookies.service.js";
import {
  registerUser,
  loginUser,
  refreshSession,
  getAuthedUserFromHeaders,
} from "../services/auth.service.js";
import { revokeRefreshToken } from "../lib/refreshTokens.js";

/**
 * Registers a new user with the provided email, username, and password.
=======
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
>>>>>>> main
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

<<<<<<< HEAD
  try {
    const user = await registerUser(parsed.data);
=======
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
>>>>>>> main

    return res.status(201).json({
      ok: true,
      message: "User registered",
      user,
    });
<<<<<<< HEAD
  } catch (err: unknown) {
    const code = err instanceof Error ? err.message : "";

    if (code === "USER_ALREADY_EXISTS") {
      return res.status(409).json({ ok: false, error: "USER_ALREADY_EXISTS" });
    }

    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
=======
  } catch (err) {
    return res.status(409).json({
      ok: false,
      error: "USER_ALREADY_EXISTS",
      message: err,
    });
>>>>>>> main
  }
}

/**
<<<<<<< HEAD
 * Authenticates a user with the provided email and password.
=======
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

>>>>>>> main
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

<<<<<<< HEAD
  try {
    const { token, refreshToken } = await loginUser(parsed.data);

    setAuthCookies(res, { accessToken: token, refreshToken });

    return res.status(200).json({
      ok: true,
      message: "Login successful",
      token,
      refreshToken,
    });
  } catch (err: unknown) {
    const code = err instanceof Error ? err.message : "";

    if (code === "WRONG_CREDENTIALS") {
      return res.status(401).json({ ok: false, error: "WRONG_CREDENTIALS" });
    }

    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
}

/**
 * Rotates the refresh token.
=======
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

>>>>>>> main
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

<<<<<<< HEAD
  try {
    const { token, refreshToken } = await refreshSession(
      parsed.data.refreshToken,
    );
=======
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
>>>>>>> main

    return res.status(200).json({
      ok: true,
      token,
<<<<<<< HEAD
      refreshToken,
    });
  } catch (err: unknown) {
    const code = err instanceof Error ? err.message : "";

    if (code === "EXPIRED_REFRESH_TOKEN") {
      return res
        .status(401)
        .json({ ok: false, error: "Refresh token expired" });
    }

    if (code === "INVALID_REFRESH_TOKEN") {
      return res
        .status(401)
        .json({ ok: false, error: "Invalid refresh token" });
    }

    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
=======
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
>>>>>>> main
  }
}

/**
<<<<<<< HEAD
 * Rotates the session using the refresh_token cookie.
 */
export async function refreshCookie(req: Request, res: Response) {
  const refreshToken = req.cookies?.refresh_token;

  if (!refreshToken) {
    return res.status(401).json({ ok: false, error: "MISSING_REFRESH_TOKEN" });
  }

  try {
    const { token, refreshToken: newRefreshToken } =
      await refreshSession(refreshToken);

    setAuthCookies(res, { accessToken: token, refreshToken: newRefreshToken });

    return res.status(200).json({ ok: true });
  } catch (err: unknown) {
    const code = err instanceof Error ? err.message : "";

    if (code === "EXPIRED_REFRESH_TOKEN") {
      return res
        .status(401)
        .json({ ok: false, error: "REFRESH_TOKEN_EXPIRED" });
    }

    if (code === "INVALID_REFRESH_TOKEN") {
      return res
        .status(401)
        .json({ ok: false, error: "INVALID_REFRESH_TOKEN" });
    }

    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
}

/**
 * Logs out the current session.
 */
export async function logout(req: Request, res: Response) {
  const bodyRefreshToken =
    typeof req.body?.refreshToken === "string" ? req.body.refreshToken : null;
  const refreshToken = req.cookies?.refresh_token ?? bodyRefreshToken;

  if (!refreshToken) {
    return res.status(400).json({ ok: false, error: "MISSING_REFRESH_TOKEN" });
  }

  await revokeRefreshToken(refreshToken);
  clearAuthCookies(res);

  return res.status(200).json({ ok: true, message: "Logged out successfully" });
}

/**
 * Returns the current authenticated user's information.
 */
export async function me(req: Request, res: Response) {
  const authUser = getAuthedUserFromHeaders(req);

  if (!authUser) {
    return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
  }

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      id: true,
      email: true,
      username: true,
      spotifyProfile: {
        select: {
          spotifyUserId: true,
          displayName: true,
          email: true,
          avatarUrl: true,
          topArtists: true,
          topGenres: true,
          topTrackMonth: true,
          topTrackAllTime: true,
          syncedAt: true,
          refreshTokenEnc: true,
        },
      },
    },
  });

  if (!user) {
    return res.status(404).json({ ok: false, error: "USER_NOT_FOUND" });
  }

  const { spotifyProfile, ...rest } = user;
  const hasSpotifyTokens = Boolean(spotifyProfile?.refreshTokenEnc);
  const safeProfile = spotifyProfile
    ? {
        spotifyUserId: spotifyProfile.spotifyUserId,
        displayName: spotifyProfile.displayName,
        email: spotifyProfile.email,
        avatarUrl: spotifyProfile.avatarUrl,
        topArtists: spotifyProfile.topArtists,
        topGenres: spotifyProfile.topGenres,
        topTrackMonth: spotifyProfile.topTrackMonth,
        topTrackAllTime: spotifyProfile.topTrackAllTime,
        syncedAt: spotifyProfile.syncedAt,
        hasSpotifyTokens,
      }
    : null;

  return res.json({ ok: true, user: { ...rest, spotifyProfile: safeProfile } });
}
=======
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
>>>>>>> main
