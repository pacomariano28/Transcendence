// srcs/backend/playlist-service/src/index.ts
import "dotenv/config"; // carga .env automáticamente en dev
import express from "express";
import playlistRouter from "./routes/playlist.routes.js";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json());

app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "playlist-service" });
});

app.use(playlistRouter);

const port = Number(
  process.env.PLAYLIST_SERVICE_PORT ?? process.env.PORT ?? 4004,
);

app.listen(port, () => {
  console.log(`[playlist-service] listening on http://localhost:${port}`);
});
