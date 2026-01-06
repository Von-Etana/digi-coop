import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index';
import { AuthenticatedRequest, TokenPayload, UserStatus } from '../types';
import { UnauthorizedError, ForbiddenError, TwoFactorRequiredError } from '../utils/errors';
import { query } from '../config/database';
import { sessionStore } from '../config/redis';

/**
 * Verify JWT access token and attach user to request
 */
export const authenticate = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('Access token required');
        }

        const token = authHeader.substring(7);

        // Verify token
        const decoded = jwt.verify(token, config.jwt.accessSecret) as TokenPayload;

        if (decoded.type !== 'access') {
            throw new UnauthorizedError('Invalid token type');
        }

        // Check if session is valid (not logged out)
        const sessionKey = `session:${decoded.userId}:${token.substring(0, 16)}`;
        const sessionExists = await sessionStore.exists(sessionKey);

        // For access tokens, we don't strictly require session check
        // This is optional based on your security requirements

        // Fetch user from database
        const result = await query(
            `SELECT id, email, member_id, status, is_2fa_enabled 
       FROM users WHERE id = $1`,
            [decoded.userId]
        );

        if (result.rows.length === 0) {
            throw new UnauthorizedError('User not found');
        }

        const user = result.rows[0];

        if (user.status === UserStatus.SUSPENDED) {
            throw new ForbiddenError('Account is suspended');
        }

        // Fetch user roles
        const rolesResult = await query(
            `SELECT r.name FROM user_roles ur
             JOIN roles r ON ur.role_id = r.id
             WHERE ur.user_id = $1`,
            [user.id]
        );
        const roles = rolesResult.rows.map(row => row.name);

        // Attach user to request
        req.user = {
            id: user.id,
            email: user.email,
            member_id: user.member_id,
            status: user.status,
            is_2fa_enabled: user.is_2fa_enabled,
            roles,
        };

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            next(new UnauthorizedError('Invalid or expired token'));
        } else if (error instanceof jwt.TokenExpiredError) {
            next(new UnauthorizedError('Token has expired'));
        } else {
            next(error);
        }
    }
};

/**
 * Require user to be verified (KYC completed)
 */
export const requireVerified = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        return next(new UnauthorizedError('Authentication required'));
    }

    if (req.user.status !== UserStatus.VERIFIED) {
        return next(new ForbiddenError('Account verification required', 'KYC_REQUIRED'));
    }

    next();
};

/**
 * Require 2FA verification for sensitive operations
 */
export const require2FA = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) {
            throw new UnauthorizedError('Authentication required');
        }

        // Check if user has 2FA enabled
        if (!req.user.is_2fa_enabled) {
            // 2FA not enabled, allow through
            return next();
        }

        // Check for 2FA verification header
        const twoFactorToken = req.headers['x-2fa-token'] as string;

        if (!twoFactorToken) {
            throw new TwoFactorRequiredError('2FA verification required for this operation');
        }

        // Verify the 2FA token from Redis (set during 2FA verification)
        const tokenKey = `2fa:verified:${req.user.id}:${twoFactorToken}`;
        const isValid = await sessionStore.exists(tokenKey);

        if (!isValid) {
            throw new TwoFactorRequiredError('Invalid or expired 2FA verification');
        }

        // Delete the one-time use token
        await sessionStore.delete(tokenKey);

        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Role-based access control (for admin routes)
 */
export const requireRole = (...roles: string[]) => {
    return async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            if (!req.user) {
                throw new UnauthorizedError('Authentication required');
            }

            // Roles are now already attached to req.user by authenticate middleware
            const userRoles = req.user.roles;
            const hasRole = roles.some(role => userRoles.includes(role));

            if (!hasRole) {
                throw new ForbiddenError('Insufficient permissions');
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.substring(7);

        try {
            const decoded = jwt.verify(token, config.jwt.accessSecret) as TokenPayload;

            if (decoded.type === 'access') {
                const result = await query(
                    `SELECT id, email, member_id, status, is_2fa_enabled 
           FROM users WHERE id = $1`,
                    [decoded.userId]
                );

                if (result.rows.length > 0) {
                    const user = result.rows[0];
                    const rolesResult = await query(
                        `SELECT r.name FROM user_roles ur
                         JOIN roles r ON ur.role_id = r.id
                         WHERE ur.user_id = $1`,
                        [user.id]
                    );
                    const roles = rolesResult.rows.map(row => row.name);

                    req.user = {
                        id: user.id,
                        email: user.email,
                        member_id: user.member_id,
                        status: user.status,
                        is_2fa_enabled: user.is_2fa_enabled,
                        roles,
                    };
                }
            }
        } catch {
            // Token invalid, but that's okay for optional auth
        }

        next();
    } catch (error) {
        next(error);
    }
};
