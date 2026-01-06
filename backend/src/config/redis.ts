import Redis from 'ioredis';
import { config } from './index';
import { logger } from '../utils/logger';

export const redis = new Redis(config.redis.url, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => Math.min(times * 100, 3000),
    lazyConnect: true,
});

redis.on('connect', () => {
    logger.info('Redis connected');
});

redis.on('error', (err) => {
    logger.error('Redis error:', err);
});

redis.on('close', () => {
    logger.warn('Redis connection closed');
});

// Connect to Redis
export async function connectRedis(): Promise<void> {
    try {
        await redis.connect();
    } catch (error) {
        logger.error('Failed to connect to Redis:', error);
        throw error;
    }
}

// Close Redis connection
export async function closeRedis(): Promise<void> {
    logger.info('Closing Redis connection...');
    await redis.quit();
    logger.info('Redis connection closed');
}

// Health check
export async function checkRedisHealth(): Promise<boolean> {
    try {
        const pong = await redis.ping();
        return pong === 'PONG';
    } catch (error) {
        logger.error('Redis health check failed:', error);
        return false;
    }
}

// Session helpers
export const sessionStore = {
    async set(key: string, value: string, expirySeconds: number): Promise<void> {
        await redis.setex(key, expirySeconds, value);
    },

    async get(key: string): Promise<string | null> {
        return redis.get(key);
    },

    async delete(key: string): Promise<void> {
        await redis.del(key);
    },

    async exists(key: string): Promise<boolean> {
        const result = await redis.exists(key);
        return result === 1;
    },

    // For rate limiting
    async increment(key: string, expirySeconds: number): Promise<number> {
        const result = await redis.multi()
            .incr(key)
            .expire(key, expirySeconds)
            .exec();
        return result?.[0]?.[1] as number || 0;
    },

    async getTtl(key: string): Promise<number> {
        return redis.ttl(key);
    },
};

// Idempotency key helpers
export const idempotencyStore = {
    async set(
        key: string,
        response: { statusCode: number; body: unknown },
        expirySeconds: number = 86400 // 24 hours
    ): Promise<void> {
        await redis.setex(
            `idempotency:${key}`,
            expirySeconds,
            JSON.stringify(response)
        );
    },

    async get(key: string): Promise<{ statusCode: number; body: unknown } | null> {
        const data = await redis.get(`idempotency:${key}`);
        return data ? JSON.parse(data) : null;
    },

    async exists(key: string): Promise<boolean> {
        const result = await redis.exists(`idempotency:${key}`);
        return result === 1;
    },
};
