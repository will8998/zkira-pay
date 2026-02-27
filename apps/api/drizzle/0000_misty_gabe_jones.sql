CREATE TABLE "announcements_cache" (
	"stealth_address" text PRIMARY KEY NOT NULL,
	"ephemeral_pubkey" text NOT NULL,
	"token_mint" text NOT NULL,
	"encrypted_metadata" text,
	"timestamp" bigint,
	"bump" integer,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_address" text NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" text NOT NULL,
	"name" text DEFAULT 'Default' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"excerpt" text NOT NULL,
	"content" text NOT NULL,
	"author" text NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"read_time" text,
	"published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_address" text NOT NULL,
	"contact_name" text NOT NULL,
	"contact_address" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "escrows_cache" (
	"address" text PRIMARY KEY NOT NULL,
	"creator" text NOT NULL,
	"token_mint" text NOT NULL,
	"amount" text NOT NULL,
	"claim_hash" text NOT NULL,
	"recipient_spend_pubkey" text,
	"recipient_view_pubkey" text,
	"expiry" bigint,
	"claimed" boolean DEFAULT false NOT NULL,
	"refunded" boolean DEFAULT false NOT NULL,
	"fee_bps" integer,
	"bump" integer,
	"created_at" bigint,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" text NOT NULL,
	"creator_wallet" text NOT NULL,
	"amount" numeric(20, 6) NOT NULL,
	"token_mint" text NOT NULL,
	"claim_secret_hash" text,
	"meta_address" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp,
	"expires_at" timestamp,
	"tx_signature" text,
	CONSTRAINT "invoices_invoice_id_unique" UNIQUE("invoice_id")
);
--> statement-breakpoint
CREATE TABLE "meta_addresses_cache" (
	"owner" text PRIMARY KEY NOT NULL,
	"spend_pubkey" text NOT NULL,
	"view_pubkey" text NOT NULL,
	"label" text,
	"bump" integer,
	"created_at" bigint,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_content" (
	"slug" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" jsonb NOT NULL,
	"seo_title" text,
	"seo_description" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text,
	"published_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" text NOT NULL,
	"creator_wallet" text,
	"amount" numeric(20, 6) NOT NULL,
	"token_mint" text NOT NULL,
	"claim_hash" text NOT NULL,
	"meta_address" text NOT NULL,
	"escrow_address" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"claimed_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"tx_signature" text,
	CONSTRAINT "payments_payment_id_unique" UNIQUE("payment_id")
);
--> statement-breakpoint
CREATE TABLE "point_balances" (
	"wallet_address" text PRIMARY KEY NOT NULL,
	"total_points" numeric(20, 6) DEFAULT '0' NOT NULL,
	"weekly_points" numeric(20, 6) DEFAULT '0' NOT NULL,
	"rank" integer,
	"tier" text DEFAULT 'operative' NOT NULL,
	"streak_weeks" integer DEFAULT 0 NOT NULL,
	"last_active_week" text,
	"flagged" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "point_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_address" text NOT NULL,
	"event_type" text NOT NULL,
	"points" numeric(20, 6) NOT NULL,
	"metadata" jsonb,
	"reference_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "points_config" (
	"key" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"updated_by" text
);
--> statement-breakpoint
CREATE TABLE "referral_codes" (
	"code" text PRIMARY KEY NOT NULL,
	"wallet_address" text NOT NULL,
	"is_custom" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referral_codes_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_wallet" text NOT NULL,
	"referee_wallet" text NOT NULL,
	"referral_code" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"activated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referrals_referee_wallet_unique" UNIQUE("referee_wallet")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_address" text NOT NULL,
	"type" text NOT NULL,
	"amount" numeric(20, 6) NOT NULL,
	"token_mint" text NOT NULL,
	"tx_signature" text,
	"escrow_address" text,
	"status" text DEFAULT 'completed' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "users" (
	"wallet_address" text PRIMARY KEY NOT NULL,
	"first_seen" timestamp DEFAULT now() NOT NULL,
	"last_seen" timestamp DEFAULT now() NOT NULL,
	"total_payments" integer DEFAULT 0 NOT NULL,
	"total_volume" numeric(20, 6) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_wallet_address_users_wallet_address_fk" FOREIGN KEY ("wallet_address") REFERENCES "public"."users"("wallet_address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_balances" ADD CONSTRAINT "point_balances_wallet_address_users_wallet_address_fk" FOREIGN KEY ("wallet_address") REFERENCES "public"."users"("wallet_address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "point_ledger" ADD CONSTRAINT "point_ledger_wallet_address_users_wallet_address_fk" FOREIGN KEY ("wallet_address") REFERENCES "public"."users"("wallet_address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_wallet_address_users_wallet_address_fk" FOREIGN KEY ("wallet_address") REFERENCES "public"."users"("wallet_address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_wallet_users_wallet_address_fk" FOREIGN KEY ("referrer_wallet") REFERENCES "public"."users"("wallet_address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referee_wallet_users_wallet_address_fk" FOREIGN KEY ("referee_wallet") REFERENCES "public"."users"("wallet_address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referral_code_referral_codes_code_fk" FOREIGN KEY ("referral_code") REFERENCES "public"."referral_codes"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_keys_wallet_address_idx" ON "api_keys" USING btree ("wallet_address");--> statement-breakpoint
CREATE INDEX "blog_posts_published_idx" ON "blog_posts" USING btree ("published");--> statement-breakpoint
CREATE INDEX "blog_posts_slug_idx" ON "blog_posts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "contacts_wallet_address_idx" ON "contacts" USING btree ("wallet_address");--> statement-breakpoint
CREATE INDEX "escrows_cache_creator_idx" ON "escrows_cache" USING btree ("creator");--> statement-breakpoint
CREATE INDEX "invoices_creator_wallet_idx" ON "invoices" USING btree ("creator_wallet");--> statement-breakpoint
CREATE INDEX "payments_creator_wallet_idx" ON "payments" USING btree ("creator_wallet");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "point_balances_total_points_idx" ON "point_balances" USING btree ("total_points");--> statement-breakpoint
CREATE INDEX "point_balances_rank_idx" ON "point_balances" USING btree ("rank");--> statement-breakpoint
CREATE INDEX "point_ledger_wallet_address_idx" ON "point_ledger" USING btree ("wallet_address");--> statement-breakpoint
CREATE INDEX "point_ledger_event_type_idx" ON "point_ledger" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "point_ledger_created_at_idx" ON "point_ledger" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "point_ledger_reference_id_idx" ON "point_ledger" USING btree ("reference_id");--> statement-breakpoint
CREATE INDEX "referral_codes_wallet_address_idx" ON "referral_codes" USING btree ("wallet_address");--> statement-breakpoint
CREATE INDEX "referrals_referrer_wallet_idx" ON "referrals" USING btree ("referrer_wallet");--> statement-breakpoint
CREATE INDEX "referrals_referee_wallet_idx" ON "referrals" USING btree ("referee_wallet");--> statement-breakpoint
CREATE INDEX "referrals_status_idx" ON "referrals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transactions_wallet_address_idx" ON "transactions" USING btree ("wallet_address");