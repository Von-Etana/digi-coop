import { Router } from 'express';
import { loansController } from './loans.controller';
import { authenticate, requireRole, require2FA } from '../../middleware/auth';
import { validateBody, validateQuery } from '../../middleware/validator';
import { idempotency } from '../../middleware/idempotency';
import { transactionRateLimiter } from '../../middleware/rateLimiter';
import {
    applyLoanSchema,
    loanDecisionSchema,
    loanQuerySchema
} from './loans.validation';

const router = Router();

// ==================== USER ROUTES ====================

/**
 * @route   GET /api/v1/loans/eligibility
 * @desc    Check loan eligibility
 * @access  Private
 */
router.get(
    '/eligibility',
    authenticate,
    loansController.checkEligibility.bind(loansController)
);

/**
 * @route   POST /api/v1/loans/apply
 * @desc    Apply for a loan
 * @access  Private (2FA required)
 */
router.post(
    '/apply',
    authenticate,
    require2FA,
    transactionRateLimiter,
    validateBody(applyLoanSchema),
    idempotency(['/apply']),
    loansController.apply.bind(loansController)
);

/**
 * @route   GET /api/v1/loans
 * @desc    Get my loans
 * @access  Private
 */
router.get(
    '/',
    authenticate,
    validateQuery(loanQuerySchema),
    loansController.getMyLoans.bind(loansController)
);

/**
 * @route   GET /api/v1/loans/:id
 * @desc    Get loan details
 * @access  Private
 */
router.get(
    '/:id',
    authenticate,
    loansController.getLoan.bind(loansController)
);

// ==================== ADMIN ROUTES ====================

/**
 * @route   GET /api/v1/loans/admin/all
 * @desc    Get all loans
 * @access  Admin only
 */
router.get(
    '/admin/all',
    authenticate,
    requireRole('admin'),
    validateQuery(loanQuerySchema),
    loansController.getAllLoans.bind(loansController)
);

/**
 * @route   POST /api/v1/loans/:id/decide
 * @desc    Approve or reject loan
 * @access  Admin only
 */
router.post(
    '/:id/decide',
    authenticate,
    requireRole('admin'),
    validateBody(loanDecisionSchema),
    loansController.processLoan.bind(loansController)
);

export default router;
