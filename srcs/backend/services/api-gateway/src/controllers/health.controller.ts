import axios from "axios";
import { Request, Response } from "express";

const GAME_SERVICE_URL = process.env.GAME_SERVICE_URL || "http://game-service:4001";
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://auth-service:4002";
const CONTENT_SERVICE_URL = process.env.CONTENT_SERVICE_URL || "http://content-service:4003";

const CHECK_TIMEOUT_MS = Number(process.env.HEALTHCHECK_TIMEOUT_MS ?? 1500);

type ServiceTarget = {
    name: string;
    url: string;
    path: string;
    enabled: boolean;
};

function enabledByDefault(value: string | undefined, defaultValue: boolean): boolean {
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === "true";
}

export function getHealth(_req: Request, res: Response): void {
    res.status(200).json({
        status: "ok",
        service: "api-gateway",
        uptime: Math.round(process.uptime()),
        timestamp: new Date().toISOString(),
    });
}

export async function getReady(_req: Request, res: Response): Promise<void> {
    const targets: ServiceTarget[] = [
        {
            name: "auth-service",
            url: AUTH_SERVICE_URL,
            path: "/health",
            enabled: enabledByDefault(process.env.CHECK_AUTH_SERVICE, true),
        },
        {
            name: "content-service",
            url: CONTENT_SERVICE_URL,
            path: "/health",
            enabled: enabledByDefault(process.env.CHECK_CONTENT_SERVICE, true),
        },
        {
            name: "game-service",
            url: GAME_SERVICE_URL,
            path: "/health",
            enabled: enabledByDefault(process.env.CHECK_GAME_SERVICE, true),
        },
    ].filter((s) => s.enabled);

    const results = await Promise.allSettled(
        targets.map((service) =>
            axios.get(service.url + service.path, { timeout: CHECK_TIMEOUT_MS }).then(() => service.name)
        )
    );

    const checks: Record<string, string> = {};
    let allReady = true;

    results.forEach((result, index) => {
        const name = targets[index].name;
        if (result.status === "fulfilled") {
            checks[name] = "ok";
        } else {
            checks[name] = "failed";
            allReady = false;
        }
    });

    if (allReady) {
        res.status(200).json({
            status: "ready",
            checks,
            timestamp: new Date().toISOString(),
        });
        return;
    }

    res.status(503).json({
        status: "not_ready",
        checks,
        timestamp: new Date().toISOString(),
    });
}
