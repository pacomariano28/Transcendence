import type { Request, Response } from "express";
import { signAccessToken } from "../lib/jwt.js";
import { issueRefreshToken, consumeRefreshToken } from "../lib/refreshTokens.js";
import { registerBodySchema, loginBodySchema, refreshBodySchema } from "../schemas/auth.schemas.js";


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
export function register(req: Request, res: Response) {
    const parsed = registerBodySchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            ok: false,
            error: "VALIDATION_ERROR: Invalid request body for register",
            issues: parsed.error.issues,
        });
    }

    const { email, username, password } = parsed.data;

    // MOD: not using password yet because we use stub atm
    res.status(201).json({
        ok: true,
        message: "User registered (stub)",
        user: {
            id: "stub-user-id",
            email,
            username,
        },
    });
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
export function login(req: Request, res: Response) {
    const parsed = loginBodySchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            ok: false,
            error: "VALIDATION_ERROR: Invalid request body for login",
            issues: parsed.error.issues,
        });
    }

    // :MOD
    const { email, password } = parsed.data;

    const token = signAccessToken({
        sub: "stub-user-id",
        email,
        username: "stub",
    });

    const issued = issueRefreshToken("stub-user-id");

    res.status(200).json({
        ok: true,
        message: "Login successful (stub)",
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
export function refresh(req: Request, res: Response) {
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
        const { userId } = consumeRefreshToken(refreshToken);

        // 1) Nuevo access token
        // STUB: sin DB no podemos reconstruir email/username reales todavía
        const token = signAccessToken({
            sub: userId,
            email: "stub@local",
            username: "stub",
        });

        // 2) Nuevo refresh token (rotación)
        const issued = issueRefreshToken(userId);

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