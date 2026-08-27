import { Router } from "express";
import {
  getMatchState,
  getUserState,
} from "../controllers/state.controller.js";

export const stateRouter = Router();

stateRouter.get("/state", getUserState);
stateRouter.post("/match-state", getMatchState);
