import { Router } from 'express';
import { walletsController } from './wallets.controller';
import { authenticate, require2FA } from '../../middleware/auth';
import { validateBody, validateQuery } from '../../middleware/validator';
import { idempotency } from '../../middleware/idempotency';
import { transactionRateLimiter } from '../../middleware/rateLimiter';
import { transferSchema, transactionQuerySchema } from './wallets.validation';
import { z } from 'zod';

const router = Router();

/**
 * @route   GET /api/v1/wallets
 * @desc    Get user's wallet details
 * @access  Private
 */
router.get(
    '/',
    authenticate,
    walletsController.getWallet.bind(walletsController)
);

/**
 * @route   GET /api/v1/wallets/balance
 * @desc    Get wallet balance
 * @access  Private
 */
router.get(
    '/balance',
    authenticate,
    walletsController.getBalance.bind(walletsController)
);

/**
 * @route   POST /api/v1/wallets/transfer
 * @desc    Transfer to another wallet
 * @access  Private (2FA required)
 */
router.post(
    '/transfer',
    authenticate,
    require2FA,
    transactionRateLimiter,
    idempotency(['/transfer']),
    validateBody(transferSchema),
    walletsController.transfer.bind(walletsController)
);

/**
 * @route   GET /api/v1/wallets/transactions
 * @desc    Get transaction history with filters
 * @access  Private
 */
router.get(
    '/transactions',
    authenticate,
    validateQuery(transactionQuerySchema),
    walletsController.getTransactions.bind(walletsController)
);

/**
 * @route   GET /api/v1/wallets/transactions/:id
 * @desc    Get single transaction details
 * @access  Private
 */
router.get(
    '/transactions/:id',
    authenticate,
    walletsController.getTransaction.bind(walletsController)
);

/**
 * @route   GET /api/v1/wallets/ledger
 * @desc    Get ledger entries
 * @access  Private
 */
router.get(
    '/ledger',
    authenticate,
    walletsController.getLedgerEntries.bind(walletsController)
);

/**
 * @route   POST /api/v1/wallets/lookup
 * @desc    Lookup account by account number
 * @access  Private
 */
router.post(
    '/lookup',
    authenticate,
    validateBody(z.object({ account_number: z.string().length(10) })),
    walletsController.lookupAccount.bind(walletsController)
);

export default router;
