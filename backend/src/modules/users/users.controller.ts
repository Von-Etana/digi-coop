import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import { usersService } from './users.service';
import { sendSuccess, sendPaginated } from '../../middleware/validator';
import {
    UpdateProfileInput,
    ChangePasswordInput,
    AdminUpdateUserInput,
    UserQueryInput
} from './users.validation';

export class UsersController {
    /**
     * GET /api/v1/users/profile
     */
    async getProfile(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const user = await usersService.getProfile(req.user.id);
            sendSuccess(res, user, 'Profile retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/v1/users/profile
     */
    async updateProfile(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const input: UpdateProfileInput = req.body;
            const user = await usersService.updateProfile(req.user.id, input);

            sendSuccess(res, user, 'Profile updated successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * PUT /api/v1/users/change-password
     */
    async changePassword(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const input: ChangePasswordInput = req.body;
            await usersService.changePassword(req.user.id, input);

            sendSuccess(res, null, 'Password changed successfully');
        } catch (error) {
            next(error);
        }
    }

    // ==================== ADMIN CONTROLLERS ====================

    /**
     * GET /api/v1/users (Admin)
     */
    async getUsers(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const filters: UserQueryInput = req.query as unknown as UserQueryInput;
            const { users, total } = await usersService.getUsers(filters);

            sendPaginated(res, users, {
                page: filters.page || 1,
                limit: filters.limit || 20,
                total,
            }, 'Users retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/users/:id (Admin)
     */
    async getUserDetails(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const user = await usersService.getUserDetails(req.params.id);
            sendSuccess(res, user, 'User details retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/v1/users/:id (Admin)
     */
    async adminUpdateUser(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const input: AdminUpdateUserInput = req.body;
            const user = await usersService.adminUpdateUser(req.params.id, input);

            sendSuccess(res, user, 'User updated successfully');
        } catch (error) {
            next(error);
        }
    }
}

export const usersController = new UsersController();
