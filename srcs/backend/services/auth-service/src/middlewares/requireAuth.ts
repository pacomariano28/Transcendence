import type { RequestHandler, Request, Response, NextFunction } from "express";
import { AccessTokenPayload, verifyAccessToken } from "../lib/jwt.js";

type AuthedUser = {
  id: string;
  email: string;
  username: string;
};

export const requireAuth: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // We look if the header has "authorization"
  const authHeader: string = req.header("authorization") ?? "";

  // Set the prefix as bearer + space, JWT tokens must follow this exact format
  const prefix: string = "bearer ";

  // Check if the header has the expected "Bearer <token>" format
  if (!authHeader.toLowerCase().startsWith(prefix)) {
    res.status(401).json({
      ok: false,
      error: "Missing or invalid Authorization header",
    });

    return;
  }

  // If we have the header, look for the token
  const token: string = authHeader.slice(prefix.length).trim();

  // If there is no token, error and return
  if (!token) {
    return res.status(401).json({
      ok: false,
      error: "Missing token",
    });
  }

  // Now that we have the token, we check if its correct
  try {
    // Check if the token follows our defined structure ( fields, decoding )
    const payload: AccessTokenPayload = verifyAccessToken(token);

    // Save the data from the payload
    const user: AuthedUser = {
      id: payload.sub,
      email: payload.email,
      username: payload.username,
    };

    // Save the user in res.locals.
    // Locals is a shared object between middlewares and handlers that are in the same request
    res.locals.user = user;

    // Request succesfully, next middleware call
    return next();
  } catch (err) {
    const name = err instanceof Error ? err.name : "";

    if (name === "TokenExpiredError") {
      return res.status(401).json({
        ok: false,
        error: "Token expired",
      });
    }

    return res.status(401).json({
      ok: false,
      error: "Invalid token",
    });
  }

};
