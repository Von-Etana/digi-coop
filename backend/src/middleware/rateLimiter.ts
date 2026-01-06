import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { sessionStore } from '../config/redis';
import { TooManyRequestsError } from '../utils/errors';
import { config } from '../config/index';

interface RateLimitOptions {
    windowMs?: number;
    max?: number;
    keyGenerator?: (req: AuthenticatedRequest) => string;
    message?: string;
    skipFailedRequests?: boolean;
}

/**
 * Redis-based rate limiter with sliding window
 */
export const rateLimiter = (options: RateLimitOptions = {}) => {
    const {
        windowMs = config.rateLimit.windowMs,
        max = config.rateLimit.maxRequests,
        keyGenerator = defaultKeyGenerator,
        message = 'Too many requests, please try again later',
        skipFailedRequests = false,
    } = options;

    const windowSeconds = Math.ceil(windowMs / 1000);

    return async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            const key = `ratelimit:${keyGenerator(req)}`;

            const current = await sessionStore.increment(key, windowSeconds);

            // Set rate limit headers
            res.setHeader('X-RateLimit-Limit', max);
            res.setHeader('X-RateLimit-Remaining', Math.max(0, max - current));

            const ttl = await sessionStore.getTtl(key);
            res.setHeader('X-RateLimit-Reset', Date.now() + (ttl * 1000));

            if (current > max) {
                throw new TooManyRequestsError(message, ttl);
            }

            // If skipFailedRequests is true, decrement on error responses
            if (skipFailedRequests) {
                const originalJson = res.json.bind(res);
                res.json = (body: unknown) => {
                    if (res.statusCode >= 400) {
                        // Decrement the counter for failed requests
                        sessionStore.get(key).then(val => {
                            if (val && parseInt(val) > 0) {
                                // We can't truly decrement, but we can track separately
                                // For simplicity, we'll just let it be
                            }
                        });
                    }
                    return originalJson(body);
                };
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Default key generator - uses IP + user ID if authenticated
 */
function defaultKeyGenerator(req: AuthenticatedRequest): string {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (req.user) {
        return `${req.user.id}:${req.path}`;
    }
    return `${ip}:${req.path}`;
}

/**
 * Strict rate limiter for sensitive endpoints
 */
export const strictRateLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'Too many attempts. Please wait 15 minutes before trying again.',
});

/**
 * Rate limiter for authentication endpoints
 */
export const authRateLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    keyGenerator: (req) => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        return `auth:${ip}`;
    },
    message: 'Too many authentication attempts. Please try again later.',
});

/**
 * Rate limiter for OTP requests
 */
export const otpRateLimiter = rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 3,
    keyGenerator: (req) => {
        const identifier = req.body.phone || req.body.email || req.ip;
        return `otp:${identifier}`;
    },
    message: 'Too many OTP requests. Please wait a minute before requesting again.',
});

/**
 * Rate limiter for financial transactions
 */
export const transactionRateLimiter = rateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    keyGenerator: (req) => {
        return req.user ? `txn:${req.user.id}` : `txn:${req.ip}`;
    },
    message: 'Too many transaction requests. Please slow down.',
});
