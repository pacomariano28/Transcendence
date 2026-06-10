import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router: Router = Router();

const GAME_SERVICE_URL =
  process.env.GAME_SERVICE_URL || "http://game-service:4001";

export const socketProxy = createProxyMiddleware({
  target: GAME_SERVICE_URL,
  changeOrigin: true,
  ws: true,
  logger: console,
  pathRewrite: { "^/socket.io": "/socket.io" },
  on: {
    proxyReq: (proxyReq, req) => {
      console.log(`[PROXY OUT] Proxying to: ${proxyReq.path}`);
      fixRequestBody(proxyReq, req);
    },
    proxyRes: (proxyRes, _req) => {
      void _req;
      // <--- 3. Log de lo que el game-service contesta
      console.log(
        `[PROXY RES] Target responded with status: ${proxyRes.statusCode}`,
      );
    },
  },
});

const proxyOptions = createProxyMiddleware({
  target: GAME_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { "^/api/game": "/" },
  on: {
    proxyReq: (proxyReq, req) => {
      fixRequestBody(proxyReq, req);
    },
  },
});

router.get("/state", requireAuth, proxyOptions);

export default router;
