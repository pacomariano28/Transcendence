import { Router } from "express";

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

authRouter.post("/register", (req, res) => {
    const { email, username, password } = req.body ?? {};

    if (!email || !username || !password) {
        res.status(400).json({
            ok: false,
            error: "Missing required fields",
            required: ["email", "username", "password"]
        });

        return;
    }

    res.status(200).json({
        ok: true,
        message: "User registered (stub)",
        user: {
            id: "stub-user-id",
            email,
            username
        }
    });
});


authRouter.post("/login", (req, res) => {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
        res.status(400).json({
            ok: false,
            message: "Missing required fields",
            required: ["email", "password"]
        });

        return;
    }

    res.status(200).json({
        ok: true,
        message: "Login successful (stub)",
        token: "stub.jwt.token"
    });
});