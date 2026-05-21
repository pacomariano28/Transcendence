import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import { Router } from "express";
import { globalLimiter } from "../middlewares/rateLimit.middleware.js";
// import { requireAuth } from "../middlewares/auth.middleware.js";

const router: Router = Router();

const PLAYLIST_SERVICE_URL =
  process.env.PLAYLIST_SERVICE_URL || "http://playlist-service:4004";

const proxyOptions = createProxyMiddleware({
  target: `${PLAYLIST_SERVICE_URL}`,
  changeOrigin: true,
  pathRewrite: { "^/api/playlist": "/" },
  on: {
    proxyReq: (proxyReq, req) => {
      fixRequestBody(proxyReq, req);
    },
  },
});

router.get("/get-playlist", /* requireAuth, */ globalLimiter, proxyOptions);

export default router;
