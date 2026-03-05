/**
 * Configuration for the GatewayClient.
 */
export interface GatewayClientConfig {
  /** Base URL of the gateway service (e.g., "https://gateway.zkira.xyz" or "http://localhost:3020") */
  baseUrl: string;
  /** API key for authentication */
  apiKey: string;
  /** Request timeout in milliseconds (default: 30000) */
  timeout?: number;
}

/**
 * A gateway session representing a payment or withdrawal transaction.
 */
export interface GatewaySession {
  /** Unique session identifier (UUID v4) */
  id: string;
  /** Merchant identifier */
  merchantId: string;
  /** Session type: 'deposit' or 'withdrawal' */
  sessionType: 'deposit' | 'withdrawal';
  /** Player reference identifier */
  playerRef: string;
  /** Amount in 6 decimal precision */
  amount: string;
  /** Token symbol (e.g., 'USDC') */
  token: string;
  /** Blockchain network (e.g., 'solana') */
  chain: string;
  /** Pool address for the session (optional) */
  poolAddress?: string;
  /** Session status: 'pending', 'confirmed', 'expired', 'failed' */
  status: 'pending' | 'confirmed' | 'expired' | 'failed';
  /** Ephemeral wallet address (optional) */
  ephemeralWallet?: string;
  /** Commitment level (optional) */
  commitment?: string;
  /** Transaction hash (optional) */
  txHash?: string;
  /** Claim code for withdrawal (optional) */
  claimCode?: string;
  /** Recipient address for withdrawal (optional) */
  recipientAddress?: string;
  /** Referrer address (optional) */
  referrerAddress?: string;
  /** Platform fee in 6 decimal precision (optional) */
  platformFee?: string;
  /** Additional metadata (optional) */
  metadata?: Record<string, unknown>;
  /** Idempotency key for request deduplication (optional) */
  idempotencyKey?: string;
  /** ISO 8601 creation timestamp */
  createdAt: string;
  /** ISO 8601 last update timestamp */
  updatedAt: string;
  /** ISO 8601 expiration timestamp */
  expiresAt: string;
}

/**
 * Player balance information.
 */
export interface GatewayBalance {
  /** Merchant identifier */
  merchantId: string;
  /** Player reference identifier */
  playerRef: string;
  /** Available balance in 6 decimal precision */
  availableBalance: string;
  /** Pending balance in 6 decimal precision */
  pendingBalance: string;
  /** Total deposited amount in 6 decimal precision */
  totalDeposited: string;
  /** Total withdrawn amount in 6 decimal precision */
  totalWithdrawn: string;
  /** Currency symbol */
  currency: string;
  /** ISO 8601 last update timestamp */
  updatedAt: string;
}

/**
 * A dispute record for a session.
 */
export interface GatewayDispute {
  /** Unique dispute identifier (UUID v4) */
  id: string;
  /** Merchant identifier */
  merchantId: string;
  /** Associated session identifier */
  sessionId: string;
  /** Player reference identifier */
  playerRef: string;
  /** Dispute reason */
  reason: string;
  /** Evidence provided (optional) */
  evidence?: string;
  /** Dispute status: 'open', 'under_review', 'resolved', 'rejected' */
  status: 'open' | 'under_review' | 'resolved' | 'rejected';
  /** Resolution details (optional) */
  resolution?: string;
  /** Amount on hold in 6 decimal precision (optional) */
  holdAmount?: string;
  /** Currency of hold amount (optional) */
  holdCurrency?: string;
  /** User who resolved the dispute (optional) */
  resolvedBy?: string;
  /** ISO 8601 resolution timestamp (optional) */
  resolvedAt?: string;
  /** ISO 8601 creation timestamp */
  createdAt: string;
  /** ISO 8601 last update timestamp */
  updatedAt: string;
}

/**
 * Pool assignment for a merchant.
 */
export interface PoolAssignment {
  /** Unique assignment identifier (UUID v4) */
  id: string;
  /** Merchant identifier */
  merchantId: string;
  /** Blockchain network */
  chain: string;
  /** Token symbol */
  token: string;
  /** Array of pool addresses */
  poolAddresses: string[];
  /** Whether this is the primary pool */
  isPrimary: boolean;
  /** ISO 8601 creation timestamp */
  createdAt: string;
  /** ISO 8601 last update timestamp */
  updatedAt: string;
}

/**
 * Ledger entry for transaction history.
 */
export interface LedgerEntry {
  /** Unique entry identifier (UUID v4) */
  id: string;
  /** Merchant identifier */
  merchantId: string;
  /** Player reference identifier */
  playerRef: string;
  /** Entry type: 'deposit', 'withdrawal', 'fee', 'adjustment' */
  type: 'deposit' | 'withdrawal' | 'fee' | 'adjustment';
  /** Amount in 6 decimal precision */
  amount: string;
  /** Currency symbol */
  currency: string;
  /** Associated session identifier (optional) */
  sessionId?: string;
  /** Associated dispute identifier (optional) */
  disputeId?: string;
  /** Balance before this entry in 6 decimal precision */
  balanceBefore: string;
  /** Balance after this entry in 6 decimal precision */
  balanceAfter: string;
  /** Description of the entry (optional) */
  description?: string;
  /** ISO 8601 creation timestamp */
  createdAt: string;
}

/**
 * Volume report with summary and breakdown.
 */
export interface VolumeReport {
  /** Summary statistics */
  summary: {
    /** Total deposits in 6 decimal precision */
    totalDeposits: string;
    /** Total withdrawals in 6 decimal precision */
    totalWithdrawals: string;
    /** Net volume (deposits - withdrawals) in 6 decimal precision */
    netVolume: string;
    /** Total transaction count */
    transactionCount: number;
  };
  /** Breakdown by period */
  breakdown: Array<{
    /** Period identifier (e.g., date or time range) */
    period: string;
    /** Deposits in this period in 6 decimal precision */
    deposits: string;
    /** Withdrawals in this period in 6 decimal precision */
    withdrawals: string;
    /** Net volume in this period in 6 decimal precision */
    netVolume: string;
    /** Transaction count in this period */
    transactionCount: number;
  }>;
}

/**
 * Session summary with status breakdown.
 */
export interface SessionSummary {
  /** Summary statistics */
  summary: {
    /** Total session count */
    total: number;
    /** Breakdown by status */
    byStatus: Record<
      string,
      {
        /** Count of sessions with this status */
        count: number;
        /** Total amount for sessions with this status in 6 decimal precision */
        amount: string;
      }
    >;
  };
}

/**
 * Pool reconciliation report.
 */
export interface Reconciliation {
  /** Pool assignment details */
  poolAssignment: PoolAssignment;
  /** On-chain deposits in 6 decimal precision */
  onChainDeposits: string;
  /** Current balances */
  currentBalances: {
    /** Total available balance in 6 decimal precision */
    totalAvailable: string;
    /** Total pending balance in 6 decimal precision */
    totalPending: string;
    /** Total deposited amount in 6 decimal precision */
    totalDeposited: string;
    /** Total withdrawn amount in 6 decimal precision */
    totalWithdrawn: string;
  };
  /** Discrepancy details (optional) */
  discrepancy?: {
    /** Discrepancy amount in 6 decimal precision */
    amount: string;
    /** Discrepancy description */
    description: string;
  };
}

/**
 * Paginated response wrapper.
 */
export interface PaginatedResponse<T> {
  /** Array of items */
  data: T[];
  /** Total count of items */
  total: number;
}

/**
 * Request to create a new session.
 */
export interface CreateSessionRequest {
  /** Session type: 'deposit' or 'withdrawal' */
  sessionType: 'deposit' | 'withdrawal';
  /** Player reference identifier */
  playerRef: string;
  /** Amount in 6 decimal precision */
  amount: string;
  /** Token symbol */
  token: string;
  /** Blockchain network */
  chain: string;
  /** Pool address (optional) */
  poolAddress?: string;
  /** Recipient address for withdrawal (optional) */
  recipientAddress?: string;
  /** Referrer address (optional) */
  referrerAddress?: string;
  /** Platform fee in 6 decimal precision (optional) */
  platformFee?: string;
  /** Additional metadata (optional) */
  metadata?: Record<string, unknown>;
  /** Idempotency key for request deduplication (optional) */
  idempotencyKey?: string;
}

/**
 * Request to confirm a session.
 */
export interface ConfirmSessionRequest {
  /** Transaction hash */
  txHash: string;
  /** Commitment level (optional) */
  commitment?: string;
  /** Ephemeral wallet address (optional) */
  ephemeralWallet?: string;
}

/**
 * Request to create a withdrawal.
 */
export interface CreateWithdrawalRequest {
  /** Player reference identifier */
  playerRef: string;
  /** Amount in 6 decimal precision */
  amount: string;
  /** Token symbol */
  token: string;
  /** Blockchain network */
  chain: string;
  /** Recipient address */
  recipientAddress: string;
  /** Pool address (optional) */
  poolAddress?: string;
  /** Additional metadata (optional) */
  metadata?: Record<string, unknown>;
  /** Idempotency key for request deduplication (optional) */
  idempotencyKey?: string;
}

/**
 * Request to confirm a withdrawal.
 */
export interface ConfirmWithdrawalRequest {
  /** Transaction hash */
  txHash: string;
  /** Claim code (optional) */
  claimCode?: string;
}

/**
 * Request to cancel a withdrawal.
 */
export interface CancelWithdrawalRequest {
  /** Cancellation reason (optional) */
  reason?: string;
}

/**
 * Request to create a dispute.
 */
export interface CreateDisputeRequest {
  /** Associated session identifier */
  sessionId: string;
  /** Player reference identifier */
  playerRef: string;
  /** Dispute reason */
  reason: string;
  /** Evidence (optional) */
  evidence?: string;
}

/**
 * Request to add evidence to a dispute.
 */
export interface AddEvidenceRequest {
  /** Evidence content */
  evidence: string;
}

/**
 * Request to update dispute status.
 */
export interface UpdateDisputeStatusRequest {
  /** New status: 'open', 'under_review', 'resolved', 'rejected' */
  status: 'open' | 'under_review' | 'resolved' | 'rejected';
  /** Resolution details (optional) */
  resolution?: string;
}

/**
 * Request to assign a pool.
 */
export interface AssignPoolRequest {
  /** Blockchain network */
  chain: string;
  /** Token symbol */
  token: string;
  /** Array of pool addresses */
  poolAddresses: string[];
  /** Whether this is the primary pool */
  isPrimary: boolean;
}

/**
 * Request to update a pool assignment.
 */
export interface UpdatePoolRequest {
  /** Array of pool addresses */
  poolAddresses: string[];
  /** Whether this is the primary pool */
  isPrimary: boolean;
}

/**
 * Response wrapper for a single session.
 */
export interface SessionResponse {
  /** The session object */
  session: GatewaySession;
}

/**
 * Response wrapper for multiple sessions.
 */
export interface SessionsResponse {
  /** Array of sessions */
  sessions: GatewaySession[];
  /** Total count */
  total: number;
}

/**
 * Response wrapper for a single balance.
 */
export interface BalanceResponse {
  /** The balance object */
  balance: GatewayBalance;
}

/**
 * Response wrapper for multiple balances.
 */
export interface BalancesResponse {
  /** Array of balances */
  balances: GatewayBalance[];
  /** Total count */
  total: number;
}

/**
 * Response wrapper for a single dispute.
 */
export interface DisputeResponse {
  /** The dispute object */
  dispute: GatewayDispute;
}

/**
 * Response wrapper for multiple disputes.
 */
export interface DisputesResponse {
  /** Array of disputes */
  disputes: GatewayDispute[];
  /** Total count */
  total: number;
}

/**
 * Response wrapper for a single pool assignment.
 */
export interface PoolResponse {
  /** The pool assignment object */
  pool: PoolAssignment;
}

/**
 * Response wrapper for multiple pool assignments.
 */
export interface PoolsResponse {
  /** Array of pool assignments */
  pools: PoolAssignment[];
  /** Total count */
  total: number;
}

/**
 * Response wrapper for ledger entries.
 */
export interface LedgerResponse {
  /** Array of ledger entries */
  entries: LedgerEntry[];
  /** Total count */
  total: number;
}

/**
 * Response wrapper for volume report.
 */
export interface VolumeReportResponse {
  /** The volume report */
  report: VolumeReport;
}

/**
 * Response wrapper for session summary.
 */
export interface SessionSummaryResponse {
  /** The session summary */
  summary: SessionSummary;
}

/**
 * Response wrapper for reconciliation.
 */
export interface ReconciliationResponse {
  /** The reconciliation report */
  reconciliation: Reconciliation;
}

/**
 * Query parameters for list endpoints.
 */
export interface ListParams {
  /** Page number (1-indexed) */
  page?: number;
  /** Items per page */
  limit?: number;
  /** Sort field */
  sortBy?: string;
  /** Sort order: 'asc' or 'desc' */
  sortOrder?: 'asc' | 'desc';
  /** Start date filter (ISO 8601) */
  startDate?: string;
  /** End date filter (ISO 8601) */
  endDate?: string;
  /** Status filter */
  status?: string;
  /** Player reference filter */
  playerRef?: string;
}

/**
 * Query parameters for transaction reports.
 */
export interface TransactionParams extends ListParams {
  /** Transaction type filter: 'deposit', 'withdrawal', 'fee', 'adjustment' */
  type?: string;
  /** Minimum amount filter in 6 decimal precision */
  minAmount?: string;
  /** Maximum amount filter in 6 decimal precision */
  maxAmount?: string;
}

/**
 * Query parameters for volume reports.
 */
export interface VolumeParams {
  /** Start date (ISO 8601) */
  startDate?: string;
  /** End date (ISO 8601) */
  endDate?: string;
  /** Grouping period: 'day', 'week', 'month' */
  period?: 'day' | 'week' | 'month';
}

/**
 * Query parameters for CSV export.
 */
export interface ExportParams {
  /** Start date (ISO 8601) */
  startDate?: string;
  /** End date (ISO 8601) */
  endDate?: string;
  /** Export type: 'transactions', 'balances', 'disputes' */
  type?: 'transactions' | 'balances' | 'disputes';
}
