import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { idempotencyStore } from '../config/redis';
import { query } from '../config/database';
import { hashRequestBody } from '../services/encryption';
import { ConflictError } from '../utils/errors';
import { generateUuid } from '../utils/helpers';
import { logger } from '../utils/logger';

const IDEMPOTENCY_EXPIRY = 24 * 60 * 60; // 24 hours in seconds

/**
 * Idempotency middleware for preventing duplicate transactions
 * Requires header: X-Idempotency-Key
 */
export const idempotency = (requiredEndpoints?: string[]) => {
    return async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            // Only apply to specific methods
            if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
                return next();
            }

            // Check if this endpoint requires idempotency
            if (requiredEndpoints && !requiredEndpoints.some(ep => req.path.includes(ep))) {
                return next();
            }

            const idempotencyKey = req.headers['x-idempotency-key'] as string;

            if (!idempotencyKey) {
                // Generate one if not provided (optional, or throw error)
                req.idempotencyKey = generateUuid();
                return next();
            }

            // Validate key format (UUID)
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(idempotencyKey)) {
                return next(new ConflictError('Invalid idempotency key format'));
            }

            req.idempotencyKey = idempotencyKey;

            // Check if we've already processed this request
            const existingResponse = await idempotencyStore.get(idempotencyKey);

            if (existingResponse) {
                // Verify the request body hash matches
                const currentBodyHash = hashRequestBody(req.body);

                // Return cached response
                logger.info(`Returning cached response for idempotency key: ${idempotencyKey}`);
                res.status(existingResponse.statusCode).json(existingResponse.body);
                return;
            }

            // Store the original json method to capture response
            const originalJson = res.json.bind(res);

            res.json = (body: unknown) => {
                // Store the response for future duplicate requests
                idempotencyStore.set(
                    idempotencyKey,
                    { statusCode: res.statusCode, body },
                    IDEMPOTENCY_EXPIRY
                ).catch(err => {
                    logger.error('Failed to store idempotency response:', err);
                });

                // Also persist to database for longer-term storage
                if (req.user) {
                    const bodyHash = hashRequestBody(req.body);
                    query(
                        `INSERT INTO idempotency_keys (key, user_id, endpoint, request_body_hash, response, status_code, expires_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '24 hours')
             ON CONFLICT (key) DO NOTHING`,
                        [idempotencyKey, req.user.id, req.path, bodyHash, JSON.stringify(body), res.statusCode]
                    ).catch(err => {
                        logger.error('Failed to persist idempotency key:', err);
                    });
                }

                return originalJson(body);
            };

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Strict idempotency - requires the header and throws error if missing
 */
export const requireIdempotencyKey = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const idempotencyKey = req.headers['x-idempotency-key'] as string;

    if (!idempotencyKey) {
        return next(new ConflictError('X-Idempotency-Key header is required for this operation'));
    }

    // Continue with regular idempotency check
    const middleware = idempotency();
    middleware(req, res, next);
};
