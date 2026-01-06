import { z } from 'zod';

// ============= Loan Schemas =============

export const applyLoanSchema = z.object({
    amount: z.number().positive('Loan amount must be positive'),
    tenure_months: z.number().int().min(1).max(24, 'Tenure must be between 1 and 24 months'),
    purpose: z.string().min(10, 'Purpose must be at least 10 characters').max(500),
});

export type ApplyLoanInput = z.infer<typeof applyLoanSchema>;

export const loanDecisionSchema = z.object({
    status: z.enum(['approved', 'rejected']),
    reason: z.string().optional(), // For rejection
});

export type LoanDecisionInput = z.infer<typeof loanDecisionSchema>;

export const repaymentSchema = z.object({
    amount: z.number().positive('Repayment amount must be positive'),
});

export type RepaymentInput = z.infer<typeof repaymentSchema>;

export const loanQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(50).default(20),
    status: z.enum(['pending', 'approved', 'active', 'repaying', 'completed', 'rejected', 'all']).default('all'),
});

export type LoanQueryInput = z.infer<typeof loanQuerySchema>;
