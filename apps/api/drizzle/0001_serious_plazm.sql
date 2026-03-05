CREATE TABLE "encrypted_payment_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_address" text NOT NULL,
	"escrow_address" text NOT NULL,
	"encrypted_data" text NOT NULL,
	"iv" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gateway_balances" (
	"merchant_id" uuid NOT NULL,
	"player_ref" text NOT NULL,
	"available_balance" numeric(20, 6) DEFAULT '0' NOT NULL,
	"pending_balance" numeric(20, 6) DEFAULT '0' NOT NULL,
	"total_deposited" numeric(20, 6) DEFAULT '0' NOT NULL,
	"total_withdrawn" numeric(20, 6) DEFAULT '0' NOT NULL,
	"currency" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "gateway_balances_merchant_id_player_ref_currency_pk" PRIMARY KEY("merchant_id","player_ref","currency")
);
--> statement-breakpoint
CREATE TABLE "gateway_disputes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"player_ref" text NOT NULL,
	"reason" text NOT NULL,
	"evidence" jsonb DEFAULT '[]' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"resolution" text,
	"hold_amount" numeric(20, 6),
	"hold_currency" text,
	"resolved_by" text,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gateway_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"player_ref" text NOT NULL,
	"type" text NOT NULL,
	"amount" numeric(20, 6) NOT NULL,
	"currency" text NOT NULL,
	"session_id" uuid,
	"dispute_id" uuid,
	"balance_before" numeric(20, 6) NOT NULL,
	"balance_after" numeric(20, 6) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gateway_pool_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"chain" text NOT NULL,
	"token" text NOT NULL,
	"pool_addresses" jsonb NOT NULL,
	"is_primary" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gateway_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"session_type" text NOT NULL,
	"player_ref" text NOT NULL,
	"amount" numeric(20, 6) NOT NULL,
	"token" text NOT NULL,
	"chain" text NOT NULL,
	"pool_address" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"ephemeral_wallet" text,
	"commitment" text,
	"tx_hash" text,
	"claim_code" text,
	"recipient_address" text,
	"metadata" jsonb,
	"idempotency_key" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "gateway_sessions_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "gateway_webhooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"merchant_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"event" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"next_retry_at" timestamp,
	"last_attempt_at" timestamp,
	"last_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merchants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"wallet_address" text NOT NULL,
	"webhook_url" text,
	"webhook_secret" text NOT NULL,
	"fee_percent" numeric(5, 2) DEFAULT '1.00' NOT NULL,
	"referrer_address" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "merchants_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
ALTER TABLE "gateway_balances" ADD CONSTRAINT "gateway_balances_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gateway_disputes" ADD CONSTRAINT "gateway_disputes_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gateway_disputes" ADD CONSTRAINT "gateway_disputes_session_id_gateway_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."gateway_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gateway_ledger" ADD CONSTRAINT "gateway_ledger_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gateway_ledger" ADD CONSTRAINT "gateway_ledger_session_id_gateway_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."gateway_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gateway_pool_assignments" ADD CONSTRAINT "gateway_pool_assignments_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gateway_sessions" ADD CONSTRAINT "gateway_sessions_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gateway_webhooks" ADD CONSTRAINT "gateway_webhooks_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gateway_webhooks" ADD CONSTRAINT "gateway_webhooks_session_id_gateway_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."gateway_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_wallet_address_users_wallet_address_fk" FOREIGN KEY ("wallet_address") REFERENCES "public"."users"("wallet_address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "encrypted_payment_links_wallet_idx" ON "encrypted_payment_links" USING btree ("wallet_address");--> statement-breakpoint
CREATE INDEX "encrypted_payment_links_escrow_idx" ON "encrypted_payment_links" USING btree ("escrow_address");--> statement-breakpoint
CREATE UNIQUE INDEX "encrypted_payment_links_wallet_escrow_uniq" ON "encrypted_payment_links" USING btree ("wallet_address","escrow_address");--> statement-breakpoint
CREATE INDEX "gateway_balances_merchant_id_idx" ON "gateway_balances" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "gateway_disputes_merchant_id_idx" ON "gateway_disputes" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "gateway_disputes_session_id_idx" ON "gateway_disputes" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "gateway_disputes_status_idx" ON "gateway_disputes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "gateway_disputes_player_ref_idx" ON "gateway_disputes" USING btree ("player_ref");--> statement-breakpoint
CREATE INDEX "gateway_ledger_merchant_id_idx" ON "gateway_ledger" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "gateway_ledger_player_ref_idx" ON "gateway_ledger" USING btree ("player_ref");--> statement-breakpoint
CREATE INDEX "gateway_ledger_session_id_idx" ON "gateway_ledger" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "gateway_ledger_created_at_idx" ON "gateway_ledger" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "gateway_ledger_type_idx" ON "gateway_ledger" USING btree ("type");--> statement-breakpoint
CREATE INDEX "gateway_pool_assignments_merchant_id_idx" ON "gateway_pool_assignments" USING btree ("merchant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "gateway_pool_assignments_merchant_chain_token_uniq" ON "gateway_pool_assignments" USING btree ("merchant_id","chain","token");--> statement-breakpoint
CREATE INDEX "gateway_sessions_merchant_id_idx" ON "gateway_sessions" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "gateway_sessions_player_ref_idx" ON "gateway_sessions" USING btree ("player_ref");--> statement-breakpoint
CREATE INDEX "gateway_sessions_status_idx" ON "gateway_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "gateway_sessions_commitment_idx" ON "gateway_sessions" USING btree ("commitment");--> statement-breakpoint
CREATE INDEX "gateway_sessions_idempotency_key_idx" ON "gateway_sessions" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "gateway_webhooks_merchant_id_idx" ON "gateway_webhooks" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "gateway_webhooks_status_idx" ON "gateway_webhooks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "gateway_webhooks_next_retry_at_idx" ON "gateway_webhooks" USING btree ("next_retry_at");--> statement-breakpoint
CREATE INDEX "merchants_wallet_address_idx" ON "merchants" USING btree ("wallet_address");--> statement-breakpoint
CREATE INDEX "merchants_status_idx" ON "merchants" USING btree ("status");--> statement-breakpoint
ALTER TABLE "escrows_cache" DROP COLUMN "claim_hash";--> statement-breakpoint
ALTER TABLE "escrows_cache" DROP COLUMN "recipient_spend_pubkey";--> statement-breakpoint
ALTER TABLE "escrows_cache" DROP COLUMN "recipient_view_pubkey";--> statement-breakpoint
ALTER TABLE "invoices" DROP COLUMN "claim_secret_hash";--> statement-breakpoint
ALTER TABLE "payments" DROP COLUMN "claim_hash";