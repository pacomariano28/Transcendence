import { Router } from "express";
import { getPlaylist } from "../controllers/playlist.controller.js";

const router = Router();

router.get("/get-playlist", getPlaylist);

export default router;
