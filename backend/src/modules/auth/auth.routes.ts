import { Router } from 'express';
import { authController } from './auth.controller';
import { validateBody } from '../../middleware/validator';
import { authenticate } from '../../middleware/auth';
import { authRateLimiter, otpRateLimiter } from '../../middleware/rateLimiter';
import {
    registerSchema,
    loginSchema,
    verifyOtpSchema,
    requestOtpSchema,
    refreshTokenSchema,
    setup2FASchema,
    verify2FASchema,
    changePasswordSchema,
} from './auth.validation';

const router = Router();

// Public routes (with rate limiting)

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
    '/register',
    authRateLimiter,
    validateBody(registerSchema),
    authController.register.bind(authController)
);

/**
 * @route   POST /api/v1/auth/request-otp
 * @desc    Request OTP for phone/email verification
 * @access  Public
 */
router.post(
    '/request-otp',
    otpRateLimiter,
    validateBody(requestOtpSchema),
    authController.requestOtp.bind(authController)
);

/**
 * @route   POST /api/v1/auth/verify-otp
 * @desc    Verify OTP code
 * @access  Public
 */
router.post(
    '/verify-otp',
    authRateLimiter,
    validateBody(verifyOtpSchema),
    authController.verifyOtp.bind(authController)
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login with email/phone and password
 * @access  Public
 */
router.post(
    '/login',
    authRateLimiter,
    validateBody(loginSchema),
    authController.login.bind(authController)
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token using refresh token
 * @access  Public
 */
router.post(
    '/refresh',
    validateBody(refreshTokenSchema),
    authController.refreshToken.bind(authController)
);

// Protected routes (require authentication)

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout (invalidate refresh token)
 * @access  Private
 */
router.post(
    '/logout',
    authenticate,
    authController.logout.bind(authController)
);

/**
 * @route   POST /api/v1/auth/logout-all
 * @desc    Logout from all devices
 * @access  Private
 */
router.post(
    '/logout-all',
    authenticate,
    authController.logoutAll.bind(authController)
);

/**
 * @route   POST /api/v1/auth/2fa/setup
 * @desc    Setup 2FA (TOTP or SMS)
 * @access  Private
 */
router.post(
    '/2fa/setup',
    authenticate,
    validateBody(setup2FASchema),
    authController.setup2FA.bind(authController)
);

/**
 * @route   POST /api/v1/auth/2fa/verify
 * @desc    Verify and enable 2FA
 * @access  Private
 */
router.post(
    '/2fa/verify',
    authenticate,
    validateBody(verify2FASchema),
    authController.verify2FA.bind(authController)
);

/**
 * @route   POST /api/v1/auth/2fa/validate
 * @desc    Validate 2FA code for sensitive operations
 * @access  Private
 */
router.post(
    '/2fa/validate',
    authenticate,
    validateBody(verify2FASchema),
    authController.validate2FA.bind(authController)
);

/**
 * @route   POST /api/v1/auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.post(
    '/change-password',
    authenticate,
    validateBody(changePasswordSchema),
    authController.changePassword.bind(authController)
);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get(
    '/me',
    authenticate,
    authController.me.bind(authController)
);

export default router;
