import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

export const initRedis = async (): Promise<void> => {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    redisClient = createClient({ url: redisUrl });

    redisClient.on('connect', () => console.log('[Redis] Connecting...'));
    redisClient.on('ready', () => console.log('[Redis] Connected and ready'));
    redisClient.on('error', (err) => console.error('[Redis] Connection error:', err));
    redisClient.on('reconnecting', () => console.log('[Redis] Reconnecting...'));
    redisClient.on('end', () => console.log('[Redis] Connection closed'));

    try {
        await redisClient.connect();
    } catch (error) {
        console.error('[Redis] Initialization failed:', error);
        throw error;
    }
};

export const getRedisClient = (): RedisClientType => {
    if (!redisClient) {
        throw new Error('Redis client is not initialized. Call initRedis() first.');
    }
    return redisClient;
}
