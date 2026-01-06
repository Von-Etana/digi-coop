import { query, withTransaction } from '../../config/database';
import {
    Wallet,
    Transaction,
    LedgerEntry,
    TransactionType,
    TransactionStatus,
    EntryType
} from '../../types';
import {
    InsufficientFundsError,
    NotFoundError,
    BadRequestError
} from '../../utils/errors';
import { logger } from '../../utils/logger';
import {
    generateTransactionRef,
    generateUuid,
    formatCurrency
} from '../../utils/helpers';
import { FundWalletInput, WithdrawInput, TransferInput, TransactionQueryInput } from './wallets.validation';

export class WalletsService {
    /**
     * Get wallet by user ID
     */
    async getWallet(userId: string): Promise<Wallet> {
        const result = await query(
            `SELECT * FROM wallets WHERE user_id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            throw new NotFoundError('Wallet not found');
        }

        return result.rows[0] as Wallet;
    }

    /**
     * Get wallet by account number
     */
    async getWalletByAccountNumber(accountNumber: string): Promise<Wallet | null> {
        const result = await query(
            `SELECT * FROM wallets WHERE account_number = $1`,
            [accountNumber]
        );

        return result.rows[0] as Wallet || null;
    }

    /**
     * Get wallet balance
     */
    async getBalance(userId: string): Promise<{ available: number; ledger: number; currency: string }> {
        const wallet = await this.getWallet(userId);
        return {
            available: parseFloat(wallet.available_balance.toString()),
            ledger: parseFloat(wallet.ledger_balance.toString()),
            currency: wallet.currency,
        };
    }

    /**
     * Credit wallet (deposit, refund, investment return)
     */
    async creditWallet(
        walletId: string,
        amount: number,
        type: TransactionType,
        description: string,
        idempotencyKey?: string,
        metadata?: Record<string, unknown>
    ): Promise<Transaction> {
        const reference = generateTransactionRef('CR');
        const idemKey = idempotencyKey || generateUuid();

        return withTransaction(async (client) => {
            // Lock the wallet row for update
            const walletResult = await client.query(
                `SELECT * FROM wallets WHERE id = $1 FOR UPDATE`,
                [walletId]
            );

            if (walletResult.rows.length === 0) {
                throw new NotFoundError('Wallet not found');
            }

            const wallet = walletResult.rows[0];
            const newBalance = parseFloat(wallet.available_balance) + amount;

            // Create transaction
            const txResult = await client.query(
                `INSERT INTO transactions 
         (destination_wallet_id, idempotency_key, type, status, amount, reference, description, metadata, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         RETURNING *`,
                [walletId, idemKey, type, TransactionStatus.COMPLETED, amount, reference, description, metadata || {}]
            );

            const transaction = txResult.rows[0];

            // Create ledger entry
            await client.query(
                `INSERT INTO ledger_entries (wallet_id, transaction_id, entry_type, amount, balance_after, description)
         VALUES ($1, $2, $3, $4, $5, $6)`,
                [walletId, transaction.id, EntryType.CREDIT, amount, newBalance, description]
            );

            // Update wallet balance
            await client.query(
                `UPDATE wallets SET available_balance = $1, ledger_balance = $1, updated_at = NOW() WHERE id = $2`,
                [newBalance, walletId]
            );

            logger.info(`Wallet credited: ${formatCurrency(amount)}`, {
                walletId,
                transactionId: transaction.id,
                type
            });

            return transaction as Transaction;
        });
    }

    /**
     * Debit wallet (withdrawal, transfer, payment)
     */
    async debitWallet(
        walletId: string,
        amount: number,
        type: TransactionType,
        description: string,
        idempotencyKey?: string,
        metadata?: Record<string, unknown>
    ): Promise<Transaction> {
        const reference = generateTransactionRef('DR');
        const idemKey = idempotencyKey || generateUuid();

        return withTransaction(async (client) => {
            // Lock the wallet row for update
            const walletResult = await client.query(
                `SELECT * FROM wallets WHERE id = $1 FOR UPDATE`,
                [walletId]
            );

            if (walletResult.rows.length === 0) {
                throw new NotFoundError('Wallet not found');
            }

            const wallet = walletResult.rows[0];
            const currentBalance = parseFloat(wallet.available_balance);

            if (currentBalance < amount) {
                throw new InsufficientFundsError(
                    `Insufficient funds. Available: ${formatCurrency(currentBalance)}, Required: ${formatCurrency(amount)}`
                );
            }

            const newBalance = currentBalance - amount;

            // Create transaction
            const txResult = await client.query(
                `INSERT INTO transactions 
         (source_wallet_id, idempotency_key, type, status, amount, reference, description, metadata, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         RETURNING *`,
                [walletId, idemKey, type, TransactionStatus.COMPLETED, amount, reference, description, metadata || {}]
            );

            const transaction = txResult.rows[0];

            // Create ledger entry
            await client.query(
                `INSERT INTO ledger_entries (wallet_id, transaction_id, entry_type, amount, balance_after, description)
         VALUES ($1, $2, $3, $4, $5, $6)`,
                [walletId, transaction.id, EntryType.DEBIT, amount, newBalance, description]
            );

            // Update wallet balance
            await client.query(
                `UPDATE wallets SET available_balance = $1, ledger_balance = $1, updated_at = NOW() WHERE id = $2`,
                [newBalance, walletId]
            );

            logger.info(`Wallet debited: ${formatCurrency(amount)}`, {
                walletId,
                transactionId: transaction.id,
                type
            });

            return transaction as Transaction;
        });
    }

    /**
     * Transfer between wallets
     */
    async transfer(
        userId: string,
        input: TransferInput,
        idempotencyKey?: string
    ): Promise<{ transaction: Transaction; fee: number }> {
        const sourceWallet = await this.getWallet(userId);
        const destWallet = await this.getWalletByAccountNumber(input.recipient_account);

        if (!destWallet) {
            throw new NotFoundError('Recipient account not found');
        }

        if (sourceWallet.id === destWallet.id) {
            throw new BadRequestError('Cannot transfer to the same wallet');
        }

        const fee = 0; // No internal transfer fee
        const totalDebit = input.amount + fee;
        const reference = generateTransactionRef('TRF');
        const idemKey = idempotencyKey || generateUuid();

        return withTransaction(async (client) => {
            // Lock both wallets
            await client.query(
                `SELECT id FROM wallets WHERE id IN ($1, $2) ORDER BY id FOR UPDATE`,
                [sourceWallet.id, destWallet.id]
            );

            // Check balance
            const sourceResult = await client.query(
                `SELECT available_balance FROM wallets WHERE id = $1`,
                [sourceWallet.id]
            );
            const sourceBalance = parseFloat(sourceResult.rows[0].available_balance);

            if (sourceBalance < totalDebit) {
                throw new InsufficientFundsError();
            }

            // Debit source
            const newSourceBalance = sourceBalance - totalDebit;
            await client.query(
                `UPDATE wallets SET available_balance = $1, ledger_balance = $1, updated_at = NOW() WHERE id = $2`,
                [newSourceBalance, sourceWallet.id]
            );

            // Credit destination
            const destResult = await client.query(
                `SELECT available_balance FROM wallets WHERE id = $1`,
                [destWallet.id]
            );
            const destBalance = parseFloat(destResult.rows[0].available_balance);
            const newDestBalance = destBalance + input.amount;

            await client.query(
                `UPDATE wallets SET available_balance = $1, ledger_balance = $1, updated_at = NOW() WHERE id = $2`,
                [newDestBalance, destWallet.id]
            );

            // Create transaction record
            const txResult = await client.query(
                `INSERT INTO transactions 
         (source_wallet_id, destination_wallet_id, idempotency_key, type, status, amount, fee, reference, description, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
         RETURNING *`,
                [
                    sourceWallet.id,
                    destWallet.id,
                    idemKey,
                    TransactionType.TRANSFER,
                    TransactionStatus.COMPLETED,
                    input.amount,
                    fee,
                    reference,
                    input.narration || 'Transfer'
                ]
            );

            const transaction = txResult.rows[0];

            // Create ledger entries
            await client.query(
                `INSERT INTO ledger_entries (wallet_id, transaction_id, entry_type, amount, balance_after, description)
         VALUES ($1, $2, $3, $4, $5, $6)`,
                [sourceWallet.id, transaction.id, EntryType.DEBIT, input.amount, newSourceBalance, `Transfer to ${input.recipient_account}`]
            );

            await client.query(
                `INSERT INTO ledger_entries (wallet_id, transaction_id, entry_type, amount, balance_after, description)
         VALUES ($1, $2, $3, $4, $5, $6)`,
                [destWallet.id, transaction.id, EntryType.CREDIT, input.amount, newDestBalance, `Transfer from ${sourceWallet.account_number}`]
            );

            logger.info(`Transfer completed: ${formatCurrency(input.amount)}`, {
                from: sourceWallet.account_number,
                to: input.recipient_account,
                transactionId: transaction.id
            });

            return { transaction: transaction as Transaction, fee };
        });
    }

    /**
     * Get transaction history
     */
    async getTransactions(
        userId: string,
        filters: TransactionQueryInput
    ): Promise<{ transactions: Transaction[]; total: number }> {
        const wallet = await this.getWallet(userId);

        let whereClause = `(source_wallet_id = $1 OR destination_wallet_id = $1)`;
        const params: unknown[] = [wallet.id];
        let paramIndex = 2;

        if (filters.type) {
            whereClause += ` AND type = $${paramIndex}`;
            params.push(filters.type);
            paramIndex++;
        }

        if (filters.status) {
            whereClause += ` AND status = $${paramIndex}`;
            params.push(filters.status);
            paramIndex++;
        }

        if (filters.start_date) {
            whereClause += ` AND created_at >= $${paramIndex}`;
            params.push(filters.start_date);
            paramIndex++;
        }

        if (filters.end_date) {
            whereClause += ` AND created_at <= $${paramIndex}`;
            params.push(filters.end_date);
            paramIndex++;
        }

        // Get total count
        const countResult = await query(
            `SELECT COUNT(*) FROM transactions WHERE ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Get paginated results
        const offset = (filters.page - 1) * filters.limit;
        const result = await query(
            `SELECT * FROM transactions 
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, filters.limit, offset]
        );

        return {
            transactions: result.rows as Transaction[],
            total,
        };
    }

    /**
     * Get transaction by ID
     */
    async getTransactionById(userId: string, transactionId: string): Promise<Transaction> {
        const wallet = await this.getWallet(userId);

        const result = await query(
            `SELECT * FROM transactions 
       WHERE id = $1 AND (source_wallet_id = $2 OR destination_wallet_id = $2)`,
            [transactionId, wallet.id]
        );

        if (result.rows.length === 0) {
            throw new NotFoundError('Transaction not found');
        }

        return result.rows[0] as Transaction;
    }

    /**
     * Get ledger entries for a wallet
     */
    async getLedgerEntries(userId: string, limit: number = 50): Promise<LedgerEntry[]> {
        const wallet = await this.getWallet(userId);

        const result = await query(
            `SELECT * FROM ledger_entries 
       WHERE wallet_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
            [wallet.id, limit]
        );

        return result.rows as LedgerEntry[];
    }
}

export const walletsService = new WalletsService();
