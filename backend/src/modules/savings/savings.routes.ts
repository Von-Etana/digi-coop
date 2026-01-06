import { Router } from 'express';
import { savingsController } from './savings.controller';
import { authenticate, require2FA } from '../../middleware/auth';
import { validateBody } from '../../middleware/validator';
import { idempotency } from '../../middleware/idempotency';
import { transactionRateLimiter } from '../../middleware/rateLimiter';
import {
    createSavingsPlanSchema,
    depositSavingsSchema,
    withdrawSavingsSchema
} from './savings.validation';

const router = Router();

/**
 * @route   GET /api/v1/savings
 * @desc    Get all savings accounts
 * @access  Private
 */
router.get(
    '/',
    authenticate,
    savingsController.getSavings.bind(savingsController)
);

/**
 * @route   POST /api/v1/savings
 * @desc    Create new savings plan
 * @access  Private
 */
router.post(
    '/',
    authenticate,
    validateBody(createSavingsPlanSchema),
    savingsController.createPlan.bind(savingsController)
);

/**
 * @route   GET /api/v1/savings/:id
 * @desc    Get specific savings account
 * @access  Private
 */
router.get(
    '/:id',
    authenticate,
    savingsController.getSavingsAccount.bind(savingsController)
);

/**
 * @route   POST /api/v1/savings/:id/deposit
 * @desc    Deposit into savings
 * @access  Private
 */
router.post(
    '/:id/deposit',
    authenticate,
    transactionRateLimiter,
    validateBody(depositSavingsSchema),
    idempotency(['/deposit']),
    savingsController.deposit.bind(savingsController)
);

/**
 * @route   POST /api/v1/savings/:id/withdraw
 * @desc    Withdraw from savings (Requires 2FA)
 * @access  Private
 */
router.post(
    '/:id/withdraw',
    authenticate,
    require2FA,
    transactionRateLimiter,
    validateBody(withdrawSavingsSchema),
    idempotency(['/withdraw']),
    savingsController.withdraw.bind(savingsController)
);

/**
 * @route   GET /api/v1/savings/:id/transactions
 * @desc    Get transaction history
 * @access  Private
 */
router.get(
    '/:id/transactions',
    authenticate,
    savingsController.getHistory.bind(savingsController)
);

export default router;
