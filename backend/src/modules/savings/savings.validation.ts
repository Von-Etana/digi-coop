import { z } from 'zod';
import { SavingsType } from '../../types';

// ============= Savings Schemas =============

export const createSavingsPlanSchema = z.object({
    type: z.nativeEnum(SavingsType),
    target_amount: z.number().positive().optional(),
    lock_duration_days: z.number().int().min(0).optional(),
    auto_save_amount: z.number().positive().optional(),
    auto_save_frequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
});

export type CreateSavingsPlanInput = z.infer<typeof createSavingsPlanSchema>;

export const depositSavingsSchema = z.object({
    amount: z.number().positive('Deposit amount must be positive'),
});

export type DepositSavingsInput = z.infer<typeof depositSavingsSchema>;

export const withdrawSavingsSchema = z.object({
    amount: z.number().positive('Withdrawal amount must be positive'),
    reason: z.string().optional(),
});

export type WithdrawSavingsInput = z.infer<typeof withdrawSavingsSchema>;
