import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res
      .status(401)
      .json({ ok: false, error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const secret = process.env.JWT_SECRET || "jwt_secret";
    const decoded = jwt.verify(token, secret) as any;

    req.headers["x-user-id"] = decoded.sub;
    req.headers["x-user-email"] = decoded.email;

    next();
  } catch (error) {
    res.status(401).json({ ok: false, error: "Invalid or expired token" });
  }
};
