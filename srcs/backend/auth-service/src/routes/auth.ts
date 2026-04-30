import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import * as authController from "../controllers/auth.controller.js";

export const authRouter = Router();

authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.get("/me", requireAuth, authController.me);

/**
 * TESTING
 * 
 * curl -s -X POST http://localhost:4002/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"a@b.com","password":"123"}' | cat

 */
