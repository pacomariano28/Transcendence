import express, {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from "express";
import { createServer } from "node:http";
import type { Socket as NetSocket } from "node:net";
import { randomUUID } from "node:crypto";
import { logError, logInfo } from "./lib/logger.js";
import { globalLimiter } from "./middlewares/rateLimit.middleware.js";
import contentRoutes from "./routes/content.routes.js";
import authRoutes from "./routes/auth.routes.js";
import gameRoutes, { gameProxy } from "./routes/game.routes.js";
import playlistRoutes from "./routes/playlist.routes.js";
import cookieParser from "cookie-parser";

const app = express();
const server = createServer(app);

const PORT = Number(process.env.PORT || 3000);
const isProd = process.env.NODE_ENV === "production";

// Trust first proxy hop (Nginx) for real client IP
app.set("trust proxy", 1);

if (isProd) app.use(globalLimiter);

app.use(express.json());
app.use(cookieParser());

// Request id middleware for correlation across logs
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = req.header("x-request-id") || randomUUID();
  res.locals.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
});

// Routes registration
app.use("/api/auth", authRoutes);
app.use("/api/game", gameRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/playlist", playlistRoutes);

// 404 fallback
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    ok: false,
    error: "Route not found",
    requestId: res.locals.requestId ?? null,
  });
});

// Centralized error logger + response
const globalErrorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  void _next;
  const requestId = res.locals.requestId ?? null;
  const statusCode = Number(err?.statusCode || 500);
  const message = err?.message || "Internal server error";

  logError({
    requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    errorName: err?.name || "Error",
    errorMessage: message,
    stack: err?.stack,
  });

  res.status(statusCode).json({
    ok: false,
    error: statusCode >= 500 ? "Internal server error" : message,
    requestId,
  });
};

app.use(globalErrorHandler);

server.on("upgrade", (req, socket, head) => {
  if (req.url?.startsWith("/api/game")) {
    gameProxy.upgrade(req, socket as NetSocket, head);
  }
});

server.listen(PORT, () => {
  logInfo(`Listening on port ${PORT}`);
});

// Process-level safety net logs
process.on("unhandledRejection", (reason) => {
  logError({
    event: "unhandledRejection",
    errorMessage: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

process.on("uncaughtException", (error) => {
  logError({
    event: "uncaughtException",
    errorMessage: error.message,
    stack: error.stack,
  });
});
