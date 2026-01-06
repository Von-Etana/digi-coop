import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate, requireRole } from '../../middleware/auth';
import { validateBody, validateQuery } from '../../middleware/validator';
import { auditLog, AuditActions } from '../../middleware/auditLog';
import {
    updateProfileSchema,
    changePasswordSchema,
    adminUpdateUserSchema,
    userQuerySchema
} from './users.validation';

const router = Router();

// ==================== USER ROUTES ====================

/**
 * @route   GET /api/v1/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
    '/profile',
    authenticate,
    usersController.getProfile.bind(usersController)
);

/**
 * @route   PUT /api/v1/users/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put(
    '/profile',
    authenticate,
    validateBody(updateProfileSchema),
    auditLog({ action: AuditActions.PROFILE_UPDATED, entityType: 'user' }),
    usersController.updateProfile.bind(usersController)
);

/**
 * @route   PUT /api/v1/users/change-password
 * @desc    Change password
 * @access  Private
 */
router.put(
    '/change-password',
    authenticate,
    validateBody(changePasswordSchema),
    auditLog({ action: AuditActions.PASSWORD_CHANGED, entityType: 'user' }),
    usersController.changePassword.bind(usersController)
);

// ==================== ADMIN ROUTES ====================

/**
 * @route   GET /api/v1/users
 * @desc    List all users (with filtering)
 * @access  Admin only
 */
router.get(
    '/',
    authenticate,
    requireRole('admin'),
    validateQuery(userQuerySchema),
    usersController.getUsers.bind(usersController)
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get full user details
 * @access  Admin only
 */
router.get(
    '/:id',
    authenticate,
    requireRole('admin'),
    usersController.getUserDetails.bind(usersController)
);

/**
 * @route   PATCH /api/v1/users/:id
 * @desc    Update user status/role
 * @access  Admin only
 */
router.patch(
    '/:id',
    authenticate,
    requireRole('admin'),
    validateBody(adminUpdateUserSchema),
    auditLog({ action: AuditActions.USER_UPDATED, entityType: 'user', getEntityId: (req) => req.params.id }),
    usersController.adminUpdateUser.bind(usersController)
);

export default router;
