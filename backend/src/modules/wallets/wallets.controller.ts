import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import { walletsService } from './wallets.service';
import { sendSuccess, sendPaginated } from '../../middleware/validator';
import { TransferInput, TransactionQueryInput } from './wallets.validation';

export class WalletsController {
    /**
     * GET /api/v1/wallets
     * Get user's wallet details
     */
    async getWallet(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const wallet = await walletsService.getWallet(req.user.id);

            sendSuccess(res, {
                account_number: wallet.account_number,
                available_balance: wallet.available_balance,
                ledger_balance: wallet.ledger_balance,
                currency: wallet.currency,
                is_active: wallet.is_active,
            }, 'Wallet retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/wallets/balance
     * Get wallet balance only
     */
    async getBalance(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const balance = await walletsService.getBalance(req.user.id);
            sendSuccess(res, balance, 'Balance retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/wallets/transfer
     * Transfer to another wallet
     */
    async transfer(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const input: TransferInput = req.body;
            const idempotencyKey = req.headers['x-idempotency-key'] as string;

            const result = await walletsService.transfer(req.user.id, input, idempotencyKey);

            sendSuccess(res, {
                transaction_id: result.transaction.id,
                reference: result.transaction.reference,
                amount: result.transaction.amount,
                fee: result.fee,
                status: result.transaction.status,
            }, 'Transfer successful');
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/wallets/transactions
     * Get transaction history
     */
    async getTransactions(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const filters: TransactionQueryInput = req.query as unknown as TransactionQueryInput;
            const { transactions, total } = await walletsService.getTransactions(req.user.id, filters);

            sendPaginated(res, transactions, {
                page: filters.page || 1,
                limit: filters.limit || 20,
                total,
            }, 'Transactions retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/wallets/transactions/:id
     * Get single transaction
     */
    async getTransaction(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const transaction = await walletsService.getTransactionById(req.user.id, req.params.id);
            sendSuccess(res, transaction, 'Transaction retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/wallets/ledger
     * Get ledger entries
     */
    async getLedgerEntries(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const limit = parseInt(req.query.limit as string) || 50;
            const entries = await walletsService.getLedgerEntries(req.user.id, limit);

            sendSuccess(res, entries, 'Ledger entries retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/wallets/lookup
     * Lookup account by account number
     */
    async lookupAccount(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const { account_number } = req.body;
            const wallet = await walletsService.getWalletByAccountNumber(account_number);

            if (!wallet) {
                sendSuccess(res, null, 'Account not found', 404);
                return;
            }

            // Return limited info for privacy
            sendSuccess(res, {
                account_number: wallet.account_number,
                is_valid: true,
            }, 'Account found');
        } catch (error) {
            next(error);
        }
    }
}

export const walletsController = new WalletsController();
