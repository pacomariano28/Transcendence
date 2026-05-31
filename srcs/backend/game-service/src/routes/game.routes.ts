import { Router } from "express";
import {
  createLobbyController,
  joinLobbyController,
  setPlayerReadyController,
} from "../controllers/game.controller.js";
//import { getPlaylist } from "../services/playlist.service.js";

const router = Router();

// // Ruta temporal de prueba
// router.get("/test-playlist", async (req, res) => {
//   try {
//     const playlist = await getPlaylist();
//     res.json({ ok: true, playlist });
//   } catch (err: any) {
//     res.status(500).json({ ok: false, error: err.message });
//   }
// });

router.post("/lobby", createLobbyController);
router.post("/lobby/:lobbyId/join", joinLobbyController);
router.post("/lobby/:lobbyId/ready", setPlayerReadyController);

export default router;
