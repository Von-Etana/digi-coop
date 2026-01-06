import { z } from 'zod';

// Phone number validation (Nigerian format)
const nigerianPhoneRegex = /^(\+234|0)[789][01]\d{8}$/;

// Password requirements
const passwordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must not exceed 100 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// ============= Registration Schemas =============

export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    phone: z.string().regex(nigerianPhoneRegex, 'Invalid Nigerian phone number'),
    password: passwordSchema,
    confirm_password: z.string(),
    first_name: z.string().min(2, 'First name must be at least 2 characters').max(50),
    last_name: z.string().min(2, 'Last name must be at least 2 characters').max(50),
}).refine(data => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
});

export type RegisterInput = z.infer<typeof registerSchema>;

// ============= Login Schemas =============

export const loginSchema = z.object({
    identifier: z.string().min(1, 'Email or phone is required'),
    password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ============= OTP Verification =============

export const verifyOtpSchema = z.object({
    identifier: z.string().min(1, 'Email or phone is required'),
    code: z.string().length(6, 'OTP must be 6 digits'),
    purpose: z.enum(['registration', 'login', 'password_reset', 'withdrawal', 'two_factor_setup']),
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const requestOtpSchema = z.object({
    identifier: z.string().min(1, 'Email or phone is required'),
    purpose: z.enum(['registration', 'login', 'password_reset', 'withdrawal', 'two_factor_setup']),
});

export type RequestOtpInput = z.infer<typeof requestOtpSchema>;

// ============= Token Refresh =============

export const refreshTokenSchema = z.object({
    refresh_token: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

// ============= Password Reset =============

export const forgotPasswordSchema = z.object({
    email: z.string().email('Invalid email address'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: passwordSchema,
    confirm_password: z.string(),
}).refine(data => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ============= 2FA Schemas =============

export const setup2FASchema = z.object({
    method: z.enum(['totp', 'sms']),
});

export type Setup2FAInput = z.infer<typeof setup2FASchema>;

export const verify2FASchema = z.object({
    code: z.string().length(6, 'Code must be 6 digits'),
});

export type Verify2FAInput = z.infer<typeof verify2FASchema>;

// ============= Change Password =============

export const changePasswordSchema = z.object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: passwordSchema,
    confirm_password: z.string(),
}).refine(data => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
