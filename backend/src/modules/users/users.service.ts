import bcrypt from 'bcryptjs';
import { query } from '../../config/database';
import { User, UserStatus } from '../../types';
import { NotFoundError, BadRequestError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import {
    UpdateProfileInput,
    ChangePasswordInput,
    AdminUpdateUserInput,
    UserQueryInput
} from './users.validation';

export class UsersService {
    /**
     * Get user profile by ID
     */
    async getProfile(userId: string): Promise<User> {
        const result = await query(
            `SELECT id, email, phone, first_name, last_name, status, member_id, is_2fa_enabled, created_at, updated_at 
       FROM users WHERE id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            throw new NotFoundError('User not found');
        }

        return result.rows[0] as User;
    }

    /**
     * Update user profile
     */
    async updateProfile(userId: string, input: UpdateProfileInput): Promise<User> {
        const updates: string[] = [];
        const values: unknown[] = [];
        let paramIndex = 1;

        if (input.first_name) {
            updates.push(`first_name = $${paramIndex++}`);
            values.push(input.first_name);
        }
        if (input.last_name) {
            updates.push(`last_name = $${paramIndex++}`);
            values.push(input.last_name);
        }
        if (input.phone) {
            // Check if phone is already taken by another user
            const existing = await query(
                `SELECT id FROM users WHERE phone = $1 AND id != $2`,
                [input.phone, userId]
            );
            if (existing.rows.length > 0) {
                throw new BadRequestError('Phone number already in use');
            }
            updates.push(`phone = $${paramIndex++}`);
            values.push(input.phone);
        }

        if (updates.length === 0) {
            return this.getProfile(userId);
        }

        updates.push(`updated_at = NOW()`);
        values.push(userId);

        const result = await query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} 
       RETURNING id, email, phone, first_name, last_name, status, member_id, is_2fa_enabled, created_at, updated_at`,
            values
        );

        logger.info(`User profile updated: ${userId}`);
        return result.rows[0] as User;
    }

    /**
     * Change password
     */
    async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
        const userResult = await query(
            `SELECT password_hash FROM users WHERE id = $1`,
            [userId]
        );

        if (userResult.rows.length === 0) {
            throw new NotFoundError('User not found');
        }

        const user = userResult.rows[0];
        const isValid = await bcrypt.compare(input.current_password, user.password_hash);

        if (!isValid) {
            throw new BadRequestError('Invalid current password');
        }

        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(input.new_password, salt);

        await query(
            `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
            [hashedPassword, userId]
        );

        logger.info(`Password changed for user: ${userId}`);
    }

    // ==================== ADMIN METHODS ====================

    /**
     * Get all users (Admin)
     */
    async getUsers(filters: UserQueryInput): Promise<{ users: User[]; total: number }> {
        let whereClause = '1=1';
        const params: unknown[] = [];
        let paramIndex = 1;

        if (filters.status && filters.status !== 'all') {
            whereClause += ` AND status = $${paramIndex++}`;
            params.push(filters.status);
        }

        if (filters.search) {
            whereClause += ` AND (email ILIKE $${paramIndex} OR first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex} OR member_id ILIKE $${paramIndex})`;
            params.push(`%${filters.search}%`);
            paramIndex++;
        }

        // Get total count
        const countResult = await query(
            `SELECT COUNT(*) FROM users WHERE ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Get paginated users
        const offset = (filters.page - 1) * filters.limit;
        const result = await query(
            `SELECT id, email, phone, first_name, last_name, status, member_id, is_2fa_enabled, created_at, updated_at 
       FROM users 
       WHERE ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, filters.limit, offset]
        );

        return {
            users: result.rows as User[],
            total,
        };
    }

    /**
     * Get user details (Admin)
     */
    async getUserDetails(userId: string): Promise<User & { kyc_status: string; wallet_balance: number }> {
        // Get user basic info
        const user = await this.getProfile(userId);

        // Get additional info (KYC, Wallet)
        const kycResult = await query(
            `SELECT verification_status FROM kyc_records WHERE user_id = $1`,
            [userId]
        );

        const walletResult = await query(
            `SELECT available_balance FROM wallets WHERE user_id = $1`,
            [userId]
        );

        return {
            ...user,
            kyc_status: kycResult.rows[0]?.verification_status || 'none',
            wallet_balance: parseFloat(walletResult.rows[0]?.available_balance || '0'),
        };
    }

    /**
     * Update user status/role (Admin)
     */
    async adminUpdateUser(userId: string, input: AdminUpdateUserInput): Promise<User> {
        const updates: string[] = [];
        const values: unknown[] = [];
        let paramIndex = 1;

        if (input.status) {
            updates.push(`status = $${paramIndex++}`);
            values.push(input.status);
        }

        // Note: Role management would typically be in a separate table or RBAC system, 
        // strictly speaking, but assuming it might be a column or managed via separate Auth table.
        // For now, we only update status in the 'users' table based on the schema.

        if (updates.length === 0) {
            return this.getProfile(userId);
        }

        updates.push(`updated_at = NOW()`);
        values.push(userId);

        const result = await query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} 
       RETURNING id, email, phone, first_name, last_name, status, member_id, is_2fa_enabled, created_at, updated_at`,
            values
        );

        if (result.rows.length === 0) {
            throw new NotFoundError('User not found');
        }

        logger.info(`User updated by admin: ${userId}`, { input });
        return result.rows[0] as User;
    }
}

export const usersService = new UsersService();
