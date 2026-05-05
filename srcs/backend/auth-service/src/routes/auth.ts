import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import * as authController from "../controllers/auth.controller.js";
import * as oauthController from "../controllers/oauth.controller.js";

export const authRouter = Router();

authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.get("/me", requireAuth, authController.me);

authRouter.get("/spotify/login", oauthController.spotifyLogin);
authRouter.get("/spotify/callback", oauthController.spotifyCallback);
/**
 * TESTING
 * 
 * curl -s -X POST http://localhost:4002/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"a@b.com","password":"123"}' | cat

 */
