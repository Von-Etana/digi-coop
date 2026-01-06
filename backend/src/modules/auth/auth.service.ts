import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { query, withTransaction } from '../../config/database';
import { sessionStore } from '../../config/redis';
import { config } from '../../config/index';
import { encrypt, decrypt, generateSecureToken } from '../../services/encryption';
import {
    generateMemberId,
    generateAccountNumber,
    generateOtp,
    generateUuid,
    normalizePhoneNumber,
    hashString,
    parseDuration
} from '../../utils/helpers';
import {
    User,
    TokenPair,
    TokenPayload,
    UserStatus,
    TwoFactorMethod
} from '../../types';
import {
    BadRequestError,
    UnauthorizedError,
    ConflictError,
    NotFoundError,
    InvalidOtpError,
    AccountLockedError
} from '../../utils/errors';
import { logger } from '../../utils/logger';
import {
    RegisterInput,
    LoginInput,
    VerifyOtpInput,
    Setup2FAInput,
    Verify2FAInput,
    ChangePasswordInput
} from './auth.validation';

const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 30;
const OTP_EXPIRY_MINUTES = 10;

export class AuthService {
    /**
     * Register a new user
     */
    async register(input: RegisterInput): Promise<{ userId: string; message: string }> {
        const normalizedPhone = normalizePhoneNumber(input.phone);
        if (!normalizedPhone) {
            throw new BadRequestError('Invalid phone number format');
        }

        // Check if user already exists
        const existingUser = await query(
            `SELECT id FROM users WHERE email = $1 OR phone = $2`,
            [input.email.toLowerCase(), normalizedPhone]
        );

        if (existingUser.rows.length > 0) {
            throw new ConflictError('User with this email or phone already exists');
        }

        // Hash password
        const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

        // Generate member ID
        const sequenceResult = await query(`SELECT nextval('member_id_seq') as seq`);
        const memberId = generateMemberId(parseInt(sequenceResult.rows[0].seq));

        // Generate account number for wallet
        const accountNumber = generateAccountNumber();

        // Create user and wallet in transaction
        const userId = await withTransaction(async (client) => {
            // Insert user
            const userResult = await client.query(
                `INSERT INTO users (email, phone, password_hash, first_name, last_name, member_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
                [
                    input.email.toLowerCase(),
                    normalizedPhone,
                    passwordHash,
                    input.first_name,
                    input.last_name,
                    memberId,
                    UserStatus.PENDING
                ]
            );

            const newUserId = userResult.rows[0].id;

            // Create wallet
            await client.query(
                `INSERT INTO wallets (user_id, account_number)
         VALUES ($1, $2)`,
                [newUserId, accountNumber]
            );

            // Create KYC record placeholder
            await client.query(
                `INSERT INTO kyc_records (user_id) VALUES ($1)`,
                [newUserId]
            );

            // Create compulsory savings account
            await client.query(
                `INSERT INTO savings_accounts (user_id, type)
         VALUES ($1, 'compulsory')`,
                [newUserId]
            );

            return newUserId;
        });

        // Generate and send OTP for verification
        await this.generateAndSendOtp(normalizedPhone, input.email, 'registration');

        logger.info(`User registered: ${memberId}`, { userId });

        return {
            userId,
            message: 'Registration successful. Please verify your phone/email with the OTP sent.',
        };
    }

    /**
     * Generate and send OTP
     */
    async generateAndSendOtp(
        phone: string | null,
        email: string | null,
        purpose: string
    ): Promise<void> {
        if (!phone && !email) {
            throw new BadRequestError('Phone or email is required');
        }

        const code = generateOtp();
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

        // Find user if exists
        let userId: string | null = null;
        if (phone || email) {
            const userResult = await query(
                `SELECT id FROM users WHERE phone = $1 OR email = $2`,
                [phone, email]
            );
            if (userResult.rows.length > 0) {
                userId = userResult.rows[0].id;
            }
        }

        // Store OTP
        await query(
            `INSERT INTO otp_codes (user_id, phone, email, code, purpose, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
            [userId, phone, email, code, purpose, expiresAt]
        );

        // TODO: Send OTP via SMS/Email service
        // For development, log the code
        logger.info(`OTP generated for ${phone || email}: ${code} (expires: ${expiresAt})`);
    }

    /**
     * Verify OTP
     */
    async verifyOtp(input: VerifyOtpInput): Promise<{ verified: boolean; userId?: string }> {
        const normalizedPhone = normalizePhoneNumber(input.identifier);
        const identifier = normalizedPhone || input.identifier.toLowerCase();

        const result = await query(
            `SELECT id, user_id, attempts FROM otp_codes 
       WHERE (phone = $1 OR email = $1) 
         AND code = $2 
         AND purpose = $3 
         AND expires_at > NOW() 
         AND verified = FALSE
       ORDER BY created_at DESC 
       LIMIT 1`,
            [identifier, input.code, input.purpose]
        );

        if (result.rows.length === 0) {
            // Increment attempts on wrong OTP
            await query(
                `UPDATE otp_codes 
         SET attempts = attempts + 1 
         WHERE (phone = $1 OR email = $1) 
           AND purpose = $2 
           AND verified = FALSE`,
                [identifier, input.purpose]
            );
            throw new InvalidOtpError();
        }

        const otp = result.rows[0];

        // Mark OTP as verified
        await query(
            `UPDATE otp_codes SET verified = TRUE WHERE id = $1`,
            [otp.id]
        );

        // If registration purpose, update user status
        if (input.purpose === 'registration' && otp.user_id) {
            await query(
                `UPDATE users SET status = $1 WHERE id = $2`,
                [UserStatus.PENDING, otp.user_id] // Still pending until KYC
            );
        }

        return { verified: true, userId: otp.user_id };
    }

    /**
     * Login user
     */
    async login(input: LoginInput, ipAddress: string, deviceInfo?: string): Promise<TokenPair> {
        const normalizedPhone = normalizePhoneNumber(input.identifier);
        const identifier = normalizedPhone || input.identifier.toLowerCase();

        // Find user
        const result = await query(
            `SELECT id, email, phone, password_hash, status, member_id, is_2fa_enabled, 
              failed_login_attempts, locked_until
       FROM users 
       WHERE email = $1 OR phone = $1`,
            [identifier]
        );

        if (result.rows.length === 0) {
            throw new UnauthorizedError('Invalid credentials');
        }

        const user = result.rows[0];

        // Check if account is locked
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
            const remainingMinutes = Math.ceil(
                (new Date(user.locked_until).getTime() - Date.now()) / 60000
            );
            throw new AccountLockedError(
                `Account is locked. Try again in ${remainingMinutes} minutes.`
            );
        }

        // Verify password
        const isValid = await bcrypt.compare(input.password, user.password_hash);

        if (!isValid) {
            // Increment failed attempts
            const newAttempts = user.failed_login_attempts + 1;

            if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
                const lockUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000);
                await query(
                    `UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3`,
                    [newAttempts, lockUntil, user.id]
                );
                throw new AccountLockedError(
                    `Too many failed attempts. Account locked for ${LOCK_DURATION_MINUTES} minutes.`
                );
            }

            await query(
                `UPDATE users SET failed_login_attempts = $1 WHERE id = $2`,
                [newAttempts, user.id]
            );

            throw new UnauthorizedError('Invalid credentials');
        }

        // Reset failed attempts on successful login
        await query(
            `UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1`,
            [user.id]
        );

        // Generate tokens
        const tokens = await this.generateTokens(
            { id: user.id, email: user.email, member_id: user.member_id },
            ipAddress,
            deviceInfo
        );

        logger.info(`User logged in: ${user.member_id}`, { userId: user.id });

        return tokens;
    }

    /**
     * Generate access and refresh tokens
     */
    async generateTokens(
        user: { id: string; email: string; member_id: string },
        ipAddress: string,
        deviceInfo?: string
    ): Promise<TokenPair> {
        const accessPayload: TokenPayload = {
            userId: user.id,
            email: user.email,
            memberId: user.member_id,
            type: 'access',
        };

        const refreshPayload: TokenPayload = {
            userId: user.id,
            email: user.email,
            memberId: user.member_id,
            type: 'refresh',
        };

        const accessToken = jwt.sign(
            accessPayload as object,
            config.jwt.accessSecret,
            { expiresIn: config.jwt.accessExpiry } as jwt.SignOptions
        );

        const refreshToken = jwt.sign(
            refreshPayload as object,
            config.jwt.refreshSecret,
            { expiresIn: config.jwt.refreshExpiry } as jwt.SignOptions
        );

        // Store refresh token hash in database
        const refreshTokenHash = hashString(refreshToken);
        const expiresAt = new Date(Date.now() + parseDuration(config.jwt.refreshExpiry));

        await query(
            `INSERT INTO user_sessions (user_id, refresh_token_hash, device_info, ip_address, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
            [user.id, refreshTokenHash, deviceInfo, ipAddress, expiresAt]
        );

        // Calculate expiry in seconds
        const expiresIn = Math.floor(parseDuration(config.jwt.accessExpiry) / 1000);

        return {
            accessToken,
            refreshToken,
            expiresIn,
        };
    }

    /**
     * Refresh access token
     */
    async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
        try {
            const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as TokenPayload;

            if (decoded.type !== 'refresh') {
                throw new UnauthorizedError('Invalid token type');
            }

            // Verify session exists
            const refreshTokenHash = hashString(refreshToken);
            const sessionResult = await query(
                `SELECT id, user_id FROM user_sessions 
         WHERE refresh_token_hash = $1 AND expires_at > NOW()`,
                [refreshTokenHash]
            );

            if (sessionResult.rows.length === 0) {
                throw new UnauthorizedError('Session expired or invalid');
            }

            const session = sessionResult.rows[0];

            // Get user
            const userResult = await query(
                `SELECT id, email, member_id, status FROM users WHERE id = $1`,
                [session.user_id]
            );

            if (userResult.rows.length === 0 || userResult.rows[0].status === UserStatus.SUSPENDED) {
                throw new UnauthorizedError('User not found or suspended');
            }

            const user = userResult.rows[0];

            // Delete old session
            await query(`DELETE FROM user_sessions WHERE id = $1`, [session.id]);

            // Generate new tokens (token rotation)
            return this.generateTokens(
                { id: user.id, email: user.email, member_id: user.member_id },
                '',
                undefined
            );
        } catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                throw new UnauthorizedError('Invalid refresh token');
            }
            throw error;
        }
    }

    /**
     * Logout - invalidate refresh token
     */
    async logout(refreshToken: string): Promise<void> {
        const refreshTokenHash = hashString(refreshToken);
        await query(
            `DELETE FROM user_sessions WHERE refresh_token_hash = $1`,
            [refreshTokenHash]
        );
    }

    /**
     * Logout all sessions for a user
     */
    async logoutAll(userId: string): Promise<void> {
        await query(`DELETE FROM user_sessions WHERE user_id = $1`, [userId]);
        logger.info(`All sessions cleared for user: ${userId}`);
    }

    /**
     * Setup 2FA
     */
    async setup2FA(userId: string, method: TwoFactorMethod): Promise<{ secret?: string; qrCode?: string; message: string }> {
        if (method === TwoFactorMethod.TOTP) {
            // Generate TOTP secret
            const secret = speakeasy.generateSecret({
                name: `DigiCoop:${userId}`,
                issuer: config.twoFactor.issuer,
                length: 32,
            });

            // Encrypt and store the secret
            const encryptedSecret = encrypt(secret.base32);

            await query(
                `INSERT INTO two_factor_auth (user_id, method, secret_encrypted, is_verified)
         VALUES ($1, $2, $3, FALSE)
         ON CONFLICT (user_id, method) 
         DO UPDATE SET secret_encrypted = $3, is_verified = FALSE`,
                [userId, method, encryptedSecret]
            );

            // Generate QR code
            const qrCode = await QRCode.toDataURL(secret.otpauth_url || '');

            return {
                secret: secret.base32,
                qrCode,
                message: 'Scan the QR code with your authenticator app, then verify with a code.',
            };
        } else {
            // SMS-based 2FA
            const userResult = await query(`SELECT phone FROM users WHERE id = $1`, [userId]);
            if (userResult.rows.length === 0) {
                throw new NotFoundError('User not found');
            }

            const phone = userResult.rows[0].phone;
            await this.generateAndSendOtp(phone, null, 'two_factor_setup');

            return {
                message: 'OTP sent to your registered phone number.',
            };
        }
    }

    /**
     * Verify and enable 2FA
     */
    async verify2FA(userId: string, code: string): Promise<{ verified: boolean; backupCodes?: string[] }> {
        const result = await query(
            `SELECT id, method, secret_encrypted FROM two_factor_auth 
       WHERE user_id = $1 AND is_verified = FALSE`,
            [userId]
        );

        if (result.rows.length === 0) {
            throw new BadRequestError('No pending 2FA setup found');
        }

        const twoFa = result.rows[0];

        if (twoFa.method === TwoFactorMethod.TOTP) {
            const secret = decrypt(twoFa.secret_encrypted);

            const isValid = speakeasy.totp.verify({
                secret,
                encoding: 'base32',
                token: code,
                window: 1, // Allow 1 period before/after
            });

            if (!isValid) {
                throw new InvalidOtpError('Invalid 2FA code');
            }
        } else {
            // For SMS, verify OTP
            const userResult = await query(`SELECT phone FROM users WHERE id = $1`, [userId]);
            await this.verifyOtp({
                identifier: userResult.rows[0].phone,
                code,
                purpose: 'two_factor_setup',
            });
        }

        // Enable 2FA
        await query(
            `UPDATE two_factor_auth SET is_verified = TRUE WHERE id = $1`,
            [twoFa.id]
        );

        await query(
            `UPDATE users SET is_2fa_enabled = TRUE WHERE id = $1`,
            [userId]
        );

        // Generate backup codes
        const backupCodes = Array.from({ length: 10 }, () =>
            generateSecureToken(4).toUpperCase()
        );

        // Store hashed backup codes (TODO: implement backup codes table)

        logger.info(`2FA enabled for user: ${userId}`);

        return { verified: true, backupCodes };
    }

    /**
     * Verify 2FA code for login/sensitive operations
     */
    async verify2FACode(userId: string, code: string): Promise<string> {
        const result = await query(
            `SELECT method, secret_encrypted FROM two_factor_auth 
       WHERE user_id = $1 AND is_verified = TRUE`,
            [userId]
        );

        if (result.rows.length === 0) {
            throw new BadRequestError('2FA not enabled for this user');
        }

        const twoFa = result.rows[0];

        if (twoFa.method === TwoFactorMethod.TOTP) {
            const secret = decrypt(twoFa.secret_encrypted);

            const isValid = speakeasy.totp.verify({
                secret,
                encoding: 'base32',
                token: code,
                window: 1,
            });

            if (!isValid) {
                throw new InvalidOtpError('Invalid 2FA code');
            }
        }

        // Generate a temporary verification token
        const verificationToken = generateUuid();
        await sessionStore.set(`2fa:verified:${userId}:${verificationToken}`, 'true', 300); // 5 minutes

        return verificationToken;
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

        const isValid = await bcrypt.compare(input.current_password, userResult.rows[0].password_hash);
        if (!isValid) {
            throw new BadRequestError('Current password is incorrect');
        }

        const newPasswordHash = await bcrypt.hash(input.new_password, SALT_ROUNDS);

        await query(
            `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
            [newPasswordHash, userId]
        );

        // Invalidate all sessions
        await this.logoutAll(userId);

        logger.info(`Password changed for user: ${userId}`);
    }
}

export const authService = new AuthService();
