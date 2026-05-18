import type { Request, Response } from "express";
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
 *
 * @brief Registers a new user with the provided email, username, and password.
 * @param req Raw HTTP request whose body should have { email, username, password }.
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
 *
 * @brief Authenticates a user with the provided email and password. On success, returns an access token and a refresh token.
 * @param req Raw HTTP request whose body should have { email, password }.
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

    if (code === "INVALID_CREDENTIALS") {
      return res.status(401).json({ ok: false, error: "INVALID_CREDENTIALS" });
    }

    return res.status(500).json({ ok: false, error: "INTERNAL_ERROR" });
  }
}

/**
 *
 * @brief Rotates the refresh token. Consumes (revokes) the existing refresh token and issues a new refresh token plus a new access token.
 * @param req Raw HTTP request whose body should have { refreshToken }.
 * @param res HTTP response where we will send the result of the refresh attempt.
 * @returns JSON response indicating the result of the refresh attempt. On success: { ok: true, token: string, refreshToken: string }. On validation failure: { ok: false, error: string, issues?: ZodIssue[] }.
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
 *
 * @brief Rotates the session using the refresh_token cookie (httpOnly). Issues a new access token and a new refresh token and stores them again as cookies.
 * @param req Raw HTTP request whose cookies should include { refresh_token }.
 * @param res HTTP response where we will set the new session cookies.
 * @returns JSON response indicating the refresh result. On success: { ok: true }. On failure: { ok: false, error: string }.
 *
 * @example
 * // Browser call (no body needed)
 * fetch("https://127.0.0.1:8443/api/auth/refresh", { method: "POST", credentials: "include" })
 */
export async function refreshCookie(req: Request, res: Response) {
  const refreshToken = req.cookies?.refresh_token;

  if (!refreshToken) {
    return res.status(401).json({ ok: false, error: "MISSING_REFRESH_TOKEN" });
  }

  try {
    const { token, refreshToken: newRefreshToken } =
      await refreshSession(refreshToken);

    // Persist the rotated tokens as cookies (httpOnly).
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
 *
 * @brief Logs out the current session by revoking the refresh token and clearing auth cookies.
 * @param req Raw HTTP request whose cookies or body may contain a refresh token.
 * @param res HTTP response where we will clear the session cookies.
 * @returns JSON response indicating the logout result.
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
 *
 * @brief Returns the current authenticated user's information. This endpoint is intended to be called behind the API gateway, which injects x-user-* headers after validating the access token.
 * @param req Raw HTTP request whose headers should include x-user-id and x-user-email (and optionally x-user-username).
 * @param res HTTP response where we will send the authenticated user's information.
 * @returns JSON response with the authenticated user's information. On success: { ok: true, user: { id: string, email: string, username?: string } }. On failure: 401 Unauthorized with { ok: false, error: string }.
 *
 * @example
 * // Example request headers (set by api-gateway)
 * // x-user-id: "uuid"
 * // x-user-email: "user@example.com"
 * // x-user-username: "user"
 */
export async function me(req: Request, res: Response) {
  const user = getAuthedUserFromHeaders(req);

  if (!user) {
    return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
  }

  return res.json({ ok: true, user });
}
