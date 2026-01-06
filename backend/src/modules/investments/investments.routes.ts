import { Router } from 'express';
import { investmentsController } from './investments.controller';
import { authenticate, require2FA, requireRole } from '../../middleware/auth';
import { validateBody, validateQuery } from '../../middleware/validator';
import { idempotency } from '../../middleware/idempotency';
import { transactionRateLimiter } from '../../middleware/rateLimiter';
import { auditLog, AuditActions } from '../../middleware/auditLog';
import {
    createProjectSchema,
    updateProjectSchema,
    investSchema,
    investmentQuerySchema
} from './investments.validation';

const router = Router();

// ==================== PROJECTS ====================

/**
 * @route   GET /api/v1/investments/projects
 * @desc    List all investment projects
 * @access  Private
 */
router.get(
    '/projects',
    authenticate,
    validateQuery(investmentQuerySchema),
    investmentsController.getProjects.bind(investmentsController)
);

/**
 * @route   GET /api/v1/investments/projects/:id
 * @desc    Get single project details
 * @access  Private
 */
router.get(
    '/projects/:id',
    authenticate,
    investmentsController.getProject.bind(investmentsController)
);

/**
 * @route   POST /api/v1/investments/projects
 * @desc    Create new investment project
 * @access  Admin only
 */
router.post(
    '/projects',
    authenticate,
    requireRole('admin'),
    validateBody(createProjectSchema),
    auditLog({ action: AuditActions.INVESTMENT_CREATED, entityType: 'investment_project' }),
    investmentsController.createProject.bind(investmentsController)
);

/**
 * @route   PUT /api/v1/investments/projects/:id
 * @desc    Update investment project
 * @access  Admin only
 */
router.put(
    '/projects/:id',
    authenticate,
    requireRole('admin'),
    validateBody(updateProjectSchema),
    auditLog({
        action: AuditActions.INVESTMENT_ROI_UPDATED,
        entityType: 'investment_project',
        getEntityId: (req) => req.params.id
    }),
    investmentsController.updateProject.bind(investmentsController)
);

/**
 * @route   GET /api/v1/investments/projects/:id/investors
 * @desc    Get project investors
 * @access  Admin only
 */
router.get(
    '/projects/:id/investors',
    authenticate,
    requireRole('admin'),
    investmentsController.getProjectInvestors.bind(investmentsController)
);

/**
 * @route   POST /api/v1/investments/projects/:id/invest
 * @desc    Invest in a project
 * @access  Private (2FA if enabled)
 */
router.post(
    '/projects/:id/invest',
    authenticate,
    require2FA,
    transactionRateLimiter,
    idempotency(['/invest']),
    validateBody(investSchema),
    investmentsController.invest.bind(investmentsController)
);

// ==================== USER INVESTMENTS ====================

/**
 * @route   GET /api/v1/investments/my-investments
 * @desc    Get user's investments
 * @access  Private
 */
router.get(
    '/my-investments',
    authenticate,
    investmentsController.getMyInvestments.bind(investmentsController)
);

/**
 * @route   GET /api/v1/investments/portfolio
 * @desc    Get user's portfolio summary
 * @access  Private
 */
router.get(
    '/portfolio',
    authenticate,
    investmentsController.getPortfolio.bind(investmentsController)
);

export default router;
