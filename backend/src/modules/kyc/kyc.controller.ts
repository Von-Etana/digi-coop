import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import { kycService } from './kyc.service';
import { sendSuccess } from '../../middleware/validator';

export class KycController {
    /**
     * POST /api/v1/kyc/verify-bvn
     */
    async verifyBvn(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }

            const { bvn } = req.body;
            const result = await kycService.verifyBvn(req.user.id, bvn);
            sendSuccess(res, result, 'BVN verification processed');
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/v1/kyc/verify-nin
     */
    async verifyNin(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }

            const { nin } = req.body;
            const result = await kycService.verifyNin(req.user.id, nin);
            sendSuccess(res, result, 'NIN verification processed');
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/v1/kyc/status
     */
    async getStatus(
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            if (!req.user) {
                throw new Error('User not authenticated');
            }

            const status = await kycService.getKycStatus(req.user.id);
            sendSuccess(res, status, 'KYC status retrieved');
        } catch (error) {
            next(error);
        }
    }
}

export const kycController = new KycController();
