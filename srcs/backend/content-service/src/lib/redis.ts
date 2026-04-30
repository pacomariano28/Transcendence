import { createClient, RedisClientType } from 'redis';
import { logError, logInfo } from './logger.js';

let redisClient: RedisClientType | null = null;

export const initRedis = async (): Promise<void> => {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    redisClient = createClient({ url: redisUrl });

    redisClient.on('connect', () => logInfo('Redis connecting'));
    redisClient.on('ready', () => logInfo('Redis connected and ready'));
    redisClient.on('error', (err) => logError({ event: 'redis-error', errorName: err.name, errorMessage: err.message, stack: err.stack }));
    redisClient.on('reconnecting', () => logInfo('Redis reconnecting'));
    redisClient.on('end', () => logInfo('Redis connection closed'));

    try {
        await redisClient.connect();
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logError({ event: 'redis-init', errorName: err.name, errorMessage: err.message, stack: err.stack });
        throw error;
    }
};

export const getRedisClient = (): RedisClientType => {
    if (!redisClient) {
        throw new Error('Redis client is not initialized. Call initRedis() first.');
    }
    return redisClient;
}
