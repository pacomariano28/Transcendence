import { Router, Request, Response } from "express";
import { signAccessToken } from "../lib/jwt.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import {
  issueRefreshToken,
  consumeRefreshToken,
} from "../lib/refreshTokens.js";
import { refreshBodySchema, registerBodySchema, loginBodySchema } from "../schemas/auth.schemas.js";


export const authRouter = Router();

authRouter.post("/register", (req: Request, res: Response) => {
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
});

authRouter.post("/login", (req: Request, res: Response) => {
  const parsed = loginBodySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "VALIDATION_ERROR: Invalid request body for login",
      issues: parsed.error.issues,
    })
  }

  // :MOD
  const { email, password} = parsed.data;

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
});

/**
 * @brief Deletes the existing refreshToken. Then creates a new refreshToken
 * and a new token.
 *
 * @param request Raw HTTP request whose body should have a valid refreshToken
 * @return on success {ok, token, refreshToken }
 * @return on failure { ok, error, required? }
 */
authRouter.post("/refresh", (req: Request, res: Response) => {
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
});

authRouter.get("/me", requireAuth, (_req: Request, res: Response) => {
  res.status(200).json({
    ok: true,
    user: res.locals.user,
  });
});

/**
 * TESTING
 * 
 * curl -s -X POST http://localhost:4002/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"a@b.com","password":"123"}' | cat

 */
