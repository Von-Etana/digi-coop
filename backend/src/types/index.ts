import { Request } from 'express';

// ============= User Types =============
export interface User {
    id: string;
    email: string;
    phone: string;
    password_hash: string;
    first_name: string;
    last_name: string;
    status: UserStatus;
    member_id: string;
    is_2fa_enabled: boolean;
    created_at: Date;
    updated_at: Date;
}

export enum UserStatus {
    PENDING = 'pending',
    VERIFIED = 'verified',
    SUSPENDED = 'suspended'
}

export interface KycRecord {
    id: string;
    user_id: string;
    bvn_encrypted: string;
    nin_encrypted: string;
    verification_status: VerificationStatus;
    verification_response: Record<string, unknown>;
    verified_at: Date | null;
    created_at: Date;
}

export enum VerificationStatus {
    PENDING = 'pending',
    VERIFIED = 'verified',
    FAILED = 'failed'
}

// ============= Wallet Types =============
export interface Wallet {
    id: string;
    user_id: string;
    account_number: string;
    available_balance: number;
    ledger_balance: number;
    currency: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface LedgerEntry {
    id: string;
    wallet_id: string;
    transaction_id: string;
    entry_type: EntryType;
    amount: number;
    balance_after: number;
    description: string;
    created_at: Date;
}

export enum EntryType {
    DEBIT = 'debit',
    CREDIT = 'credit'
}

// ============= Transaction Types =============
export interface Transaction {
    id: string;
    source_wallet_id: string | null;
    destination_wallet_id: string | null;
    idempotency_key: string;
    type: TransactionType;
    status: TransactionStatus;
    amount: number;
    fee: number;
    reference: string;
    metadata: Record<string, unknown>;
    completed_at: Date | null;
    created_at: Date;
}

export enum TransactionType {
    DEPOSIT = 'deposit',
    WITHDRAWAL = 'withdrawal',
    TRANSFER = 'transfer',
    FEE = 'fee',
    REFUND = 'refund',
    GROUP_BUY = 'group_buy',
    INVESTMENT = 'investment',
    LOAN_DISBURSEMENT = 'loan_disbursement',
    LOAN_REPAYMENT = 'loan_repayment'
}

export enum TransactionStatus {
    PENDING = 'pending',
    COMPLETED = 'completed',
    FAILED = 'failed',
    REVERSED = 'reversed'
}

// ============= Savings Types =============
export interface SavingsAccount {
    id: string;
    user_id: string;
    type: SavingsType;
    balance: number;
    target_amount: number | null;
    lock_until: Date | null;
    is_locked: boolean;
    created_at: Date;
    updated_at: Date;
}

export enum SavingsType {
    COMPULSORY = 'compulsory',
    VOLUNTARY = 'voluntary'
}

export interface SavingsTransaction {
    id: string;
    savings_account_id: string;
    transaction_id: string;
    type: SavingsTransactionType;
    amount: number;
    created_at: Date;
}

export enum SavingsTransactionType {
    DEPOSIT = 'deposit',
    WITHDRAWAL = 'withdrawal',
    INTEREST = 'interest'
}

// ============= Loan Types =============
export interface Loan {
    id: string;
    user_id: string;
    principal_amount: number;
    interest_rate: number;
    tenure_months: number;
    outstanding_balance: number;
    status: LoanStatus;
    approved_by: string | null;
    approved_at: Date | null;
    disbursed_at: Date | null;
    created_at: Date;
}

export enum LoanStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    DISBURSED = 'disbursed',
    REPAYING = 'repaying',
    COMPLETED = 'completed',
    DEFAULTED = 'defaulted',
    REJECTED = 'rejected'
}

export interface LoanSchedule {
    id: string;
    loan_id: string;
    installment_number: number;
    principal_amount: number;
    interest_amount: number;
    total_amount: number;
    due_date: Date;
    status: ScheduleStatus;
    paid_at: Date | null;
}

export enum ScheduleStatus {
    PENDING = 'pending',
    PAID = 'paid',
    OVERDUE = 'overdue'
}

// ============= Event Types =============
export interface Event {
    id: string;
    title: string;
    description: string | null;
    banner_url: string | null;
    banner_type: 'image' | 'video';
    location: string | null;
    location_url: string | null;
    start_date: Date;
    end_date: Date | null;
    status: EventStatus;
    created_by: string;
    created_at: Date;
    updated_at: Date;
}

export enum EventStatus {
    DRAFT = 'draft',
    PUBLISHED = 'published',
    CANCELLED = 'cancelled',
    COMPLETED = 'completed'
}

export interface EventRsvp {
    id: string;
    event_id: string;
    user_id: string;
    status: RsvpStatus;
    created_at: Date;
    updated_at: Date;
}

export enum RsvpStatus {
    ATTENDING = 'attending',
    NOT_ATTENDING = 'not_attending',
    MAYBE = 'maybe'
}

export interface EventWithStats extends Event {
    attending_count: number;
    not_attending_count: number;
    maybe_count: number;
    user_rsvp?: RsvpStatus;
}

// ============= Group Buying Types =============
export interface GroupBuyItem {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    unit_price: number;
    min_quantity: number;
    max_quantity: number | null;
    deadline: Date;
    category: string | null;
    status: GroupBuyItemStatus;
    created_by: string;
    created_at: Date;
    updated_at: Date;
}

export enum GroupBuyItemStatus {
    DRAFT = 'draft',
    ACTIVE = 'active',
    CLOSED = 'closed',
    FULFILLED = 'fulfilled',
    CANCELLED = 'cancelled'
}

export interface GroupBuyOrder {
    id: string;
    item_id: string;
    user_id: string;
    order_number: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
    delivery_address: string | null;
    delivery_notes: string | null;
    status: GroupBuyOrderStatus;
    created_at: Date;
    updated_at: Date;
}

export enum GroupBuyOrderStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    DELIVERED = 'delivered',
    REFUNDED = 'refunded',
    CANCELLED = 'cancelled'
}

export interface GroupBuyCartItem {
    id: string;
    user_id: string;
    item_id: string;
    quantity: number;
    created_at: Date;
    updated_at: Date;
}

export interface GroupBuyItemWithProgress extends GroupBuyItem {
    ordered_quantity: number;
    buyer_count: number;
    progress_percentage: number;
    remaining_quantity: number;
}

// ============= Investment Types =============
export interface InvestmentProject {
    id: string;
    title: string;
    description: string | null;
    banner_url: string | null;
    banner_type: 'image' | 'video';
    target_amount: number;
    min_investment: number;
    max_investment: number | null;
    expected_roi: number;
    duration_months: number;
    end_date: Date;
    risk_level: 'low' | 'medium' | 'high';
    category: string | null;
    status: InvestmentProjectStatus;
    created_by: string;
    created_at: Date;
    updated_at: Date;
}

export enum InvestmentProjectStatus {
    DRAFT = 'draft',
    OPEN = 'open',
    FUNDED = 'funded',
    MATURED = 'matured',
    CANCELLED = 'cancelled'
}

export interface Investment {
    id: string;
    project_id: string;
    user_id: string;
    amount: number;
    expected_return: number;
    actual_return: number | null;
    maturity_date: Date;
    payout_date: Date | null;
    status: InvestmentStatus;
    created_at: Date;
    updated_at: Date;
}

export enum InvestmentStatus {
    ACTIVE = 'active',
    MATURED = 'matured',
    CANCELLED = 'cancelled'
}

export interface InvestmentProjectWithStats extends InvestmentProject {
    invested_amount: number;
    investor_count: number;
    funding_progress: number;
    remaining_amount: number;
}

// ============= Auth Types =============
export interface TwoFactorAuth {
    id: string;
    user_id: string;
    method: TwoFactorMethod;
    secret_encrypted: string;
    is_verified: boolean;
    created_at: Date;
}

export enum TwoFactorMethod {
    TOTP = 'totp',
    SMS = 'sms'
}

export interface UserSession {
    id: string;
    user_id: string;
    refresh_token_hash: string;
    device_info: string | null;
    ip_address: string;
    expires_at: Date;
    created_at: Date;
}

export interface IdempotencyKey {
    id: string;
    key: string;
    user_id: string;
    endpoint: string;
    request_body_hash: string;
    response: Record<string, unknown> | null;
    status_code: number | null;
    expires_at: Date;
    created_at: Date;
}

// ============= Audit Types =============
export interface AuditLog {
    id: string;
    admin_id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    ip_address: string;
    created_at: Date;
}

// ============= API Types =============
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        member_id: string;
        status: UserStatus;
        is_2fa_enabled: boolean;
        roles: string[];
    };
    idempotencyKey?: string;
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    message: string;
    data?: T;
    error?: {
        code: string;
        details?: unknown;
    };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
    };
}

// ============= Token Types =============
export interface TokenPayload {
    userId: string;
    email: string;
    memberId: string;
    type: 'access' | 'refresh';
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
