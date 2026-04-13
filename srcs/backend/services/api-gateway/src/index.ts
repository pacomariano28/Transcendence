import express, {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from "express";
import { randomUUID } from "node:crypto";
import { logError, logInfo } from "./lib/logger.js";
import { globalLimiter } from "./middlewares/rateLimit.middleware.js";
import searchRoutes from "./routes/search.routes.js";
import healthRoutes from "./routes/health.routes.js";

const app = express();

const PORT = Number(process.env.PORT || 3000);
const isProd = process.env.NODE_ENV === "production";

// Trust first proxy hop (Nginx) for real client IP
app.set("trust proxy", 1);

if (isProd) app.use(globalLimiter);

app.use(express.json());

// Request id middleware for correlation across logs
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = req.header("x-request-id") || randomUUID();
  res.locals.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
});

// Routes registration
app.use("/api/search", searchRoutes);
app.use("/", healthRoutes);

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
  const requestId = res.locals.requestId ?? null;
  const statusCode = Number(
    (err as any)?.statusCode || (err as any)?.status || 500,
  );
  const message = (err as any)?.message || "Internal server error";

  logError({
    requestId,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    errorName: (err as any)?.name || "Error",
    errorMessage: message,
    stack: (err as any)?.stack,
  });

  res.status(statusCode).json({
    ok: false,
    error: statusCode >= 500 ? "Internal server error" : message,
    requestId,
  });
};

app.use(globalErrorHandler);

app.listen(PORT, () => {
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
