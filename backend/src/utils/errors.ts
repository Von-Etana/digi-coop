export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly isOperational: boolean;
    public readonly details?: unknown;

    constructor(
        message: string,
        statusCode: number = 500,
        code: string = 'INTERNAL_ERROR',
        isOperational: boolean = true,
        details?: unknown
    ) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = isOperational;
        this.details = details;

        Object.setPrototypeOf(this, AppError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}

// Common error types
export class BadRequestError extends AppError {
    constructor(message: string = 'Bad request', code: string = 'BAD_REQUEST', details?: unknown) {
        super(message, 400, code, true, details);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized', code: string = 'UNAUTHORIZED') {
        super(message, 401, code, true);
    }
}

export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden', code: string = 'FORBIDDEN') {
        super(message, 403, code, true);
    }
}

export class NotFoundError extends AppError {
    constructor(message: string = 'Resource not found', code: string = 'NOT_FOUND') {
        super(message, 404, code, true);
    }
}

export class ConflictError extends AppError {
    constructor(message: string = 'Resource already exists', code: string = 'CONFLICT') {
        super(message, 409, code, true);
    }
}

export class ValidationError extends AppError {
    constructor(message: string = 'Validation failed', details?: unknown) {
        super(message, 422, 'VALIDATION_ERROR', true, details);
    }
}

export class TooManyRequestsError extends AppError {
    constructor(message: string = 'Too many requests', retryAfter?: number) {
        super(message, 429, 'RATE_LIMIT_EXCEEDED', true, { retryAfter });
    }
}

export class InternalServerError extends AppError {
    constructor(message: string = 'Internal server error') {
        super(message, 500, 'INTERNAL_ERROR', false);
    }
}

export class ServiceUnavailableError extends AppError {
    constructor(message: string = 'Service temporarily unavailable') {
        super(message, 503, 'SERVICE_UNAVAILABLE', true);
    }
}

// Financial-specific errors
export class InsufficientFundsError extends AppError {
    constructor(message: string = 'Insufficient funds') {
        super(message, 400, 'INSUFFICIENT_FUNDS', true);
    }
}

export class DuplicateTransactionError extends AppError {
    constructor(message: string = 'Duplicate transaction detected') {
        super(message, 409, 'DUPLICATE_TRANSACTION', true);
    }
}

export class KycRequiredError extends AppError {
    constructor(message: string = 'KYC verification required') {
        super(message, 403, 'KYC_REQUIRED', true);
    }
}

export class TwoFactorRequiredError extends AppError {
    constructor(message: string = '2FA verification required') {
        super(message, 403, 'TWO_FACTOR_REQUIRED', true);
    }
}

export class InvalidOtpError extends AppError {
    constructor(message: string = 'Invalid or expired OTP') {
        super(message, 400, 'INVALID_OTP', true);
    }
}

export class AccountLockedError extends AppError {
    constructor(message: string = 'Account is locked') {
        super(message, 403, 'ACCOUNT_LOCKED', true);
    }
}

export class SavingsLockedError extends AppError {
    constructor(message: string = 'Savings account is locked until maturity') {
        super(message, 403, 'SAVINGS_LOCKED', true);
    }
}

export class LoanNotEligibleError extends AppError {
    constructor(message: string = 'Not eligible for loan', details?: unknown) {
        super(message, 400, 'LOAN_NOT_ELIGIBLE', true, details);
    }
}

export class MoqNotMetError extends AppError {
    constructor(message: string = 'Minimum order quantity not met') {
        super(message, 400, 'MOQ_NOT_MET', true);
    }
}

export class InvestmentClosedError extends AppError {
    constructor(message: string = 'Investment opportunity is closed') {
        super(message, 400, 'INVESTMENT_CLOSED', true);
    }
}
