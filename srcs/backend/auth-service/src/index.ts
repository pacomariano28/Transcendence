import express from "express";
import cookieParser from "cookie-parser";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { logInfo } from "./lib/logger.js";

const app = express();

app.use(express.json());

app.use(cookieParser());

app.use(healthRouter);

app.use(authRouter);

const port = Number(process.env.PORT ?? 4002);

app.listen(port, "0.0.0.0", () => {
  logInfo(`[auth-service] listening on port ${port}`);
});
