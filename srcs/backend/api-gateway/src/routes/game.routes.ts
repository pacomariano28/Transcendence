import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import { Router, type Response } from "express";
import type { Socket } from "node:net";
import { requireAuth } from "../middlewares/auth.middleware.js";

const router: Router = Router();

const GAME_SERVICE_URL =
  process.env.GAME_SERVICE_URL || "http://game-service:4001";

function sendGameUnavailable(res: Response | Socket) {
  if (!("writeHead" in res) || res.writableEnded || res.headersSent) return;

  res.writeHead(502, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      ok: false,
      error: "GAME_SERVICE_UNAVAILABLE",
    }),
  );
}

export const socketProxy = createProxyMiddleware({
  target: GAME_SERVICE_URL,
  changeOrigin: true,
  ws: true,
  logger: console,
  on: {
    proxyReq: (proxyReq, req) => {
      fixRequestBody(proxyReq, req);
    },
    error: (_err, _req, res) => {
      sendGameUnavailable(res as Response | Socket);
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
    error: (_err, _req, res) => {
      sendGameUnavailable(res as Response | Socket);
    },
  },
});

router.get("/state", requireAuth, proxyOptions);
router.post("/match-state", requireAuth, proxyOptions);

export default router;
