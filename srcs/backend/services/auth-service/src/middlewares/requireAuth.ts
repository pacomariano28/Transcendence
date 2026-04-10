import type { RequestHandler, Request, Response, NextFunction } from "express";
import { AccessTokenPayload, verifyAccessToken } from "../lib/jwt.js";
import { logError } from "../lib/logger.js";

type AuthedUser = {
    id: string;
    email: string;
    username: string;
};

export const requireAuth: RequestHandler = (req: Request, res: Response, next: NextFunction) => {

    // We look if the header has "authorization"
    const authHeader: string = req.header("authorization") ?? "";

    // Set the prefix as bearer, JWT tokens must have it
    const prefix: string = "bearer";

    // Check if the header has the prefix
    if (!authHeader.toLowerCase().startsWith(prefix)) {
        res.status(401).json({
            ok: false,
            error: "Missing or invalid Authorization header"
        });

        return;
    }

    // If we have the header, look for the token
    const token: string = authHeader.slice(prefix.length).trim();

    // If there is no token, error and return
    if (!token) {
        res.status(401).json({
            ok: false,
            error: "Missing token"
        });

        return;
    }

    // Now that we have the token, we check if its correct
    try {

        // Check if the token follows our defined structure ( fields, decoding )
        const payload: AccessTokenPayload = verifyAccessToken(token);


        // Save the data from the payload
        const user: AuthedUser = {
            id: payload.sub,
            email: payload.email,
            username: payload.username
        };


        // Save the user in res.locals.
        // Locals is a shared object between middlewares and handlers that are in the same request
        res.locals.user = user;

        // Request succesfully, next middleware call
        next();

    } catch (error: any) {
        logError({
            method: req.method,
            path: req.originalUrl,
            statusCode: 401,
            errorName: error.name || "Error",
            errorMessage: error.message || "Invalid or expired token",
            stack: error.stack,
        });

        res.status(401).json({
            ok: false,
            error: "Invalid or expired token"
        });

    }
}
