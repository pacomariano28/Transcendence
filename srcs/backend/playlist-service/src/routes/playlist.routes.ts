import { Router } from "express";
import {
  ensureSongs,
  getAvailableSongCount,
  getPlaylist,
  getRandomSongs,
  getSeedSongs,
  getSongsStatus,
  markPlaylistUsage,
  orderPlaylistTracks,
  releasePlaylistUsage,
} from "../controllers/playlist.controller.js";

const router = Router();

router.get("/available-count", getAvailableSongCount);
router.get("/get-playlist", getPlaylist);
router.get("/get-random-songs", getRandomSongs);
router.get("/seed-songs", getSeedSongs);
router.post("/ensure-songs", ensureSongs);
router.get("/songs-status", getSongsStatus);
router.post("/playlist-usage/order", orderPlaylistTracks);
router.post("/playlist-usage/mark-used", markPlaylistUsage);
router.post("/playlist-usage/release", releasePlaylistUsage);

export default router;
