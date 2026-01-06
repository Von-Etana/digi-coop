import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import { savingsService } from './savings.service';
import { sendSuccess } from '../../middleware/validator';
import {
    CreateSavingsPlanInput,
    DepositSavingsInput,
    WithdrawSavingsInput
} from './savings.validation';

export class SavingsController {
    /**
     * GET /api/v1/savings
     */
    async getSavings(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const accounts = await savingsService.getUserSavings(req.user.id);
            sendSuccess(res, accounts, 'Savings accounts retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/savings/:id
     */
    async getSavingsAccount(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const account = await savingsService.getSavingsAccount(req.user.id, req.params.id);
            sendSuccess(res, account, 'Savings account retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/savings
     */
    async createPlan(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const input: CreateSavingsPlanInput = req.body;
            const account = await savingsService.createSavingsPlan(req.user.id, input);

            sendSuccess(res, account, 'Savings plan created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/savings/:id/deposit
     */
    async deposit(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const input: DepositSavingsInput = req.body;
            const transaction = await savingsService.deposit(req.user.id, req.params.id, input);

            sendSuccess(res, transaction, 'Deposit successful', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/savings/:id/withdraw
     */
    async withdraw(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const input: WithdrawSavingsInput = req.body;
            const transaction = await savingsService.withdraw(req.user.id, req.params.id, input);

            sendSuccess(res, transaction, 'Withdrawal successful', 201);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/savings/:id/transactions
     */
    async getHistory(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) throw new Error('User not authenticated');

            const history = await savingsService.getHistory(req.user.id, req.params.id);
            sendSuccess(res, history, 'Transaction history retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}

export const savingsController = new SavingsController();
