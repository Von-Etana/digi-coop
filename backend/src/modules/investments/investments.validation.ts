import { z } from 'zod';

// ============= Investment Project Schemas =============

export const createProjectSchema = z.object({
    title: z.string().min(3).max(200),
    description: z.string().max(5000).optional(),
    banner_url: z.string().url().optional(),
    banner_type: z.enum(['image', 'video']).default('image'),
    target_amount: z.number().positive('Target amount must be positive'),
    min_investment: z.number().positive('Minimum investment must be positive'),
    max_investment: z.number().positive().optional(),
    expected_roi: z.number().min(0).max(100, 'ROI must be between 0 and 100%'),
    duration_months: z.number().int().positive('Duration must be at least 1 month'),
    end_date: z.string().datetime(),
    risk_level: z.enum(['low', 'medium', 'high']).default('medium'),
    category: z.string().max(100).optional(),
    is_published: z.boolean().default(false),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = createProjectSchema.partial();

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

// ============= Investment Schema =============

export const investSchema = z.object({
    amount: z.number().positive('Investment amount must be positive'),
});

export type InvestInput = z.infer<typeof investSchema>;

// ============= Query Schema =============

export const investmentQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(10),
    status: z.enum(['open', 'funded', 'matured', 'all']).default('open'),
    risk_level: z.enum(['low', 'medium', 'high']).optional(),
});

export type InvestmentQueryInput = z.infer<typeof investmentQuerySchema>;
