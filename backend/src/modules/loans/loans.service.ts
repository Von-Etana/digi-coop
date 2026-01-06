import { query, withTransaction } from '../../config/database';
import { walletsService } from '../wallets/wallets.service';
import { savingsService } from '../savings/savings.service';
import {
    Loan,
    LoanStatus,
    TransactionType,
    SavingsType
} from '../../types';
import {
    NotFoundError,
    BadRequestError,
} from '../../utils/errors';
import { logger } from '../../utils/logger';
import {
    formatCurrency,
    calculateLoanEligibility,
    calculateMonthlyRepayment,
    generateAmortizationSchedule
} from '../../utils/helpers';
import {
    ApplyLoanInput,
    LoanDecisionInput,
    LoanQueryInput
} from './loans.validation';

export class LoansService {
    /**
     * Check loan eligibility
     */
    async checkEligibility(userId: string): Promise<{
        is_eligible: boolean;
        max_loan_amount: number;
        savings_balance: number;
        outstanding_debt: number;
    }> {
        // 1. Get total savings
        const savings = await savingsService.getUserSavings(userId);
        const totalSavings = savings.reduce((sum: number, acc: any) => sum + parseFloat(acc.balance.toString()), 0);

        // 2. Get outstanding loans
        const loans = await query(
            `SELECT SUM(outstanding_balance) as total_debt 
       FROM loans 
       WHERE user_id = $1 AND status IN ('active', 'repaying', 'overdue')`,
            [userId]
        );
        const totalDebt = parseFloat(loans.rows[0].total_debt || '0');

        // 3. Calculate limit (e.g., 200% of savings minus current debt)
        const maxLoan = calculateLoanEligibility(totalSavings, totalDebt, 2);

        return {
            is_eligible: maxLoan > 0,
            max_loan_amount: maxLoan,
            savings_balance: totalSavings,
            outstanding_debt: totalDebt,
        };
    }

    /**
     * Apply for a loan
     */
    async applyForLoan(userId: string, input: ApplyLoanInput): Promise<Loan> {
        const eligibility = await this.checkEligibility(userId);

        if (input.amount > eligibility.max_loan_amount) {
            throw new BadRequestError(
                `Loan amount exceeds eligibility. Max available: ${formatCurrency(eligibility.max_loan_amount)}`
            );
        }

        // Default interest rate (could be dynamic)
        const annualInterestRate = 12; // 12% per annum

        // Calculate expected repayment
        const monthlyPayment = calculateMonthlyRepayment(
            input.amount,
            annualInterestRate,
            input.tenure_months
        );
        const totalRepayment = monthlyPayment * input.tenure_months;

        const result = await query(
            `INSERT INTO loans 
       (user_id, principal_amount, interest_rate, tenure_months, outstanding_balance, status, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [
                userId,
                input.amount,
                annualInterestRate,
                input.tenure_months,
                totalRepayment,
                LoanStatus.PENDING,
                { purpose: input.purpose, monthly_payment: monthlyPayment }
            ]
        );

        logger.info(`Loan application submitted for user ${userId}`, { amount: input.amount });
        return result.rows[0] as Loan;
    }

    /**
     * Admin: Approve/Reject Loan
     */
    async processLoanApplication(adminId: string, loanId: string, input: LoanDecisionInput): Promise<Loan> {
        const loanResult = await query(`SELECT * FROM loans WHERE id = $1`, [loanId]);
        if (loanResult.rows.length === 0) throw new NotFoundError('Loan not found');

        const loan = loanResult.rows[0] as Loan;

        if (loan.status !== LoanStatus.PENDING) {
            throw new BadRequestError('Loan is already processed');
        }

        if (input.status === 'rejected') {
            const result = await query(
                `UPDATE loans SET status = $1, approved_by = $2, approved_at = NOW(), metadata = metadata || $3::jsonb 
         WHERE id = $4 RETURNING *`,
                [LoanStatus.REJECTED, adminId, JSON.stringify({ rejection_reason: input.reason }), loanId]
            );
            return result.rows[0] as Loan;
        }

        // Identify status - standard flow: Approved -> Disbursed (Manual or Auto)
        // For simplicity, let's auto-disburse upon approval if wallet funds allow (System Wallet)
        // Here we'll just mark as APPROVED, and have a separate 'disburse' step or combine it.
        // Let's combine: Approval means disbursement here.

        return withTransaction(async (client) => {
            // 1. Update loan status to Active (Disbursed)
            const updatedLoan = await client.query(
                `UPDATE loans 
         SET status = $1, approved_by = $2, approved_at = NOW(), disbursed_at = NOW() 
         WHERE id = $3 RETURNING *`,
                [LoanStatus.DISBURSED, adminId, loanId]
            );

            // 2. Generate Repayment Schedule
            const schedule = generateAmortizationSchedule(
                parseFloat(loan.principal_amount.toString()),
                parseFloat(loan.interest_rate.toString()),
                loan.tenure_months,
                new Date()
            );

            for (const item of schedule) {
                await client.query(
                    `INSERT INTO loan_schedules (loan_id, installment_number, due_date, principal_amount, interest_amount, total_amount, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [loanId, item.installment, item.dueDate, item.principal, item.interest, item.total, 'pending']
                );
            }

            // 3. Credit User Wallet
            const wallets = await client.query(
                `SELECT id FROM wallets WHERE user_id = $1`,
                [loan.user_id]
            );
            if (wallets.rows.length === 0) throw new Error('User wallet not found');
            const walletId = wallets.rows[0].id;

            await walletsService.creditWallet(
                walletId,
                parseFloat(loan.principal_amount.toString()),
                TransactionType.LOAN_DISBURSEMENT,
                `Loan Disbursement: ${loanId.substring(0, 8)}`,
                undefined,
                { loan_id: loanId }
            );

            return updatedLoan.rows[0] as Loan;
        });
    }

    /**
     * Get loans (User or Admin)
     */
    async getLoans(userId: string | null, filters: LoanQueryInput): Promise<{ loans: Loan[]; total: number }> {
        let whereClause = '1=1';
        const params: unknown[] = [];
        let paramIndex = 1;

        if (userId) {
            whereClause += ` AND user_id = $${paramIndex++}`;
            params.push(userId);
        }

        if (filters.status && filters.status !== 'all') {
            whereClause += ` AND status = $${paramIndex++}`;
            params.push(filters.status);
        }

        const countResult = await query(
            `SELECT COUNT(*) FROM loans WHERE ${whereClause}`,
            params
        );
        const total = parseInt(countResult.rows[0].count);

        const offset = (filters.page - 1) * filters.limit;
        const result = await query(
            `SELECT * FROM loans 
       WHERE ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
            [...params, filters.limit, offset]
        );

        return {
            loans: result.rows as Loan[],
            total,
        };
    }

    /**
     * Get single loan details with schedule
     */
    async getLoanDetails(loanId: string): Promise<Loan & { schedule: any[] }> {
        const loanResult = await query(`SELECT * FROM loans WHERE id = $1`, [loanId]);
        if (loanResult.rows.length === 0) throw new NotFoundError('Loan not found');

        const scheduleResult = await query(
            `SELECT * FROM loan_schedules WHERE loan_id = $1 ORDER BY installment_number ASC`,
            [loanId]
        );

        return {
            ...loanResult.rows[0] as Loan,
            schedule: scheduleResult.rows,
        };
    }
}

export const loansService = new LoansService();
