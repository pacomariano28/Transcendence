import express from "express";
import { initRedis } from "./lib/redis.js";
import { getTracks } from "./controllers/search.controller.js";
import { logInfo } from "./lib/logger.js";

const app = express();
const port = process.env.PORT || 4003;

await initRedis();

app.use(express.json());

// Define the internal route
app.get("/search", getTracks);

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "content-service",
  });
});

app.listen(port, () => {
  logInfo(`Listening on port ${port}`);
});
