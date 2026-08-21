import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import { Router } from "express";
import { searchLimiter } from "../middlewares/rateLimit.middleware.js";
// import { requireAuth } from "../middlewares/auth.middleware.js";

const router: Router = Router();

const CONTENT_SERVICE_URL =
  process.env.CONTENT_SERVICE_URL || "http://auth-service:4002";

const proxyOptions = createProxyMiddleware({
  target: CONTENT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { "^/api/content": "/" },
  on: {
    proxyReq: (proxyReq, req) => {
      fixRequestBody(proxyReq, req);
    },
  },
});

// It will be required authentication to use this endpoint
// router.get("/search", requireAuth, searchLimiter, proxyOptions);
router.get("/search", searchLimiter, proxyOptions);
router.get("/search/playlists", searchLimiter, proxyOptions);
router.get("/search/albums", searchLimiter, proxyOptions);
router.get("/search/catalog", searchLimiter, proxyOptions);
router.get("/albums/:albumId", searchLimiter, proxyOptions);
router.get("/albums/:albumId/tracks", searchLimiter, proxyOptions);
router.get("/playlists/:playlistId", searchLimiter, proxyOptions);
router.get("/playlists/:playlistId/tracks", searchLimiter, proxyOptions);

export default router;
