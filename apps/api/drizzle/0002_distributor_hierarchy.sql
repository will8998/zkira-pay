-- Distributor hierarchy + gateway session fee wiring
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
ALTER TABLE "merchants" ADD COLUMN "distributor_id" uuid;--> statement-breakpoint
ALTER TABLE "gateway_sessions" ADD COLUMN "referrer_address" text;--> statement-breakpoint
ALTER TABLE "gateway_sessions" ADD COLUMN "platform_fee" numeric(20, 6);--> statement-breakpoint
ALTER TABLE "distributors" ADD CONSTRAINT "distributors_parent_id_distributors_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."distributors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distributor_commissions" ADD CONSTRAINT "distributor_commissions_distributor_id_distributors_id_fk" FOREIGN KEY ("distributor_id") REFERENCES "public"."distributors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distributor_commissions" ADD CONSTRAINT "distributor_commissions_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distributor_commissions" ADD CONSTRAINT "distributor_commissions_session_id_gateway_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."gateway_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "distributor_payouts" ADD CONSTRAINT "distributor_payouts_distributor_id_distributors_id_fk" FOREIGN KEY ("distributor_id") REFERENCES "public"."distributors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_distributor_id_distributors_id_fk" FOREIGN KEY ("distributor_id") REFERENCES "public"."distributors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "distributors_wallet_address_idx" ON "distributors" USING btree ("wallet_address");--> statement-breakpoint
CREATE INDEX "distributors_parent_id_idx" ON "distributors" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "distributors_status_idx" ON "distributors" USING btree ("status");--> statement-breakpoint
CREATE INDEX "merchants_distributor_id_idx" ON "merchants" USING btree ("distributor_id");--> statement-breakpoint
CREATE INDEX "distributor_commissions_distributor_id_idx" ON "distributor_commissions" USING btree ("distributor_id");--> statement-breakpoint
CREATE INDEX "distributor_commissions_merchant_id_idx" ON "distributor_commissions" USING btree ("merchant_id");--> statement-breakpoint
CREATE INDEX "distributor_commissions_status_idx" ON "distributor_commissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "distributor_commissions_created_at_idx" ON "distributor_commissions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "distributor_payouts_distributor_id_idx" ON "distributor_payouts" USING btree ("distributor_id");--> statement-breakpoint
CREATE INDEX "distributor_payouts_status_idx" ON "distributor_payouts" USING btree ("status");
