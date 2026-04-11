import rateLimit from 'express-rate-limit';

const toInt = (value: string | undefined, fallback: number): number => {
    const parsed = Number.parseInt(value ?? "", 10);
    return Number.isNaN(parsed) ? fallback : parsed;
};

const baseConfig = {
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again later.",
};

export const globalLimiter = rateLimit({
    ...baseConfig,
    windowMs: toInt(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    limit: toInt(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
});

export const searchLimiter = rateLimit({
    ...baseConfig,
    windowMs: toInt(process.env.SEARCH_RATE_LIMIT_WINDOW_MS, 1000),
    limit: toInt(process.env.SEARCH_RATE_LIMIT_MAX_REQUESTS, 2),
});

export const healthLimiter = rateLimit({
    ...baseConfig,
    windowMs: toInt(process.env.HEALTH_RATE_LIMIT_WINDOW_MS, 1 * 1000),
    limit: toInt(process.env.HEALTH_RATE_LIMIT_MAX_REQUESTS, 2),
});
