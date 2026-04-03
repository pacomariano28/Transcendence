import { Router } from "express";

import { getTracks } from '../controllers/search.controller.js';

const router: Router = Router();

// Route mapping: delegate the GET request to the controller function
router.get('/', getTracks);

export default router;
