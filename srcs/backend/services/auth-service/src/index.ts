import express from "express";

const app = express();

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "auth-service" });
});

const port = Number(process.env.PORT ?? 4002);

app.listen(port, "0.0.0.0", () => {
  console.log(`[auth-service] listening on port ${port}`);
});