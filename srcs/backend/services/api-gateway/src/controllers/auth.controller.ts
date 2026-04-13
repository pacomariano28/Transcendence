import { Request, Response } from "express";
import axios from "axios";
import { logError } from "../lib/logger.js";

const AUTH_SERVICE_URL: string =
  process.env.AUTH_SERVICE_URL || "http://auth-service:4002";

export async function proxyAuth(req: Request, res: Response): Promise<void> {
  try {
    const upstreamPath: string = req.originalUrl.replace(
      /^\/api\/auth/,
      "/auth",
    );
    const url: string = `${AUTH_SERVICE_URL}${upstreamPath}`;
    console.log(`${url}`);
    const response = await axios.request({
      method: req.method,
      url,
      params: req.query,
      data: req.body,
      headers: {
        ...req.headers,
        host: undefined,
        "content-length": undefined,
      },
      validateStatus: () => true,
    });

    const contentType = response.headers["content-type"];
    if (contentType) {
      res.setHeader("content-type", contentType);
    }

    if (res.statusCode !== 200) throw Error;

    res.status(response.status).send(response.data);
  } catch (error: any) {
    const requestId = res.locals.requestId ?? null;
    const statusCode = error.response?.status || 500;
    logError({
      requestId,
      method: req.method,
      path: req.originalUrl,
      statusCode,
      errorName: error.name || "Error",
      errorMessage: error.message || "Proxy error",
      stack: error.stack,
    });
    res
      .status(statusCode)
      .json({ error: "Failed to fetch data from Auth Service" });
  }
}
