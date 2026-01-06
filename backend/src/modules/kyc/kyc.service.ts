import { query } from '../../config/database';
import { config } from '../../config/index';
import { encrypt, decrypt } from '../../services/encryption';
import { VerificationStatus, UserStatus } from '../../types';
import { BadRequestError, NotFoundError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { isValidBvn, isValidNin, maskSensitive } from '../../utils/helpers';

interface BvnVerificationResponse {
    success: boolean;
    data?: {
        first_name: string;
        last_name: string;
        date_of_birth: string;
        phone_number: string;
        bvn: string;
    };
    error?: string;
}

interface NinVerificationResponse {
    success: boolean;
    data?: {
        first_name: string;
        last_name: string;
        date_of_birth: string;
        nin: string;
    };
    error?: string;
}

export class KycService {
    /**
     * Verify BVN using SmileID (or placeholder)
     */
    async verifyBvn(userId: string, bvn: string): Promise<{ verified: boolean; message: string }> {
        if (!isValidBvn(bvn)) {
            throw new BadRequestError('Invalid BVN format. BVN must be 11 digits.');
        }

        // Check if user exists
        const userResult = await query(
            `SELECT u.id, u.first_name, u.last_name, k.id as kyc_id, k.verification_status
       FROM users u
       LEFT JOIN kyc_records k ON u.id = k.user_id
       WHERE u.id = $1`,
            [userId]
        );

        if (userResult.rows.length === 0) {
            throw new NotFoundError('User not found');
        }

        const user = userResult.rows[0];

        if (user.verification_status === VerificationStatus.VERIFIED) {
            return { verified: true, message: 'BVN already verified' };
        }

        // Call SmileID API (placeholder implementation)
        const verificationResult = await this.callSmileIdBvnVerification(bvn);

        if (!verificationResult.success) {
            // Update KYC record with failed status
            await query(
                `UPDATE kyc_records 
         SET verification_status = $1, verification_response = $2
         WHERE user_id = $3`,
                [VerificationStatus.FAILED, JSON.stringify({ error: verificationResult.error }), userId]
            );

            throw new BadRequestError(verificationResult.error || 'BVN verification failed');
        }

        // Validate that the BVN data matches user's registered info
        const bvnData = verificationResult.data!;
        const nameMatch = this.compareNames(
            { firstName: user.first_name, lastName: user.last_name },
            { firstName: bvnData.first_name, lastName: bvnData.last_name }
        );

        if (!nameMatch) {
            await query(
                `UPDATE kyc_records 
         SET verification_status = $1, verification_response = $2
         WHERE user_id = $3`,
                [VerificationStatus.FAILED, JSON.stringify({ error: 'Name mismatch' }), userId]
            );

            throw new BadRequestError('BVN name does not match registered name');
        }

        // Encrypt and store BVN
        const encryptedBvn = encrypt(bvn);

        await query(
            `UPDATE kyc_records 
       SET bvn_encrypted = $1, 
           verification_status = $2, 
           verification_response = $3,
           verified_at = NOW()
       WHERE user_id = $4`,
            [encryptedBvn, VerificationStatus.VERIFIED, JSON.stringify(verificationResult.data), userId]
        );

        // Update user status to verified
        await query(
            `UPDATE users SET status = $1 WHERE id = $2`,
            [UserStatus.VERIFIED, userId]
        );

        logger.info(`BVN verified for user: ${userId}`, { maskedBvn: maskSensitive(bvn) });

        return { verified: true, message: 'BVN verified successfully' };
    }

    /**
     * Verify NIN
     */
    async verifyNin(userId: string, nin: string): Promise<{ verified: boolean; message: string }> {
        if (!isValidNin(nin)) {
            throw new BadRequestError('Invalid NIN format. NIN must be 11 digits.');
        }

        // Similar to BVN verification
        const verificationResult = await this.callSmileIdNinVerification(nin);

        if (!verificationResult.success) {
            throw new BadRequestError(verificationResult.error || 'NIN verification failed');
        }

        // Encrypt and store NIN
        const encryptedNin = encrypt(nin);

        await query(
            `UPDATE kyc_records SET nin_encrypted = $1 WHERE user_id = $2`,
            [encryptedNin, userId]
        );

        logger.info(`NIN verified for user: ${userId}`, { maskedNin: maskSensitive(nin) });

        return { verified: true, message: 'NIN verified successfully' };
    }

    /**
     * Get KYC status for a user
     */
    async getKycStatus(userId: string): Promise<{
        bvn_verified: boolean;
        nin_verified: boolean;
        verification_status: VerificationStatus;
        verified_at: Date | null;
    }> {
        const result = await query(
            `SELECT bvn_encrypted, nin_encrypted, verification_status, verified_at
       FROM kyc_records WHERE user_id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return {
                bvn_verified: false,
                nin_verified: false,
                verification_status: VerificationStatus.PENDING,
                verified_at: null,
            };
        }

        const kyc = result.rows[0];

        return {
            bvn_verified: !!kyc.bvn_encrypted,
            nin_verified: !!kyc.nin_encrypted,
            verification_status: kyc.verification_status,
            verified_at: kyc.verified_at,
        };
    }

    /**
     * SmileID BVN verification API call (placeholder)
     * In production, replace with actual SmileID API integration
     */
    private async callSmileIdBvnVerification(bvn: string): Promise<BvnVerificationResponse> {
        // Check if SmileID is configured
        if (!config.smileId.apiKey || !config.smileId.partnerId) {
            // Placeholder: Accept any valid BVN format for development
            logger.warn('SmileID not configured. Using placeholder verification.');

            return {
                success: true,
                data: {
                    first_name: 'PLACEHOLDER',
                    last_name: 'USER',
                    date_of_birth: '1990-01-01',
                    phone_number: '+2348000000000',
                    bvn: bvn,
                },
            };
        }

        try {
            // TODO: Implement actual SmileID API call
            // const response = await fetch(`${config.smileId.baseUrl}/v1/bvn`, {
            //   method: 'POST',
            //   headers: {
            //     'Authorization': `Bearer ${config.smileId.apiKey}`,
            //     'Content-Type': 'application/json',
            //   },
            //   body: JSON.stringify({
            //     partner_id: config.smileId.partnerId,
            //     bvn: bvn,
            //   }),
            // });
            // 
            // const data = await response.json();
            // return { success: data.success, data: data.result };

            // Placeholder response
            return {
                success: true,
                data: {
                    first_name: 'VERIFIED',
                    last_name: 'USER',
                    date_of_birth: '1990-01-01',
                    phone_number: '+2348000000000',
                    bvn: bvn,
                },
            };
        } catch (error) {
            logger.error('SmileID BVN verification error:', error);
            return {
                success: false,
                error: 'Verification service unavailable',
            };
        }
    }

    /**
     * SmileID NIN verification API call (placeholder)
     */
    private async callSmileIdNinVerification(nin: string): Promise<NinVerificationResponse> {
        if (!config.smileId.apiKey) {
            logger.warn('SmileID not configured. Using placeholder verification.');

            return {
                success: true,
                data: {
                    first_name: 'PLACEHOLDER',
                    last_name: 'USER',
                    date_of_birth: '1990-01-01',
                    nin: nin,
                },
            };
        }

        // TODO: Implement actual SmileID NIN verification
        return {
            success: true,
            data: {
                first_name: 'VERIFIED',
                last_name: 'USER',
                date_of_birth: '1990-01-01',
                nin: nin,
            },
        };
    }

    /**
     * Compare names with fuzzy matching
     */
    private compareNames(
        registered: { firstName: string; lastName: string },
        verified: { firstName: string; lastName: string }
    ): boolean {
        const normalize = (name: string) => name.toLowerCase().trim();

        // For placeholder, always return true
        if (verified.firstName === 'PLACEHOLDER' || verified.firstName === 'VERIFIED') {
            return true;
        }

        const registeredFirst = normalize(registered.firstName);
        const registeredLast = normalize(registered.lastName);
        const verifiedFirst = normalize(verified.firstName);
        const verifiedLast = normalize(verified.lastName);

        // Check for exact match or swapped names
        return (
            (registeredFirst === verifiedFirst && registeredLast === verifiedLast) ||
            (registeredFirst === verifiedLast && registeredLast === verifiedFirst)
        );
    }
}

export const kycService = new KycService();
