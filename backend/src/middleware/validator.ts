import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { z } from 'zod';
import { ValidationError } from '../utils/errors';

/**
 * Validate request body against a Zod schema
 */
export const validateBody = <T>(schema: z.ZodType<T>) => {
    return async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            req.body = await schema.parseAsync(req.body);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                const formattedErrors = error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                }));
                next(new ValidationError('Validation failed', formattedErrors));
            } else {
                next(error);
            }
        }
    };
};

/**
 * Validate request query parameters against a Zod schema
 */
export const validateQuery = <T>(schema: z.ZodType<T>) => {
    return async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            req.query = await schema.parseAsync(req.query) as typeof req.query;
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                const formattedErrors = error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                }));
                next(new ValidationError('Query validation failed', formattedErrors));
            } else {
                next(error);
            }
        }
    };
};

/**
 * Validate request params against a Zod schema
 */
export const validateParams = <T>(schema: z.ZodType<T>) => {
    return async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        try {
            req.params = await schema.parseAsync(req.params) as typeof req.params;
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                const formattedErrors = error.issues.map((issue) => ({
                    field: issue.path.join('.'),
                    message: issue.message,
                }));
                next(new ValidationError('Parameter validation failed', formattedErrors));
            } else {
                next(error);
            }
        }
    };
};

/**
 * Send standardized API response
 */
export function sendSuccess<T>(
    res: Response,
    data: T,
    message: string = 'Success',
    statusCode: number = 200
): Response {
    const response: ApiResponse<T> = {
        success: true,
        message,
        data,
    };
    return res.status(statusCode).json(response);
}

/**
 * Send standardized paginated response
 */
export function sendPaginated<T>(
    res: Response,
    data: T[],
    pagination: {
        page: number;
        limit: number;
        total: number;
    },
    message: string = 'Success'
): Response {
    return res.status(200).json({
        success: true,
        message,
        data,
        pagination: {
            ...pagination,
            total_pages: Math.ceil(pagination.total / pagination.limit),
        },
    });
}

/**
 * Send error response
 */
export function sendError(
    res: Response,
    message: string,
    code: string = 'ERROR',
    statusCode: number = 400,
    details?: unknown
): Response {
    const response: ApiResponse = {
        success: false,
        message,
        error: {
            code,
            details,
        },
    };
    return res.status(statusCode).json(response);
}
