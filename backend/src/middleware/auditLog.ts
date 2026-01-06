import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { query } from '../config/database';
import { logger } from '../utils/logger';

interface AuditLogOptions {
    action: string;
    entityType: string;
    getEntityId?: (req: AuthenticatedRequest) => string | undefined;
    getOldValues?: (req: AuthenticatedRequest) => Promise<Record<string, unknown> | null>;
    getNewValues?: (req: AuthenticatedRequest, res: Response) => Record<string, unknown> | null;
}

/**
 * Middleware to automatically log admin actions
 */
export const auditLog = (options: AuditLogOptions) => {
    return async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        // Store the original json method
        const originalJson = res.json.bind(res);

        // Capture old values before the operation
        let oldValues: Record<string, unknown> | null = null;
        if (options.getOldValues) {
            try {
                oldValues = await options.getOldValues(req);
            } catch (error) {
                logger.error('Failed to capture old values for audit log:', error);
            }
        }

        // Override json to capture the response and log after successful operations
        res.json = (body: unknown) => {
            // Only log successful operations (2xx status codes)
            if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
                const entityId = options.getEntityId ? options.getEntityId(req) : req.params.id;
                const newValues = options.getNewValues ? options.getNewValues(req, res) : req.body;
                const ipAddress = req.ip || req.socket.remoteAddress;

                // Log asynchronously to not block the response
                createAuditLog({
                    adminId: req.user.id,
                    action: options.action,
                    entityType: options.entityType,
                    entityId,
                    oldValues,
                    newValues,
                    ipAddress,
                }).catch(err => {
                    logger.error('Failed to create audit log:', err);
                });
            }

            return originalJson(body);
        };

        next();
    };
};

interface CreateAuditLogParams {
    adminId: string;
    action: string;
    entityType: string;
    entityId?: string;
    oldValues?: Record<string, unknown> | null;
    newValues?: Record<string, unknown> | null;
    ipAddress?: string;
}

/**
 * Create an audit log entry directly
 */
export async function createAuditLog(params: CreateAuditLogParams): Promise<void> {
    try {
        await query(
            `INSERT INTO audit_logs (admin_id, action, entity_type, entity_id, old_values, new_values, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                params.adminId,
                params.action,
                params.entityType,
                params.entityId || null,
                params.oldValues ? JSON.stringify(params.oldValues) : null,
                params.newValues ? JSON.stringify(params.newValues) : null,
                params.ipAddress || null,
            ]
        );

        logger.info('Audit log created', {
            action: params.action,
            entityType: params.entityType,
            entityId: params.entityId,
            adminId: params.adminId,
        });
    } catch (error) {
        logger.error('Failed to create audit log:', error);
        throw error;
    }
}

/**
 * Helper to get entity values before modification
 */
export async function getEntityValues(
    tableName: string,
    entityId: string,
    columns: string[] = ['*']
): Promise<Record<string, unknown> | null> {
    const columnList = columns.join(', ');
    const result = await query(
        `SELECT ${columnList} FROM ${tableName} WHERE id = $1`,
        [entityId]
    );
    return result.rows[0] || null;
}

// Predefined audit actions
export const AuditActions = {
    // Loans
    LOAN_APPROVED: 'loan_approved',
    LOAN_REJECTED: 'loan_rejected',
    LOAN_DISBURSED: 'loan_disbursed',

    // Investments
    INVESTMENT_CREATED: 'investment_created',
    INVESTMENT_ROI_UPDATED: 'investment_roi_updated',
    INVESTMENT_CLOSED: 'investment_closed',

    // Group Buying
    GROUP_BUY_CREATED: 'group_buy_created',
    GROUP_BUY_CLOSED: 'group_buy_closed',
    GROUP_BUY_REFUNDED: 'group_buy_refunded',

    // Events
    EVENT_CREATED: 'event_created',
    EVENT_UPDATED: 'event_updated',
    EVENT_CANCELLED: 'event_cancelled',

    // Users
    USER_SUSPENDED: 'user_suspended',
    USER_VERIFIED: 'user_verified',
    USER_KYC_APPROVED: 'user_kyc_approved',
    USER_KYC_REJECTED: 'user_kyc_rejected',
    USER_UPDATED: 'user_updated',
    PROFILE_UPDATED: 'profile_updated',
    PASSWORD_CHANGED: 'password_changed',

    // Settings
    SETTINGS_UPDATED: 'settings_updated',
} as const;
