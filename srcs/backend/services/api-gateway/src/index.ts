import express, { Express, Request, Response } from "express";
import axios from "axios";

const app: Express = express();
const port: number = parseInt(process.env.PORT || "4000");

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://auth-service:4002";

app.get("/api/health", (_req: Request, res: Response): void => {

  const payload = {
    ok: true,
    service: "api-getway",
    via: "/api",
    timestamp: new Date().toISOString()
  };

  console.log("Hello:", payload);
  res.status(200).json(payload);
});

app.get("/api/auth/health", async (_req: Request, res: Response): Promise<void> => {

  try {

    const { data } = await axios.get(`${AUTH_SERVICE_URL}/health`);

    res.status(200).json({ ok: true, auth: data});

  }catch (err: any) {

    res.status(502).json({
      ok: false,
      error: "Failed to reach auth service",
      detail: err?.message
     });
    }
  });

app.listen(port, "0.0.0.0", (): void => {
  console.log(`API Gateway listening on port ${port}`);
});
