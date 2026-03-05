import { pgTable, text, timestamp, boolean, uuid, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';

// ═══════════════════════════════════════════════════════════
// DEAD DROP — encrypted note exchange for Send flow
// ═══════════════════════════════════════════════════════════

export const deadDropNotes = pgTable('dead_drop_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** SHA-256 hash of the claim code — server never sees the raw code. */
  dropId: text('drop_id').notNull().unique(),
  /** AES-GCM encrypted DepositBundle: { ciphertext, nonce, version }. */
  payload: jsonb('payload').notNull(),
  /** Whether the recipient has retrieved this drop. */
  claimed: boolean('claimed').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  /** Kept for schema compat — no expiry enforced (far-future sentinel). */
  expiresAt: timestamp('expires_at').notNull(),
}, (table) => ({
  dropIdIdx: uniqueIndex('dead_drop_notes_drop_id_idx').on(table.dropId),
  expiresAtIdx: index('dead_drop_notes_expires_at_idx').on(table.expiresAt),
}));

// ═══════════════════════════════════════════════════════════
// INVOICE V2 — Request Payment flow
// ═══════════════════════════════════════════════════════════

export const invoicesV2 = pgTable('invoices_v2', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** Public invoice identifier shared with payer. */
  invoiceId: text('invoice_id').notNull().unique(),
  /** Chain: 'arbitrum' | 'tron'. */
  chain: text('chain').notNull(),
  /** Token: 'usdc' | 'usdt' | 'dai'. */
  token: text('token').notNull(),
  /** Array of { pool address, count } denomination selections. */
  denominations: jsonb('denominations').notNull(),
  /** Total in raw token units (string because bigint). */
  totalRaw: text('total_raw').notNull(),
  /** Formatted total e.g. "2,500 USDC". */
  totalLabel: text('total_label').notNull(),
  /** Requester's X25519 public key (base64). Payer encrypts notes to this. */
  recipientPubkey: text('recipient_pubkey').notNull(),
  /** Optional memo / description. */
  memo: text('memo'),
  /** pending → funded → withdrawn. */
  status: text('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
}, (table) => ({
  invoiceIdIdx: uniqueIndex('invoices_v2_invoice_id_idx').on(table.invoiceId),
  statusIdx: index('invoices_v2_status_idx').on(table.status),
}));

// ═══════════════════════════════════════════════════════════
// INVOICE NOTES — encrypted deposit notes attached to invoices
// ═══════════════════════════════════════════════════════════

export const invoiceNotes = pgTable('invoice_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** Links to invoicesV2.invoiceId. */
  invoiceId: text('invoice_id').notNull(),
  /** NaCl box encrypted DepositNoteRecord (base64). */
  ciphertext: text('ciphertext').notNull(),
  /** NaCl box nonce (base64). */
  nonce: text('nonce').notNull(),
  /** Payer's ephemeral X25519 public key (base64). */
  ephemeralPubkey: text('ephemeral_pubkey').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  invoiceIdIdx: index('invoice_notes_invoice_id_idx').on(table.invoiceId),
}));
