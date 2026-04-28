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

router.post("/register", globalLimiter, proxyOptions);
router.post("/login", globalLimiter, proxyOptions);
router.get("/me", requireAuth, proxyOptions);

export default router;
