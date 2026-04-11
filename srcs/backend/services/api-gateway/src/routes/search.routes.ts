import { Router } from "express";

import { proxySearch } from '../controllers/search.controller.js';

import { searchLimiter } from "../middlewares/rateLimit.middleware.js";

const router: Router = Router();

// Route mapping: delegate the GET request to the controller function
router.get('/', searchLimiter, proxySearch);

export default router;
