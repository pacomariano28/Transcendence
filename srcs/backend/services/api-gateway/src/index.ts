import express, { Express, Request, Response } from "express";

const app: Express = express();
const port: number = parseInt(process.env.PORT || "4000");

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

app.listen(port, "0.0.0.0", (): void => {
  console.log(`API Gateway listening on port ${port}`);
});
