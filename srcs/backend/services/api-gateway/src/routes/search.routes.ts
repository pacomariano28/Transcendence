import { Router } from "express";

import { proxySearch } from '../controllers/search.controller.js';

const router: Router = Router();

// Route mapping: delegate the GET request to the controller function
router.get('/', proxySearch);

export default router;
