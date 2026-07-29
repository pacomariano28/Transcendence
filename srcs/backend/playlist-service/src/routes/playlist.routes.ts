import { Router } from "express";
import {
  ensureSongs,
  getAvailableSongCount,
  getPlaylist,
  getRandomSongs,
  getSongsStatus,
} from "../controllers/playlist.controller.js";

const router = Router();

router.get("/available-count", getAvailableSongCount);
router.get("/get-playlist", getPlaylist);
router.get("/get-random-songs", getRandomSongs);
router.post("/ensure-songs", ensureSongs);
router.get("/songs-status", getSongsStatus);

export default router;
