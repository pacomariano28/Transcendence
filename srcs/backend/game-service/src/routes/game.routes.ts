import { Router } from "express";
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

export default router;
