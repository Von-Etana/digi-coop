import cron, { ScheduledTask } from 'node-cron';
import { logger } from '../utils/logger';
import { groupBuyingService } from '../modules/group-buying/group-buying.service';
import { investmentsService } from '../modules/investments/investments.service';

/**
 * Scheduler service for processing time-based tasks
 */
export class SchedulerService {
    private jobs: ScheduledTask[] = [];

    /**
     * Start all scheduled jobs
     */
    start(): void {
        logger.info('Starting scheduler service...');

        // Process group buy deadlines every hour
        const groupBuyJob = cron.schedule('0 * * * *', async () => {
            logger.info('Running group buy deadline check...');
            try {
                await groupBuyingService.processDeadlineItems();
                logger.info('Group buy deadline check completed');
            } catch (error) {
                logger.error('Group buy deadline check failed:', error);
            }
        });
        this.jobs.push(groupBuyJob);

        // Process matured investments every 6 hours
        const investmentJob = cron.schedule('0 */6 * * *', async () => {
            logger.info('Running investment maturity check...');
            try {
                await investmentsService.processMaturedInvestments();
                logger.info('Investment maturity check completed');
            } catch (error) {
                logger.error('Investment maturity check failed:', error);
            }
        });
        this.jobs.push(investmentJob);

        // Clean up expired OTP codes daily at 3 AM
        const otpCleanupJob = cron.schedule('0 3 * * *', async () => {
            logger.info('Running OTP cleanup...');
            try {
                const { query } = await import('../config/database');
                await query(`DELETE FROM otp_codes WHERE expires_at < NOW() - INTERVAL '24 hours'`);
                logger.info('OTP cleanup completed');
            } catch (error) {
                logger.error('OTP cleanup failed:', error);
            }
        });
        this.jobs.push(otpCleanupJob);

        // Clean up expired sessions daily at 4 AM
        const sessionCleanupJob = cron.schedule('0 4 * * *', async () => {
            logger.info('Running session cleanup...');
            try {
                const { query } = await import('../config/database');
                await query(`DELETE FROM user_sessions WHERE expires_at < NOW()`);
                logger.info('Session cleanup completed');
            } catch (error) {
                logger.error('Session cleanup failed:', error);
            }
        });
        this.jobs.push(sessionCleanupJob);

        // Clean up expired idempotency keys daily at 5 AM
        const idempotencyCleanupJob = cron.schedule('0 5 * * *', async () => {
            logger.info('Running idempotency key cleanup...');
            try {
                const { query } = await import('../config/database');
                await query(`DELETE FROM idempotency_keys WHERE expires_at < NOW()`);
                logger.info('Idempotency key cleanup completed');
            } catch (error) {
                logger.error('Idempotency key cleanup failed:', error);
            }
        });
        this.jobs.push(idempotencyCleanupJob);

        logger.info(`Scheduler started with ${this.jobs.length} jobs`);
    }

    /**
     * Stop all scheduled jobs
     */
    stop(): void {
        logger.info('Stopping scheduler service...');
        this.jobs.forEach(job => job.stop());
        this.jobs = [];
        logger.info('Scheduler stopped');
    }

    /**
     * Run a specific task immediately (for testing/manual triggers)
     */
    async runTask(taskName: string): Promise<void> {
        switch (taskName) {
            case 'group-buy-deadlines':
                await groupBuyingService.processDeadlineItems();
                break;
            case 'investment-maturity':
                await investmentsService.processMaturedInvestments();
                break;
            default:
                throw new Error(`Unknown task: ${taskName}`);
        }
    }
}

export const schedulerService = new SchedulerService();
