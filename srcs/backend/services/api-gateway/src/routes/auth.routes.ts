import { Router } from "express";

import { proxyAuth } from "../controllers/auth.controller.js";

const router: Router = Router();

router.use(proxyAuth);

export default router;
