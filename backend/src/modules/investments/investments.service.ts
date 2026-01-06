import { query, withTransaction } from '../../config/database';
import { walletsService } from '../wallets/wallets.service';
import {
    InvestmentProject,
    Investment,
    InvestmentProjectStatus,
    InvestmentStatus,
    TransactionType
} from '../../types';
import {
    NotFoundError,
    BadRequestError,
    InsufficientFundsError
} from '../../utils/errors';
import { logger } from '../../utils/logger';
import { formatCurrency, calculateInvestmentReturn } from '../../utils/helpers';
import {
    CreateProjectInput,
    UpdateProjectInput,
    InvestInput,
    InvestmentQueryInput
} from './investments.validation';

export class InvestmentsService {
    // ==================== PROJECTS ====================

    /**
     * Create investment project (Admin)
     */
    async createProject(adminId: string, input: CreateProjectInput): Promise<InvestmentProject> {
        const result = await query(
            `INSERT INTO investment_projects 
       (title, description, banner_url, banner_type, target_amount, min_investment, max_investment,
        expected_roi, duration_months, end_date, risk_level, category, status, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
            [
                input.title,
                input.description,
                input.banner_url,
                input.banner_type,
                input.target_amount,
                input.min_investment,
                input.max_investment,
                input.expected_roi,
                input.duration_months,
                input.end_date,
                input.risk_level,
                input.category,
                input.is_published ? InvestmentProjectStatus.OPEN : InvestmentProjectStatus.DRAFT,
                adminId,
            ]
        );

        logger.info(`Investment project created: ${input.title}`, { projectId: result.rows[0].id });
        return result.rows[0] as InvestmentProject;
    }

    /**
     * Update investment project (Admin)
     */
    async updateProject(projectId: string, input: UpdateProjectInput): Promise<InvestmentProject> {
        const existing = await this.getProjectById(projectId);
        if (!existing) {
            throw new NotFoundError('Project not found');
        }

        if (existing.status !== InvestmentProjectStatus.OPEN && existing.status !== InvestmentProjectStatus.DRAFT) {
            throw new BadRequestError('Cannot update a project that is already funded or closed');
        }

        const updates: string[] = [];
        const values: unknown[] = [];
        let paramIndex = 1;

        Object.entries(input).forEach(([key, value]) => {
            if (value !== undefined) {
                if (key === 'is_published') {
                    updates.push(`status = $${paramIndex++}`);
                    values.push(value ? InvestmentProjectStatus.OPEN : InvestmentProjectStatus.DRAFT);
                } else {
                    updates.push(`${key} = $${paramIndex++}`);
                    values.push(value);
                }
            }
        });

        if (updates.length === 0) return existing;

        updates.push(`updated_at = NOW()`);
        values.push(projectId);

        const result = await query(
            `UPDATE investment_projects SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            values
        );

        return result.rows[0] as InvestmentProject;
    }

    /**
     * Get project by ID with investment stats
     */
    async getProjectById(projectId: string): Promise<InvestmentProject | null> {
        const result = await query(
            `SELECT p.*, 
              COALESCE(SUM(i.amount), 0) as invested_amount,
              COUNT(DISTINCT i.user_id) as investor_count
       FROM investment_projects p
       LEFT JOIN investments i ON p.id = i.project_id AND i.status != 'cancelled'
       WHERE p.id = $1
       GROUP BY p.id`,
            [projectId]
        );

        return result.rows[0] as InvestmentProject || null;
    }

    /**
     * List projects with pagination
     */
    async getProjects(filters: InvestmentQueryInput): Promise<{ projects: InvestmentProject[]; total: number }> {
        let whereClause = '1=1';
        const params: unknown[] = [];
        let paramIndex = 1;

        if (filters.status === 'open') {
            whereClause += ` AND status = 'open' AND end_date > NOW()`;
        } else if (filters.status === 'funded') {
            whereClause += ` AND status = 'funded'`;
        } else if (filters.status === 'matured') {
            whereClause += ` AND status = 'matured'`;
        } else {
            whereClause += ` AND status != 'draft'`;
        }

        if (filters.risk_level) {
            whereClause += ` AND risk_level = $${paramIndex++}`;
            params.push(filters.risk_level);
        }

        // Get total
        const countResult = await query(
            `SELECT COUNT(*) FROM investment_projects WHERE ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        // Get projects with stats
        const offset = (filters.page - 1) * filters.limit;
        const result = await query(
            `SELECT p.*, 
              COALESCE(SUM(i.amount), 0) as invested_amount,
              COUNT(DISTINCT i.user_id) as investor_count
       FROM investment_projects p
       LEFT JOIN investments i ON p.id = i.project_id AND i.status != 'cancelled'
       WHERE ${whereClause}
       GROUP BY p.id
       ORDER BY p.end_date ASC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, filters.limit, offset]
        );

        return {
            projects: result.rows as InvestmentProject[],
            total,
        };
    }

    // ==================== INVESTMENTS ====================

    /**
     * Invest in a project
     */
    async invest(userId: string, projectId: string, input: InvestInput): Promise<Investment> {
        const project = await this.getProjectById(projectId);

        if (!project) {
            throw new NotFoundError('Project not found');
        }

        if (project.status !== InvestmentProjectStatus.OPEN) {
            throw new BadRequestError('This project is not accepting investments');
        }

        if (new Date(project.end_date) < new Date()) {
            throw new BadRequestError('Investment deadline has passed');
        }

        if (input.amount < project.min_investment) {
            throw new BadRequestError(`Minimum investment is ${formatCurrency(project.min_investment)}`);
        }

        if (project.max_investment && input.amount > project.max_investment) {
            throw new BadRequestError(`Maximum investment is ${formatCurrency(project.max_investment)}`);
        }

        // Check current investment total
        const investedAmount = parseFloat((project as typeof project & { invested_amount: string }).invested_amount || '0');
        const remaining = project.target_amount - investedAmount;

        if (input.amount > remaining) {
            throw new BadRequestError(`Only ${formatCurrency(remaining)} remaining for this project`);
        }

        // Get user's wallet
        const wallet = await walletsService.getWallet(userId);
        const balance = parseFloat(wallet.available_balance.toString());

        if (balance < input.amount) {
            throw new InsufficientFundsError();
        }

        // Calculate expected return
        const expectedReturn = calculateInvestmentReturn(
            input.amount,
            project.expected_roi,
            project.duration_months
        );

        // Calculate maturity date
        const maturityDate = new Date();
        maturityDate.setMonth(maturityDate.getMonth() + project.duration_months);

        return withTransaction(async (client) => {
            // Create investment
            const investResult = await client.query(
                `INSERT INTO investments 
         (user_id, project_id, amount, expected_return, maturity_date, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
                [userId, projectId, input.amount, expectedReturn, maturityDate, InvestmentStatus.ACTIVE]
            );

            const investment = investResult.rows[0];

            // Debit wallet
            await walletsService.debitWallet(
                wallet.id,
                input.amount,
                TransactionType.INVESTMENT,
                `Investment in ${project.title}`,
                undefined,
                { investment_id: investment.id, project_id: projectId }
            );

            // Check if project is now fully funded
            const newTotal = investedAmount + input.amount;
            if (newTotal >= project.target_amount) {
                await client.query(
                    `UPDATE investment_projects SET status = $1 WHERE id = $2`,
                    [InvestmentProjectStatus.FUNDED, projectId]
                );
            }

            logger.info(`Investment made: ${formatCurrency(input.amount)}`, {
                userId,
                projectId,
                investmentId: investment.id,
                expectedReturn,
            });

            return investment as Investment;
        });
    }

    /**
     * Get user's investments
     */
    async getUserInvestments(userId: string): Promise<Investment[]> {
        const result = await query(
            `SELECT i.*, p.title as project_title, p.expected_roi, p.risk_level
       FROM investments i
       JOIN investment_projects p ON i.project_id = p.id
       WHERE i.user_id = $1
       ORDER BY i.created_at DESC`,
            [userId]
        );

        return result.rows as Investment[];
    }

    /**
     * Get user's investment portfolio summary
     */
    async getUserPortfolio(userId: string): Promise<{
        total_invested: number;
        total_expected_return: number;
        active_investments: number;
        matured_investments: number;
    }> {
        const result = await query(
            `SELECT 
        COALESCE(SUM(CASE WHEN status = 'active' THEN amount ELSE 0 END), 0) as active_invested,
        COALESCE(SUM(CASE WHEN status = 'active' THEN expected_return ELSE 0 END), 0) as active_expected,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
        COUNT(CASE WHEN status = 'matured' THEN 1 END) as matured_count
       FROM investments
       WHERE user_id = $1`,
            [userId]
        );

        const row = result.rows[0];
        return {
            total_invested: parseFloat(row.active_invested),
            total_expected_return: parseFloat(row.active_expected),
            active_investments: parseInt(row.active_count),
            matured_investments: parseInt(row.matured_count),
        };
    }

    /**
     * Process matured investments (called by scheduler)
     */
    async processMaturedInvestments(): Promise<void> {
        // Get matured investments that haven't been paid
        const maturedInvestments = await query(
            `SELECT i.*, w.id as wallet_id, p.title as project_title
       FROM investments i
       JOIN wallets w ON i.user_id = w.user_id
       JOIN investment_projects p ON i.project_id = p.id
       WHERE i.status = 'active' AND i.maturity_date <= NOW()`
        );

        for (const investment of maturedInvestments.rows) {
            await withTransaction(async (client) => {
                // Calculate total payout (principal + return)
                const totalPayout = parseFloat(investment.amount) + parseFloat(investment.expected_return);

                // Credit wallet
                await walletsService.creditWallet(
                    investment.wallet_id,
                    totalPayout,
                    TransactionType.INVESTMENT,
                    `Investment maturity: ${investment.project_title}`,
                    undefined,
                    { investment_id: investment.id, principal: investment.amount, return: investment.expected_return }
                );

                // Update investment status
                await client.query(
                    `UPDATE investments SET status = $1, actual_return = $2, payout_date = NOW() WHERE id = $3`,
                    [InvestmentStatus.MATURED, investment.expected_return, investment.id]
                );

                logger.info(`Investment matured and paid: ${formatCurrency(totalPayout)}`, {
                    investmentId: investment.id,
                    userId: investment.user_id,
                });
            });
        }

        // Update projects where all investments have matured
        await query(
            `UPDATE investment_projects SET status = $1
       WHERE status = 'funded'
       AND NOT EXISTS (
         SELECT 1 FROM investments WHERE project_id = investment_projects.id AND status = 'active'
       )`,
            [InvestmentProjectStatus.MATURED]
        );
    }

    /**
     * Get project investors (Admin)
     */
    async getProjectInvestors(projectId: string): Promise<{
        user_id: string;
        first_name: string;
        last_name: string;
        amount: number;
        invested_at: Date;
    }[]> {
        const result = await query(
            `SELECT i.user_id, u.first_name, u.last_name, i.amount, i.created_at as invested_at
       FROM investments i
       JOIN users u ON i.user_id = u.id
       WHERE i.project_id = $1 AND i.status != 'cancelled'
       ORDER BY i.amount DESC`,
            [projectId]
        );

        return result.rows as { user_id: string; first_name: string; last_name: string; amount: number; invested_at: Date }[];
    }
}

export const investmentsService = new InvestmentsService();
