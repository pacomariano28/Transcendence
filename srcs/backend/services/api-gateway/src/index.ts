import express, { Express, Request, Response } from "express";
import axios from "axios";

const app: Express = express();
const port: number = parseInt(process.env.PORT || "4000");

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://auth-service:4002";
app.use(express.json());

type ProxyRequestParams = {
  method: "get" | "post";
  path: string;
  req: Request;
  res: Response;
  withBody?: boolean;
  withAuthHeader?: boolean;
};

async function proxyAuthRequest(params: ProxyRequestParams): Promise<void> {
  const { method, path, req, res, withBody = false, withAuthHeader = false } = params;

  const headers: Record<string, string> = {};

  if (withAuthHeader) {
    const authHeader = req.header("authorization");

    if (authHeader) {
      headers.authorization = authHeader;
    }
  }

  try {
    const { status, data } = await axios.request({
      method,
      url: `${AUTH_SERVICE_URL}${path}`,
      timeout: 2000,
      data: withBody ? req.body : undefined,
      headers,
      validateStatus: () => true,
    });

    res.status(status).json(data);
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error("Error reaching auth service:", {
        message: err.message,
        code: err.code,
        status: err.response?.status,
      });
    } else {
      console.error("Unexpected error reaching auth service:", err);
    }

    res.status(502).json({
      ok: false,
      error: "Failed to reach auth service",
      detail: "Unable to contact auth service at this time.",
    });
  }
}

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

    const { data } = await axios.get(`${AUTH_SERVICE_URL}/health`, {
      timeout: 1000, // 1s
    });

    res.status(200).json({ ok: true, auth: data});

  } catch (err: unknown) {

    if (axios.isAxiosError(err)) {
      console.error("Error reaching auth service:", {
        message: err.message,
        code: err.code,
        status: err.response?.status,
      });
    } else {
      console.error("Unexpected error reaching auth service:", err);
    }

    res.status(502).json({
      ok: false,
      error: "Failed to reach auth service",
      detail: "Unable to contact auth service at this time."
    });
  }
});

app.post("/api/auth/register", async (req: Request, res: Response): Promise<void> => {
  await proxyAuthRequest({
    method: "post",
    path: "/auth/register",
    req,
    res,
    withBody: true,
  });
});

app.post("/api/auth/login", async (req: Request, res: Response): Promise<void> => {
  await proxyAuthRequest({
    method: "post",
    path: "/auth/login",
    req,
    res,
    withBody: true,
  });
});

app.post("/api/auth/refresh", async (req: Request, res: Response): Promise<void> => {
  await proxyAuthRequest({
    method: "post",
    path: "/auth/refresh",
    req,
    res,
    withBody: true,
  });
});

app.get("/api/auth/me", async (req: Request, res: Response): Promise<void> => {
  await proxyAuthRequest({
    method: "get",
    path: "/auth/me",
    req,
    res,
    withAuthHeader: true,
  });
});

app.listen(port, "0.0.0.0", (): void => {
  console.log(`API Gateway listening on port ${port}`);
});
