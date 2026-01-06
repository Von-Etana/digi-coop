import { z } from 'zod';

// ============= Wallet Schemas =============

export const getWalletSchema = z.object({});

export const fundWalletSchema = z.object({
    amount: z.number().positive('Amount must be positive'),
    payment_method: z.enum(['card', 'bank_transfer', 'ussd']),
    idempotency_key: z.string().uuid().optional(),
});

export type FundWalletInput = z.infer<typeof fundWalletSchema>;

export const withdrawSchema = z.object({
    amount: z.number().positive('Amount must be positive'),
    bank_code: z.string().min(3, 'Bank code is required'),
    account_number: z.string().length(10, 'Account number must be 10 digits'),
    account_name: z.string().optional(),
    narration: z.string().max(100).optional(),
});

export type WithdrawInput = z.infer<typeof withdrawSchema>;

export const transferSchema = z.object({
    recipient_account: z.string().min(1, 'Recipient account is required'),
    amount: z.number().positive('Amount must be positive'),
    narration: z.string().max(100).optional(),
});

export type TransferInput = z.infer<typeof transferSchema>;

// ============= Transaction Query Schemas =============

export const transactionQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    type: z.enum(['deposit', 'withdrawal', 'transfer', 'fee', 'refund', 'group_buy', 'investment']).optional(),
    status: z.enum(['pending', 'completed', 'failed', 'reversed']).optional(),
    start_date: z.string().datetime().optional(),
    end_date: z.string().datetime().optional(),
});

export type TransactionQueryInput = z.infer<typeof transactionQuerySchema>;
