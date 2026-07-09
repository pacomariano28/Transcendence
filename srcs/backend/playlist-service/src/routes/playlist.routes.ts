import { Router } from "express";
import {
  getAvailableSongCount,
  getPlaylist,
} from "../controllers/playlist.controller.js";

const router = Router();

router.get("/available-count", getAvailableSongCount);
router.get("/get-playlist", getPlaylist);

export default router;
