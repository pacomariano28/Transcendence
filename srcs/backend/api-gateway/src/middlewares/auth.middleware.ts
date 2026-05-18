import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

type JwtPayload = {
  sub: string;
  email: string;
  username?: string;
};

/**
 *
 * @brief Authenticates the request using an access token (Bearer header or cookie) and injects user identity headers for downstream services.
 * @param req Raw HTTP request. Accepts either `Authorization: Bearer <token>` or the `access_token` cookie.
 * @param res HTTP response where we will send a 401 if the request is not authenticated.
 * @param next Express callback used to continue the middleware chain when authentication succeeds.
 * @returns No direct return value. On failure sends a JSON error response. On success calls `next()` and sets `x-user-id`, `x-user-email`, and optionally `x-user-username` headers.
 *
 * @example
 * // Using Authorization header
 * fetch("/api/auth/me", {
 *   headers: { Authorization: "Bearer <access_token>" }
 * });
 *
 * @example
 * // Using cookie-based auth
 * fetch("/api/auth/me", { credentials: "include" });
 */
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  let token: string | undefined;

  // Prefer the Authorization header, but fall back to a cookie for browser-based sessions.
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice("Bearer ".length).trim();
  } else {
    token = req.cookies?.access_token; // Use req.cookies.access_token if you have proper typings.
  }

  if (!token) {
    res.status(401).json({ ok: false, error: "Missing token" });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || "jwt_secret";
    const decoded = jwt.verify(token, secret) as JwtPayload;

    // Internal identity headers forwarded to downstream services.
    req.headers["x-user-id"] = decoded.sub;
    req.headers["x-user-email"] = decoded.email;
    if (decoded.username) req.headers["x-user-username"] = decoded.username;

    req.headers["x-authenticated-by"] = "api-gateway";

    next();
  } catch {
    res.status(401).json({ ok: false, error: "Invalid or expired token" });
  }
};
