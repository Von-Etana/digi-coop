import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import { loansService } from './loans.service';
import { sendSuccess, sendPaginated } from '../../middleware/validator';
import {
    ApplyLoanInput,
    LoanDecisionInput,
    LoanQueryInput
} from './loans.validation';

export class LoansController {
    /**
     * GET /api/v1/loans/eligibility
     */
    async checkEligibility(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const eligibility = await loansService.checkEligibility(req.user.id);
            sendSuccess(res, eligibility, 'Eligibility checked successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/loans/apply
     */
    async apply(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const input: ApplyLoanInput = req.body;
            const loan = await loansService.applyForLoan(req.user.id, input);

            sendSuccess(res, loan, 'Loan application submitted successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/loans (My Loans)
     */
    async getMyLoans(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const filters: LoanQueryInput = req.query as unknown as LoanQueryInput;
            const { loans, total } = await loansService.getLoans(req.user.id, filters);

            sendPaginated(res, loans, {
                page: filters.page || 1,
                limit: filters.limit || 20,
                total,
            }, 'Loans retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/loans/:id
     */
    async getLoan(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const loan = await loansService.getLoanDetails(req.params.id);

            // Access check
            if (!req.user.roles.includes('admin') && loan.user_id !== req.user.id) {
                throw new Error('Unauthorized'); // Basic check, better handled in service or middleware
            }

            sendSuccess(res, loan, 'Loan details retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    // ==================== ADMIN ====================

    /**
     * GET /api/v1/loans/admin/all
     */
    async getAllLoans(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const filters: LoanQueryInput = req.query as unknown as LoanQueryInput;
            const { loans, total } = await loansService.getLoans(null, filters);

            sendPaginated(res, loans, {
                page: filters.page || 1,
                limit: filters.limit || 20,
                total,
            }, 'Loans retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/loans/:id/decide
     */
    async processLoan(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const input: LoanDecisionInput = req.body;
            const loan = await loansService.processLoanApplication(req.user.id, req.params.id, input);

            sendSuccess(res, loan, 'Loan application processed successfully');
        } catch (error) {
            next(error);
        }
    }
}

export const loansController = new LoansController();
