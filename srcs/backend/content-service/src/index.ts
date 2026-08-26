import express from "express";
import { initRedis } from "./lib/redis.js";
<<<<<<< HEAD
import { getAlbums, getCatalog, getPlaylists, getTracks } from "./controllers/search.controller.js";
import { getTrackByIsrc } from "./controllers/track.controller.js";
import {
  getAlbum,
  getAlbumTracks,
  getPlaylist,
  getPlaylistTracks,
} from "./controllers/playlist.controller.js";
import { getSetupStatus } from "./controllers/setup.controller.js";
=======
import { getTracks } from "./controllers/search.controller.js";
>>>>>>> main
import { logInfo } from "./lib/logger.js";

const app = express();
const port = process.env.PORT || 4003;

await initRedis();

app.use(express.json());

<<<<<<< HEAD
app.get("/search", getTracks);
app.get("/search/playlists", getPlaylists);
app.get("/search/albums", getAlbums);
app.get("/search/catalog", getCatalog);
app.get("/track-by-isrc", getTrackByIsrc);
app.get("/albums/:albumId", getAlbum);
app.get("/albums/:albumId/tracks", getAlbumTracks);
app.get("/playlists/:playlistId", getPlaylist);
app.get("/playlists/:playlistId/tracks", getPlaylistTracks);
=======
// Define the internal route
app.get("/search", getTracks);
>>>>>>> main

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "content-service",
  });
});

<<<<<<< HEAD
app.get("/setup/status", getSetupStatus);

=======
>>>>>>> main
app.listen(port, () => {
  logInfo(`Listening on port ${port}`);
});
