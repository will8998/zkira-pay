CREATE TABLE "distributor_commissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"distributor_id" uuid NOT NULL,
	"merchant_id" uuid NOT NULL,
	"session_id" uuid,
	"amount" numeric(20, 6) NOT NULL,
	"currency" text NOT NULL,
	"source_amount" numeric(20, 6) NOT NULL,
	"tier" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "distributor_payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"distributor_id" uuid NOT NULL,
	"amount" numeric(20, 6) NOT NULL,
	"currency" text NOT NULL,
	"tx_hash" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "distributors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"wallet_address" text NOT NULL,
	"parent_id" uuid,
	"tier" text DEFAULT 'agent' NOT NULL,
	"commission_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "distributors_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
CREATE TABLE "ephemeral_wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" text NOT NULL,
	"encrypted_key" text NOT NULL,
	"iv" text NOT NULL,
	"auth_tag" text NOT NULL,
	"chain" text,
	"token" text,
	"amount" text,
	"flow" text,
	"status" text DEFAULT 'active' NOT NULL,
	"tx_hash" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "partner_withdrawals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"distributor_id" uuid NOT NULL,
	"pool_address" text NOT NULL,
	"tx_hash" text NOT NULL,
	"recipient" text NOT NULL,
	"chain" text NOT NULL,
	"denomination" numeric(20, 6),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "partner_withdrawals_tx_hash_unique" UNIQUE("tx_hash")
);
--> statement-breakpoint
ALTER TABLE "gateway_sessions" ADD COLUMN "referrer_address" text;--> statement-breakpoint
ALTER TABLE "gateway_sessions" ADD COLUMN "platform_fee" numeric(20, 6);--> statement-breakpoint
ALTER TABLE "merchants" ADD COLUMN "distributor_id" uuid;--> statement-breakpoint
ALTER TABLE "distributor_commissions" ADD CONSTRAINT "distributor_commissions_distributor_id_distributors_id_fk" FOREIGN KEY ("distributor_id") REFERENCES "public"."distributors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distributor_commissions" ADD CONSTRAINT "distributor_commissions_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distributor_commissions" ADD CONSTRAINT "distributor_commissions_session_id_gateway_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."gateway_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distributor_payouts" ADD CONSTRAINT "distributor_payouts_distributor_id_distributors_id_fk" FOREIGN KEY ("distributor_id") REFERENCES "public"."distributors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_withdrawals" ADD CONSTRAINT "partner_withdrawals_distributor_id_distributors_id_fk" FOREIGN KEY ("distributor_id") REFERENCES "public"."distributors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "distributor_commissions_distributor_id_idx" ON "distributor_commissions" USING btree ("distributor_id");--> statement-breakpoint
CREATE INDEX "distributor_commissions_merchant_id_idx" ON "distributor_commissions" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "distributor_commissions_status_idx" ON "distributor_commissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "distributor_commissions_created_at_idx" ON "distributor_commissions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "distributor_payouts_distributor_id_idx" ON "distributor_payouts" USING btree ("distributor_id");--> statement-breakpoint
CREATE INDEX "distributor_payouts_status_idx" ON "distributor_payouts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "distributors_wallet_address_idx" ON "distributors" USING btree ("wallet_address");--> statement-breakpoint
CREATE INDEX "distributors_parent_id_idx" ON "distributors" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "distributors_status_idx" ON "distributors" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ephemeral_wallets_address_idx" ON "ephemeral_wallets" USING btree ("address");--> statement-breakpoint
CREATE INDEX "ephemeral_wallets_status_idx" ON "ephemeral_wallets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ephemeral_wallets_created_at_idx" ON "ephemeral_wallets" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "partner_withdrawals_distributor_id_idx" ON "partner_withdrawals" USING btree ("distributor_id");--> statement-breakpoint
CREATE INDEX "partner_withdrawals_chain_idx" ON "partner_withdrawals" USING btree ("chain");--> statement-breakpoint
CREATE INDEX "partner_withdrawals_created_at_idx" ON "partner_withdrawals" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_distributor_id_distributors_id_fk" FOREIGN KEY ("distributor_id") REFERENCES "public"."distributors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "merchants_distributor_id_idx" ON "merchants" USING btree ("distributor_id");