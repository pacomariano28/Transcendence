import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import * as oauthController from "../controllers/oauth.controller.js";

export const authRouter = Router();

// Credentials auth
authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/refresh-cookie", authController.refreshCookie);
authRouter.post("/logout", authController.logout);
authRouter.get("/me", authController.me);

// Spotify Oauth
authRouter.get("/spotify/login", oauthController.spotifyLogin);
authRouter.get("/spotify/callback", oauthController.spotifyCallback);
