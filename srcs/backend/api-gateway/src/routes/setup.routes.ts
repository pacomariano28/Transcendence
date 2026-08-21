import { Router } from "express";
import { getAggregatedSetupStatus } from "../controllers/setup.controller.js";

const router = Router();

router.get("/status", getAggregatedSetupStatus);

export default router;
