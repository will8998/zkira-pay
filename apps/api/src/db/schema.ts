import { pgTable, text, timestamp, numeric, boolean, integer, jsonb, uuid, varchar, bigint, index, uniqueIndex, primaryKey } from 'drizzle-orm/pg-core';

// Users table - tracks wallet addresses and basic stats
export const users = pgTable('users', {
  walletAddress: text('wallet_address').primaryKey(),
  firstSeen: timestamp('first_seen').defaultNow().notNull(),
  lastSeen: timestamp('last_seen').defaultNow().notNull(),
  totalPayments: integer('total_payments').default(0).notNull(),
  totalVolume: numeric('total_volume', { precision: 20, scale: 6 }).default('0').notNull(),
});

// API Keys table - stores hashed API keys for authentication
export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletAddress: text('wallet_address').notNull().references(() => users.walletAddress),
  keyHash: text('key_hash').notNull().unique(),
  keyPrefix: text('key_prefix').notNull(), // e.g. "zkira_sk_...3f8a"
  name: text('name').default('Default').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastUsed: timestamp('last_used'),
  isActive: boolean('is_active').default(true).notNull(),
}, (table) => ({
  walletAddressIdx: index('api_keys_wallet_address_idx').on(table.walletAddress),
}));

// Payments table - stores payment link data
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentId: text('payment_id').unique().notNull(),
  creatorWallet: text('creator_wallet'),
  amount: numeric('amount', { precision: 20, scale: 6 }).notNull(),
  tokenMint: text('token_mint').notNull(),
  // claimHash removed for privacy
  metaAddress: text('meta_address').notNull(),
  escrowAddress: text('escrow_address'),
  status: text('status').default('pending').notNull(), // pending/claimed/expired/refunded
  createdAt: timestamp('created_at').defaultNow().notNull(),
  claimedAt: timestamp('claimed_at'),
  expiresAt: timestamp('expires_at').notNull(),
  txSignature: text('tx_signature'),
}, (table) => ({
  creatorWalletIdx: index('payments_creator_wallet_idx').on(table.creatorWallet),
  statusIdx: index('payments_status_idx').on(table.status),
}));

// Invoices table - stores invoice data
export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  invoiceId: text('invoice_id').unique().notNull(),
  creatorWallet: text('creator_wallet').notNull(),
  amount: numeric('amount', { precision: 20, scale: 6 }).notNull(),
  tokenMint: text('token_mint').notNull(),
  // claimSecretHash removed for privacy
  metaAddress: text('meta_address'),
  status: text('status').default('pending').notNull(), // pending/paid/expired
  createdAt: timestamp('created_at').defaultNow().notNull(),
  paidAt: timestamp('paid_at'),
  expiresAt: timestamp('expires_at'),
  txSignature: text('tx_signature'),
}, (table) => ({
  creatorWalletIdx: index('invoices_creator_wallet_idx').on(table.creatorWallet),
}));

// Transactions table - stores transaction history
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletAddress: text('wallet_address').notNull(),
  type: text('type').notNull(), // sent/received/escrow_created
  amount: numeric('amount', { precision: 20, scale: 6 }).notNull(),
  tokenMint: text('token_mint').notNull(),
  txSignature: text('tx_signature'),
  escrowAddress: text('escrow_address'),
  status: text('status').default('completed').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  metadata: jsonb('metadata'),
}, (table) => ({
  walletAddressIdx: index('transactions_wallet_address_idx').on(table.walletAddress),
}));

// Contacts table - stores user contacts (per wallet)
export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletAddress: text('wallet_address').notNull(),
  contactName: text('contact_name').notNull(),
  contactAddress: text('contact_address').notNull(), // meta address
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  walletAddressIdx: index('contacts_wallet_address_idx').on(table.walletAddress),
}));

// Encrypted payment links — stores client-encrypted payment link data
// Server cannot decrypt these blobs — only the wallet owner can
export const encryptedPaymentLinks = pgTable('encrypted_payment_links', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletAddress: text('wallet_address').notNull(),
  escrowAddress: text('escrow_address').notNull(),
  encryptedData: text('encrypted_data').notNull(), // base64 AES-256-GCM ciphertext
  iv: text('iv').notNull(), // base64 initialization vector
  version: integer('version').default(1).notNull(), // encryption scheme version
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  walletAddressIdx: index('encrypted_payment_links_wallet_idx').on(table.walletAddress),
  escrowAddressIdx: index('encrypted_payment_links_escrow_idx').on(table.escrowAddress),
  uniqueWalletEscrow: uniqueIndex('encrypted_payment_links_wallet_escrow_uniq').on(table.walletAddress, table.escrowAddress),
}));

// Escrows cache table - caches escrow data from indexer
export const escrowsCache = pgTable('escrows_cache', {
  address: text('address').primaryKey(),
  creator: text('creator').notNull(),
  tokenMint: text('token_mint').notNull(),
  amount: text('amount').notNull(),
  // claimHash removed for privacy
  // recipientSpendPubkey removed for privacy
  // recipientViewPubkey removed for privacy
  expiry: bigint('expiry', { mode: 'number' }),
  claimed: boolean('claimed').default(false).notNull(),
  refunded: boolean('refunded').default(false).notNull(),
  feeBps: integer('fee_bps'),
  bump: integer('bump'),
  createdAt: bigint('created_at', { mode: 'number' }),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  creatorIdx: index('escrows_cache_creator_idx').on(table.creator),
}));

// Announcements cache table - caches announcement data from indexer
export const announcementsCache = pgTable('announcements_cache', {
  stealthAddress: text('stealth_address').primaryKey(),
  ephemeralPubkey: text('ephemeral_pubkey').notNull(),
  tokenMint: text('token_mint').notNull(),
  encryptedMetadata: text('encrypted_metadata'),
  timestamp: bigint('timestamp', { mode: 'number' }),
  bump: integer('bump'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Meta addresses cache table - caches meta address data from indexer
export const metaAddressesCache = pgTable('meta_addresses_cache', {
  owner: text('owner').primaryKey(),
  spendPubkey: text('spend_pubkey').notNull(),
  viewPubkey: text('view_pubkey').notNull(),
  label: text('label'),
  bump: integer('bump'),
  createdAt: bigint('created_at', { mode: 'number' }),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ═══════════════════════════════════════════════════════════
// POINTS & REWARDS SYSTEM
// ═══════════════════════════════════════════════════════════

// Point ledger - immutable event log (source of truth)
// Every point change is recorded as an event, never edited
export const pointLedger = pgTable('point_ledger', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletAddress: text('wallet_address').notNull().references(() => users.walletAddress),
  eventType: text('event_type').notNull(), // PAYMENT_SENT, PAYMENT_RECEIVED, INVOICE_CREATED, INVOICE_PAID, ESCROW_CREATED, REFERRAL_SIGNUP, REFERRAL_WELCOME, REFERRAL_COMMISSION, STREAK_BONUS, ADMIN_ADJUSTMENT, WEEKLY_DROP
  points: numeric('points', { precision: 20, scale: 6 }).notNull(), // can be negative for deductions
  metadata: jsonb('metadata'), // { tx_signature, payment_id, reason, multiplier, referrer_wallet, etc. }
  referenceId: text('reference_id'), // idempotency key (e.g., tx signature) to prevent double-counting
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  walletAddressIdx: index('point_ledger_wallet_address_idx').on(table.walletAddress),
  eventTypeIdx: index('point_ledger_event_type_idx').on(table.eventType),
  createdAtIdx: index('point_ledger_created_at_idx').on(table.createdAt),
  referenceIdIdx: index('point_ledger_reference_id_idx').on(table.referenceId),
}));

// Point balances - cached running totals (derived from ledger)
export const pointBalances = pgTable('point_balances', {
  walletAddress: text('wallet_address').primaryKey().references(() => users.walletAddress),
  totalPoints: numeric('total_points', { precision: 20, scale: 6 }).default('0').notNull(),
  weeklyPoints: numeric('weekly_points', { precision: 20, scale: 6 }).default('0').notNull(),
  rank: integer('rank'),
  tier: text('tier').default('operative').notNull(), // phantom, shadow, ghost, agent, operative
  streakWeeks: integer('streak_weeks').default(0).notNull(),
  lastActiveWeek: text('last_active_week'), // ISO week string e.g. '2026-W09'
  flagged: boolean('flagged').default(false).notNull(), // admin can flag suspicious accounts
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  totalPointsIdx: index('point_balances_total_points_idx').on(table.totalPoints),
  rankIdx: index('point_balances_rank_idx').on(table.rank),
}));

// Points config - admin-configurable settings
export const pointsConfig = pgTable('points_config', {
  key: text('key').primaryKey(), // e.g. 'global_multiplier', 'send_rate', 'receive_rate', 'min_qualifying_amount'
  value: text('value').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  updatedBy: text('updated_by'), // admin identifier
});

// ═══════════════════════════════════════════════════════════
// REFERRAL SYSTEM
// ═══════════════════════════════════════════════════════════

// Referral codes - one code per wallet
export const referralCodes = pgTable('referral_codes', {
  code: text('code').primaryKey(), // e.g. 'PRIV-7xKp'
  walletAddress: text('wallet_address').notNull().unique().references(() => users.walletAddress),
  isCustom: boolean('is_custom').default(false).notNull(), // vanity code flag
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  walletAddressIdx: index('referral_codes_wallet_address_idx').on(table.walletAddress),
}));

// Referrals - referrer to referee mappings
export const referrals = pgTable('referrals', {
  id: uuid('id').primaryKey().defaultRandom(),
  referrerWallet: text('referrer_wallet').notNull().references(() => users.walletAddress),
  refereeWallet: text('referee_wallet').notNull().unique().references(() => users.walletAddress),
  referralCode: text('referral_code').notNull().references(() => referralCodes.code),
  status: text('status').default('pending').notNull(), // pending (signed up but no tx) / activated (first qualifying tx) / expired
  activatedAt: timestamp('activated_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  referrerWalletIdx: index('referrals_referrer_wallet_idx').on(table.referrerWallet),
  refereeWalletIdx: index('referrals_referee_wallet_idx').on(table.refereeWallet),
  statusIdx: index('referrals_status_idx').on(table.status),
}));

// ═══════════════════════════════════════════════════════════
// WEBSITE CONTENT MANAGEMENT
// ═══════════════════════════════════════════════════════════

// Page content — one row per marketing page, JSONB blob
export const pageContent = pgTable('page_content', {
  slug: text('slug').primaryKey(),           // e.g. "about", "features/stealth-payments", "home"
  title: text('title').notNull(),            // Human-readable page name for admin list
  content: jsonb('content').notNull(),       // Full page content structure (typed per page)
  seoTitle: text('seo_title'),              // <title> override
  seoDescription: text('seo_description'),  // meta description override
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  updatedBy: text('updated_by'),            // who last edited
  publishedAt: timestamp('published_at'),   // last publish time
});

// Blog posts — replaces MDX files
export const blogPosts = pgTable('blog_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  excerpt: text('excerpt').notNull(),
  content: text('content').notNull(),        // Markdown/MDX body
  author: text('author').notNull(),
  tags: jsonb('tags').$type<string[]>().default([]),
  readTime: text('read_time'),
  published: boolean('published').default(false).notNull(),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  updatedBy: text('updated_by'),
}, (table) => ({
  publishedIdx: index('blog_posts_published_idx').on(table.published),
  slugIdx: index('blog_posts_slug_idx').on(table.slug),
}));

// ═══════════════════════════════════════════════════════════
// CASINO GATEWAY SYSTEM
// ═══════════════════════════════════════════════════════════

// Merchants table - casino operators using the gateway
export const merchants = pgTable('merchants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  walletAddress: text('wallet_address').notNull().unique().references(() => users.walletAddress),
  webhookUrl: text('webhook_url'),
  webhookSecret: text('webhook_secret').notNull(),
  feePercent: numeric('fee_percent', { precision: 5, scale: 2 }).default('1.00').notNull(),
  referrerAddress: text('referrer_address'),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  walletAddressIdx: index('merchants_wallet_address_idx').on(table.walletAddress),
  statusIdx: index('merchants_status_idx').on(table.status),
}));

// Gateway sessions - deposit/withdraw sessions
export const gatewaySessions = pgTable('gateway_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  merchantId: uuid('merchant_id').notNull().references(() => merchants.id),
  sessionType: text('session_type').notNull(),
  playerRef: text('player_ref').notNull(),
  amount: numeric('amount', { precision: 20, scale: 6 }).notNull(),
  token: text('token').notNull(),
  chain: text('chain').notNull(),
  poolAddress: text('pool_address'),
  status: text('status').default('pending').notNull(),
  ephemeralWallet: text('ephemeral_wallet'),
  commitment: text('commitment'),
  txHash: text('tx_hash'),
  claimCode: text('claim_code'),
  recipientAddress: text('recipient_address'),
  metadata: jsonb('metadata'),
  idempotencyKey: text('idempotency_key').unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
}, (table) => ({
  merchantIdIdx: index('gateway_sessions_merchant_id_idx').on(table.merchantId),
  playerRefIdx: index('gateway_sessions_player_ref_idx').on(table.playerRef),
  statusIdx: index('gateway_sessions_status_idx').on(table.status),
  commitmentIdx: index('gateway_sessions_commitment_idx').on(table.commitment),
  idempotencyKeyIdx: index('gateway_sessions_idempotency_key_idx').on(table.idempotencyKey),
}));

// Gateway webhooks - webhook delivery tracking
export const gatewayWebhooks = pgTable('gateway_webhooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  merchantId: uuid('merchant_id').notNull().references(() => merchants.id),
  sessionId: uuid('session_id').notNull().references(() => gatewaySessions.id),
  event: text('event').notNull(),
  payload: jsonb('payload').notNull(),
  status: text('status').default('pending').notNull(),
  attempts: integer('attempts').default(0).notNull(),
  maxAttempts: integer('max_attempts').default(5).notNull(),
  nextRetryAt: timestamp('next_retry_at'),
  lastAttemptAt: timestamp('last_attempt_at'),
  lastError: text('last_error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  merchantIdIdx: index('gateway_webhooks_merchant_id_idx').on(table.merchantId),
  statusIdx: index('gateway_webhooks_status_idx').on(table.status),
  nextRetryAtIdx: index('gateway_webhooks_next_retry_at_idx').on(table.nextRetryAt),
}));

// Gateway balances - player balances per merchant
export const gatewayBalances = pgTable('gateway_balances', {
  merchantId: uuid('merchant_id').notNull().references(() => merchants.id),
  playerRef: text('player_ref').notNull(),
  availableBalance: numeric('available_balance', { precision: 20, scale: 6 }).default('0').notNull(),
  pendingBalance: numeric('pending_balance', { precision: 20, scale: 6 }).default('0').notNull(),
  totalDeposited: numeric('total_deposited', { precision: 20, scale: 6 }).default('0').notNull(),
  totalWithdrawn: numeric('total_withdrawn', { precision: 20, scale: 6 }).default('0').notNull(),
  currency: text('currency').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.merchantId, table.playerRef, table.currency] }),
  merchantIdIdx: index('gateway_balances_merchant_id_idx').on(table.merchantId),
}));

// Gateway ledger - immutable double-entry ledger
export const gatewayLedger = pgTable('gateway_ledger', {
  id: uuid('id').primaryKey().defaultRandom(),
  merchantId: uuid('merchant_id').notNull().references(() => merchants.id),
  playerRef: text('player_ref').notNull(),
  type: text('type').notNull(),
  amount: numeric('amount', { precision: 20, scale: 6 }).notNull(),
  currency: text('currency').notNull(),
  sessionId: uuid('session_id').references(() => gatewaySessions.id),
  disputeId: uuid('dispute_id'),
  balanceBefore: numeric('balance_before', { precision: 20, scale: 6 }).notNull(),
  balanceAfter: numeric('balance_after', { precision: 20, scale: 6 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  merchantIdIdx: index('gateway_ledger_merchant_id_idx').on(table.merchantId),
  playerRefIdx: index('gateway_ledger_player_ref_idx').on(table.playerRef),
  sessionIdIdx: index('gateway_ledger_session_id_idx').on(table.sessionId),
  createdAtIdx: index('gateway_ledger_created_at_idx').on(table.createdAt),
  typeIdx: index('gateway_ledger_type_idx').on(table.type),
}));

// Gateway disputes - dispute management
export const gatewayDisputes = pgTable('gateway_disputes', {
  id: uuid('id').primaryKey().defaultRandom(),
  merchantId: uuid('merchant_id').notNull().references(() => merchants.id),
  sessionId: uuid('session_id').notNull().references(() => gatewaySessions.id),
  playerRef: text('player_ref').notNull(),
  reason: text('reason').notNull(),
  evidence: jsonb('evidence').default('[]').notNull(),
  status: text('status').default('open').notNull(),
  resolution: text('resolution'),
  holdAmount: numeric('hold_amount', { precision: 20, scale: 6 }),
  holdCurrency: text('hold_currency'),
  resolvedBy: text('resolved_by'),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  merchantIdIdx: index('gateway_disputes_merchant_id_idx').on(table.merchantId),
  sessionIdIdx: index('gateway_disputes_session_id_idx').on(table.sessionId),
  statusIdx: index('gateway_disputes_status_idx').on(table.status),
  playerRefIdx: index('gateway_disputes_player_ref_idx').on(table.playerRef),
}));

// Gateway pool assignments - pool contract assignments per merchant
export const gatewayPoolAssignments = pgTable('gateway_pool_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  merchantId: uuid('merchant_id').notNull().references(() => merchants.id),
  chain: text('chain').notNull(),
  token: text('token').notNull(),
  poolAddresses: jsonb('pool_addresses').notNull(),
  isPrimary: boolean('is_primary').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  merchantIdIdx: index('gateway_pool_assignments_merchant_id_idx').on(table.merchantId),
  uniqueMerchantChainToken: uniqueIndex('gateway_pool_assignments_merchant_chain_token_uniq').on(table.merchantId, table.chain, table.token),
}));