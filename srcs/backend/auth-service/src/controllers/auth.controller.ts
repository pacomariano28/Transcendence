import type { Request, Response } from "express";
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

  try {
    const user = await registerUser(parsed.data);

    return res.status(201).json({
      ok: true,
      message: "User registered",
      user,
    });
  } catch (err: unknown) {
    const code = err instanceof Error ? err.message : "";

    if (code === "USER_ALREADY_EXISTS") {
      return res.status(409).json({ ok: false, error: "USER_ALREADY_EXISTS" });
    }

    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
}

/**
 * Authenticates a user with the provided email and password.
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

    if (code === "Wrong credentials") {
      return res.status(401).json({ ok: false, error: "Wrong credentials" });
    }

    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
}

/**
 * Rotates the refresh token.
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

  try {
    const { token, refreshToken } = await refreshSession(
      parsed.data.refreshToken,
    );

    return res.status(200).json({
      ok: true,
      token,
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
  }
}

/**
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
        },
      },
    },
  });

  if (!user) {
    return res.status(404).json({ ok: false, error: "USER_NOT_FOUND" });
  }

  return res.json({ ok: true, user });
}
