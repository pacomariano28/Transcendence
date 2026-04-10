import { Router } from "express";

import { getHealth, getReady } from "../controllers/health.controller.js";

import { healthLimiter } from "../middlewares/rateLimit.middleware.js";

const router: Router = Router();

// Route mapping: delegate the GET request to the controller function
router.get("/health", healthLimiter, getHealth);
router.get("/ready", healthLimiter, getReady);


export default router;
