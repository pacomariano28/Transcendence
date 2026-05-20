import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import { Router } from "express";

const router: Router = Router();

const GAME_SERVICE_URL =
  process.env.GAME_SERVICE_URL || "http://game-service:4001";

const proxyOptions = createProxyMiddleware({
  target: GAME_SERVICE_URL,
  changeOrigin: true,
  ws: true,
  pathRewrite: { "^/api/game": "" },
  on: {
    proxyReq: (proxyReq, req) => {
      fixRequestBody(proxyReq, req);
    },
  },
});

router.use("/", proxyOptions);

export default router;
