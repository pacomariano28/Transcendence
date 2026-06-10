import { Router } from "express";
import { getUserState } from "../controllers/state.controller.js";

export const stateRouter = Router();

stateRouter.get("/state", getUserState);
