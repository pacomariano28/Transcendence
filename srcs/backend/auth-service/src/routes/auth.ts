import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import * as oauthController from "../controllers/oauth.controller.js";
import * as spotifyPlaylistsController from "../controllers/spotifyPlaylists.controller.js";

export const authRouter = Router();

// Credentials auth
authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/refresh-cookie", authController.refreshCookie);
authRouter.post("/logout", authController.logout);
authRouter.get("/me", authController.me);

// Spotify Oauth
authRouter.get("/spotify/login", oauthController.spotifyLogin);
authRouter.get("/spotify/callback", oauthController.spotifyCallback);

// Spotify playlists (user token)
authRouter.get("/spotify/playlists", spotifyPlaylistsController.getMyPlaylists);
authRouter.get(
  "/spotify/playlists/:playlistId/tracks",
  spotifyPlaylistsController.getMyPlaylistTracks,
);

// Internal (docker network) — game-service materialization
authRouter.get(
  "/internal/users/:userId/spotify/playlists/:playlistId",
  spotifyPlaylistsController.getUserPlaylistMetaInternal,
);
authRouter.get(
  "/internal/users/:userId/spotify/playlists/:playlistId/tracks",
  spotifyPlaylistsController.getUserPlaylistTracksInternal,
);
