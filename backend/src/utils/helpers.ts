import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * Generate a unique member ID (e.g., DC-2026-000001)
 */
export function generateMemberId(sequence: number): string {
    const year = new Date().getFullYear();
    const paddedSequence = String(sequence).padStart(6, '0');
    return `DC-${year}-${paddedSequence}`;
}

/**
 * Generate a unique account number (10 digits)
 */
export function generateAccountNumber(): string {
    const prefix = '30'; // DigiCoop prefix
    const randomDigits = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    return prefix + randomDigits;
}

/**
 * Generate a unique transaction reference
 */
export function generateTransactionRef(prefix: string = 'TXN'): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}

/**
 * Generate a UUID v4
 */
export function generateUuid(): string {
    return uuidv4();
}

/**
 * Generate a random OTP (6 digits)
 */
export function generateOtp(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
}

/**
 * Hash a string using SHA-256
 */
export function hashString(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Calculate percentage
 */
export function calculatePercentage(part: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((part / total) * 100);
}

/**
 * Format currency (Nigerian Naira)
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
    }).format(amount);
}

/**
 * Calculate days between two dates
 */
export function daysBetween(date1: Date, date2: Date): number {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round(Math.abs((date2.getTime() - date1.getTime()) / oneDay));
}

/**
 * Parse duration string (e.g., '15m', '7d', '1h') to milliseconds
 */
export function parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) throw new Error(`Invalid duration format: ${duration}`);

    const value = parseInt(match[1], 10);
    const unit = match[2];

    const multipliers: Record<string, number> = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
    };

    return value * multipliers[unit];
}

/**
 * Mask sensitive data (e.g., BVN: 22******89)
 */
export function maskSensitive(value: string, visibleStart: number = 2, visibleEnd: number = 2): string {
    if (value.length <= visibleStart + visibleEnd) return value;
    const start = value.substring(0, visibleStart);
    const end = value.substring(value.length - visibleEnd);
    const masked = '*'.repeat(value.length - visibleStart - visibleEnd);
    return start + masked + end;
}

/**
 * Validate Nigerian phone number and normalize to +234 format
 */
export function normalizePhoneNumber(phone: string): string | null {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');

    // Handle different formats
    if (digits.startsWith('234') && digits.length === 13) {
        return '+' + digits;
    } else if (digits.startsWith('0') && digits.length === 11) {
        return '+234' + digits.substring(1);
    } else if (digits.length === 10) {
        return '+234' + digits;
    }

    return null; // Invalid format
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate BVN format (11 digits)
 */
export function isValidBvn(bvn: string): boolean {
    return /^\d{11}$/.test(bvn);
}

/**
 * Validate NIN format (11 digits)
 */
export function isValidNin(nin: string): boolean {
    return /^\d{11}$/.test(nin);
}

/**
 * Calculate loan eligibility
 * Max Loan = (Savings Balance * multiplier) - Outstanding Debt
 */
export function calculateLoanEligibility(
    savingsBalance: number,
    outstandingDebt: number,
    multiplier: number = 2
): number {
    const maxLoan = (savingsBalance * multiplier) - outstandingDebt;
    return Math.max(0, maxLoan);
}

/**
 * Calculate monthly loan repayment using amortization formula
 */
export function calculateMonthlyRepayment(
    principal: number,
    annualRate: number,
    tenureMonths: number
): number {
    const monthlyRate = annualRate / 12 / 100;
    if (monthlyRate === 0) return principal / tenureMonths;

    const payment = principal *
        (monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
        (Math.pow(1 + monthlyRate, tenureMonths) - 1);

    return Math.round(payment * 100) / 100;
}

/**
 * Generate loan amortization schedule
 */
export function generateAmortizationSchedule(
    principal: number,
    annualRate: number,
    tenureMonths: number,
    startDate: Date
): Array<{
    installment: number;
    dueDate: Date;
    principal: number;
    interest: number;
    total: number;
    balance: number;
}> {
    const schedule = [];
    const monthlyPayment = calculateMonthlyRepayment(principal, annualRate, tenureMonths);
    const monthlyRate = annualRate / 12 / 100;
    let balance = principal;

    for (let i = 1; i <= tenureMonths; i++) {
        const interestPayment = Math.round(balance * monthlyRate * 100) / 100;
        const principalPayment = Math.round((monthlyPayment - interestPayment) * 100) / 100;
        balance = Math.round((balance - principalPayment) * 100) / 100;

        // Handle last payment rounding
        if (i === tenureMonths && balance !== 0) {
            balance = 0;
        }

        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        schedule.push({
            installment: i,
            dueDate,
            principal: principalPayment,
            interest: interestPayment,
            total: monthlyPayment,
            balance: Math.max(0, balance),
        });
    }

    return schedule;
}

/**
 * Calculate investment return (principal * roi% * duration / 12)
 */
export function calculateInvestmentReturn(
    principal: number,
    roiPercentage: number,
    durationMonths: number = 12
): number {
    // Calculate proportional return based on duration
    const return_amount = principal * (roiPercentage / 100) * (durationMonths / 12);
    return Math.round(return_amount * 100) / 100;
}

/**
 * Generate a unique order number
 */
export function generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `ORD-${timestamp}-${random}`;
}
