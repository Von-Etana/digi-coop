import { z } from 'zod';

// ============= User Schemas =============

export const updateProfileSchema = z.object({
    first_name: z.string().min(2).max(100).optional(),
    last_name: z.string().min(2).max(100).optional(),
    phone: z.string().regex(/^\+234\d{10}$/, 'Invalid phone number format (e.g., +2348012345678)').optional(),
    notification_preferences: z.object({
        email: z.boolean().optional(),
        sms: z.boolean().optional(),
        push: z.boolean().optional(),
    }).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z.string().min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
}).refine((data) => data.current_password !== data.new_password, {
    message: "New password must be different from current password",
    path: ["new_password"],
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ============= Admin Schemas =============

export const adminUpdateUserSchema = z.object({
    status: z.enum(['pending', 'verified', 'suspended']).optional(),
    role: z.enum(['user', 'admin', 'super_admin']).optional(),
});

export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;

export const userQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(20),
    search: z.string().optional(),
    status: z.enum(['pending', 'verified', 'suspended', 'all']).default('all'),
});

export type UserQueryInput = z.infer<typeof userQuerySchema>;
