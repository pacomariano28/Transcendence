import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";
import { globalLimiter } from "../middlewares/rateLimit.middleware.js";

const router: Router = Router();

const AUTH_SERVICE_URL =
  process.env.AUTH_SERVICE_URL || "http://auth-service:4002";

const proxyOptions = createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { "^/api/auth": "/" },
  on: {
    proxyReq: (proxyReq, req) => {
      fixRequestBody(proxyReq, req);
    },
  },
});

<<<<<<< HEAD
// Credentials auth
router.post("/register", globalLimiter, proxyOptions);
router.post("/login", globalLimiter, proxyOptions);
router.post("/refresh", globalLimiter, proxyOptions);
router.post("/refresh-cookie", proxyOptions);
router.post("/logout", globalLimiter, proxyOptions);
=======
router.post("/register", globalLimiter, proxyOptions);
router.post("/login", globalLimiter, proxyOptions);
router.post("/refresh", globalLimiter, proxyOptions);
>>>>>>> main
router.get("/me", requireAuth, proxyOptions);

router.get("/health", globalLimiter, proxyOptions);

<<<<<<< HEAD
// Spotify Oauth
router.get("/spotify/login", globalLimiter, proxyOptions);
router.get("/spotify/callback", globalLimiter, proxyOptions);

// Spotify playlists
router.get("/spotify/playlists", requireAuth, proxyOptions);
router.get("/spotify/playlists/:playlistId/tracks", requireAuth, proxyOptions);

=======
>>>>>>> main
export default router;
