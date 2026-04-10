import { Router , Request, Response} from "express";
import { signAccessToken, verifyAccessToken } from "../lib/jwt.js"
import { requireAuth } from "../middlewares/requireAuth.js";

export const authRouter = Router();

/*
authRouter.get("/auth", (_req, res) => {
    res.status(200).json({
        status: "ok",
        service: "auth-service",
        endpoint: "auth"
    });
})
*/

authRouter.post("/register", (req: Request, res: Response) => {
    const { email, username, password } = req.body ?? {};

    if (!email || !username || !password) {
        res.status(400).json({
            ok: false,
            error: "Missing required fields",
            required: ["email", "username", "password"]
        });

        return;
    }

    res.status(201).json({
        ok: true,
        message: "User registered (stub)",
        user: {
            id: "stub-user-id",
            email,
            username
        }
    });
});


authRouter.post("/login", (req: Request, res: Response) => {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
        res.status(400).json({
            ok: false,
            message: "Missing required fields",
            required: ["email", "password"]
        });

        return;
    }

    const token = signAccessToken({
        sub: "stub-user-id",
        email,
        username: "stub"
    });

    res.status(200).json({
        ok: true,
        message: "Login successful (stub)",
        token
    });
});

authRouter.get("/me", requireAuth, (_req: Request, res: Response) => {
  res.status(200).json({
    ok: true,
    user: res.locals.user
  });
});


/**
 * TESTING
 * 
 * curl -s -X POST http://localhost:4002/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"a@b.com","password":"123"}' | cat

 */
