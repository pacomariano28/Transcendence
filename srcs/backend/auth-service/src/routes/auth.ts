import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import * as oauthController from "../controllers/oauth.controller.js";

export const authRouter = Router();

authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.get("/me", authController.me);

authRouter.get("/spotify/login", oauthController.spotifyLogin);
authRouter.get("/spotify/callback", oauthController.spotifyCallback);
