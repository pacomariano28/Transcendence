import { Router } from "express";
import {
  getAvailableSongCount,
  getPlaylist,
  getRandomSongs,
} from "../controllers/playlist.controller.js";

const router = Router();

router.get("/available-count", getAvailableSongCount);
router.get("/get-playlist", getPlaylist);
router.get("/get-random-songs", getRandomSongs);

export default router;
