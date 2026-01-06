import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, TwoFactorMethod } from '../../types';
import { authService } from './auth.service';
import { sendSuccess } from '../../middleware/validator';
import {
    RegisterInput,
    LoginInput,
    VerifyOtpInput,
    RequestOtpInput,
    RefreshTokenInput,
    Setup2FAInput,
    Verify2FAInput,
    ChangePasswordInput
} from './auth.validation';

export class AuthController {
    /**
     * POST /api/v1/auth/register
     */
    async register(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const input: RegisterInput = req.body;
            const result = await authService.register(input);
            sendSuccess(res, result, 'Registration successful', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/auth/request-otp
     */
    async requestOtp(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const input: RequestOtpInput = req.body;
            await authService.generateAndSendOtp(
                input.identifier.includes('@') ? null : input.identifier,
                input.identifier.includes('@') ? input.identifier : null,
                input.purpose
            );
            sendSuccess(res, null, 'OTP sent successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/auth/verify-otp
     */
    async verifyOtp(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const input: VerifyOtpInput = req.body;
            const result = await authService.verifyOtp(input);
            sendSuccess(res, result, 'OTP verified successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/auth/login
     */
    async login(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const input: LoginInput = req.body;
            const ipAddress = req.ip || req.socket.remoteAddress || '';
            const deviceInfo = req.headers['user-agent'];

            const tokens = await authService.login(input, ipAddress, deviceInfo);

            sendSuccess(res, {
                access_token: tokens.accessToken,
                refresh_token: tokens.refreshToken,
                token_type: 'Bearer',
                expires_in: tokens.expiresIn,
            }, 'Login successful');
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/auth/refresh
     */
    async refreshToken(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const input: RefreshTokenInput = req.body;
            const tokens = await authService.refreshAccessToken(input.refresh_token);

            sendSuccess(res, {
                access_token: tokens.accessToken,
                refresh_token: tokens.refreshToken,
                token_type: 'Bearer',
                expires_in: tokens.expiresIn,
            }, 'Token refreshed successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/auth/logout
     */
    async logout(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const refreshToken = req.body.refresh_token;
            if (refreshToken) {
                await authService.logout(refreshToken);
            }
            sendSuccess(res, null, 'Logged out successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/auth/logout-all
     */
    async logoutAll(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            await authService.logoutAll(req.user.id);
            sendSuccess(res, null, 'All sessions terminated');
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/auth/2fa/setup
     */
    async setup2FA(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const input: Setup2FAInput = req.body;
            const method = input.method === 'totp' ? TwoFactorMethod.TOTP : TwoFactorMethod.SMS;
            const result = await authService.setup2FA(req.user.id, method);
            sendSuccess(res, result, '2FA setup initiated');
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/auth/2fa/verify
     */
    async verify2FA(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const input: Verify2FAInput = req.body;
            const result = await authService.verify2FA(req.user.id, input.code);
            sendSuccess(res, result, '2FA enabled successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/auth/2fa/validate
     * Validate 2FA code for sensitive operations
     */
    async validate2FA(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const { code } = req.body;
            const verificationToken = await authService.verify2FACode(req.user.id, code);
            sendSuccess(res, { verification_token: verificationToken }, '2FA verified');
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/auth/change-password
     */
    async changePassword(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            const input: ChangePasswordInput = req.body;
            await authService.changePassword(req.user.id, input);
            sendSuccess(res, null, 'Password changed successfully. Please login again.');
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/auth/me
     * Get current user info
     */
    async me(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }
            sendSuccess(res, req.user, 'User info retrieved');
        } catch (error) {
            next(error);
        }
    }
}

export const authController = new AuthController();
