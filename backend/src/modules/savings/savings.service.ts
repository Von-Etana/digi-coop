import { query, withTransaction } from '../../config/database';
import { walletsService } from '../wallets/wallets.service';
import {
    SavingsAccount,
    SavingsType,
    TransactionType,
    SavingsTransaction,
    SavingsTransactionType
} from '../../types';
import {
    NotFoundError,
    BadRequestError,
    InsufficientFundsError
} from '../../utils/errors';
import { logger } from '../../utils/logger';
import { formatCurrency } from '../../utils/helpers';
import {
    CreateSavingsPlanInput,
    DepositSavingsInput,
    WithdrawSavingsInput
} from './savings.validation';

export class SavingsService {
    /**
     * Get user's savings accounts
     */
    async getUserSavings(userId: string): Promise<SavingsAccount[]> {
        const result = await query(
            `SELECT * FROM savings_accounts WHERE user_id = $1`,
            [userId]
        );
        return result.rows as SavingsAccount[];
    }

    /**
     * Get specific savings account
     */
    async getSavingsAccount(userId: string, accountId: string): Promise<SavingsAccount> {
        const result = await query(
            `SELECT * FROM savings_accounts WHERE id = $1 AND user_id = $2`,
            [accountId, userId]
        );

        if (result.rows.length === 0) {
            throw new NotFoundError('Savings account not found');
        }

        return result.rows[0] as SavingsAccount;
    }

    /**
     * Create a new savings plan
     */
    async createSavingsPlan(userId: string, input: CreateSavingsPlanInput): Promise<SavingsAccount> {
        // Check if user already has this type of savings (e.g. only one compulsory allowed)
        if (input.type === SavingsType.COMPULSORY) {
            const existing = await query(
                `SELECT id FROM savings_accounts WHERE user_id = $1 AND type = $2`,
                [userId, SavingsType.COMPULSORY]
            );
            if (existing.rows.length > 0) {
                throw new BadRequestError('You already have a Compulsory Savings account');
            }
        }

        let lockUntil: Date | null = null;
        if (input.lock_duration_days) {
            lockUntil = new Date();
            lockUntil.setDate(lockUntil.getDate() + input.lock_duration_days);
        }

        const result = await query(
            `INSERT INTO savings_accounts 
       (user_id, type, balance, target_amount, lock_until, is_locked)
       VALUES ($1, $2, 0, $3, $4, $5)
       RETURNING *`,
            [
                userId,
                input.type,
                input.target_amount,
                lockUntil,
                !!input.lock_duration_days
            ]
        );

        logger.info(`Savings account created for user ${userId}`, { type: input.type });
        return result.rows[0] as SavingsAccount;
    }

    /**
     * Deposit into savings (Debit Wallet -> Credit Savings)
     */
    async deposit(userId: string, accountId: string, input: DepositSavingsInput): Promise<SavingsTransaction> {
        const savings = await this.getSavingsAccount(userId, accountId);

        // Get user's wallet
        const wallet = await walletsService.getWallet(userId);

        if (wallet.available_balance < input.amount) {
            throw new InsufficientFundsError();
        }

        return withTransaction(async (client) => {
            // 1. Debit wallet
            const transaction = await walletsService.debitWallet(
                wallet.id,
                input.amount,
                TransactionType.TRANSFER, // Using Transfer type for internal movement
                `Deposit to ${savings.type} savings`,
                undefined,
                { savings_account_id: accountId }
            );

            // 2. Credit savings account
            const updatedSavings = await client.query(
                `UPDATE savings_accounts 
         SET balance = balance + $1, updated_at = NOW()
         WHERE id = $2
         RETURNING balance`,
                [input.amount, accountId]
            );

            // 3. Create savings transaction record
            const savingsTxn = await client.query(
                `INSERT INTO savings_transactions 
         (savings_account_id, transaction_id, type, amount)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
                [accountId, transaction.id, SavingsTransactionType.DEPOSIT, input.amount]
            );

            logger.info(`Savings deposit: ${formatCurrency(input.amount)}`, {
                userId,
                savingsId: accountId,
                newBalance: updatedSavings.rows[0].balance
            });

            return savingsTxn.rows[0] as SavingsTransaction;
        });
    }

    /**
     * Withdraw from savings (Debit Savings -> Credit Wallet)
     */
    async withdraw(userId: string, accountId: string, input: WithdrawSavingsInput): Promise<SavingsTransaction> {
        const savings = await this.getSavingsAccount(userId, accountId);

        if (savings.balance < input.amount) {
            throw new InsufficientFundsError('Insufficient savings balance');
        }

        if (savings.is_locked && savings.lock_until && new Date(savings.lock_until) > new Date()) {
            throw new BadRequestError(`Savings are locked until ${new Date(savings.lock_until).toLocaleDateString()}`);
        }

        // Compulsory savings restrictions often strictly limit withdrawals
        if (savings.type === SavingsType.COMPULSORY) {
            // Example rule: Can't withdraw unless leaving membership or special approval
            // For now, allow but maybe warn or require 'reason'. 
            // In a real coop, specific rules apply.
        }

        const wallet = await walletsService.getWallet(userId);

        return withTransaction(async (client) => {
            // 1. Debit savings account
            const updatedSavings = await client.query(
                `UPDATE savings_accounts 
         SET balance = balance - $1, updated_at = NOW()
         WHERE id = $2 AND balance >= $1
         RETURNING balance`,
                [input.amount, accountId]
            );

            if (updatedSavings.rows.length === 0) {
                throw new InsufficientFundsError(); // Race condition check
            }

            // 2. Credit wallet
            const transaction = await walletsService.creditWallet(
                wallet.id,
                input.amount,
                TransactionType.TRANSFER,
                `Withdrawal from ${savings.type} savings`,
                undefined,
                { savings_account_id: accountId, reason: input.reason }
            );

            // 3. Create savings transaction record
            const savingsTxn = await client.query(
                `INSERT INTO savings_transactions 
         (savings_account_id, transaction_id, type, amount)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
                [accountId, transaction.id, SavingsTransactionType.WITHDRAWAL, input.amount]
            );

            logger.info(`Savings withdrawal: ${formatCurrency(input.amount)}`, {
                userId,
                savingsId: accountId,
                remainingBalance: updatedSavings.rows[0].balance
            });

            return savingsTxn.rows[0] as SavingsTransaction;
        });
    }

    /**
     * Get transaction history for a savings account
     */
    async getHistory(userId: string, accountId: string): Promise<SavingsTransaction[]> {
        // Verify ownership first
        await this.getSavingsAccount(userId, accountId);

        const result = await query(
            `SELECT * FROM savings_transactions 
       WHERE savings_account_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
            [accountId]
        );

        return result.rows as SavingsTransaction[];
    }
}

export const savingsService = new SavingsService();
