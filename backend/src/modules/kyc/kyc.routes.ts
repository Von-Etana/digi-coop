import { Router } from 'express';
import { z } from 'zod';
import { kycController } from './kyc.controller';
import { authenticate, requireVerified } from '../../middleware/auth';
import { validateBody } from '../../middleware/validator';
import { strictRateLimiter } from '../../middleware/rateLimiter';

const router = Router();

// Validation schemas
const bvnSchema = z.object({
    bvn: z.string().length(11, 'BVN must be 11 digits').regex(/^\d+$/, 'BVN must contain only digits'),
});

const ninSchema = z.object({
    nin: z.string().length(11, 'NIN must be 11 digits').regex(/^\d+$/, 'NIN must contain only digits'),
});

/**
 * @route   POST /api/v1/kyc/verify-bvn
 * @desc    Verify user's BVN
 * @access  Private
 */
router.post(
    '/verify-bvn',
    authenticate,
    strictRateLimiter,
    validateBody(bvnSchema),
    kycController.verifyBvn.bind(kycController)
);

/**
 * @route   POST /api/v1/kyc/verify-nin
 * @desc    Verify user's NIN
 * @access  Private
 */
router.post(
    '/verify-nin',
    authenticate,
    strictRateLimiter,
    validateBody(ninSchema),
    kycController.verifyNin.bind(kycController)
);

/**
 * @route   GET /api/v1/kyc/status
 * @desc    Get user's KYC verification status
 * @access  Private
 */
router.get(
    '/status',
    authenticate,
    kycController.getStatus.bind(kycController)
);

export default router;
