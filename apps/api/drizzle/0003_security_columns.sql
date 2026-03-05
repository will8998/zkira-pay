-- Migration: Add security columns for per-record salt and merchant allowed origins
-- T0.2: Foundation for T1.1 (per-record encryption salt) and T1.5 (dynamic CORS)

-- Add salt column to ephemeral_wallets for per-record encryption key derivation
ALTER TABLE "ephemeral_wallets" ADD COLUMN IF NOT EXISTS "salt" text;

-- Add allowed_origins column to merchants for dynamic CORS whitelist
ALTER TABLE "merchants" ADD COLUMN IF NOT EXISTS "allowed_origins" text[];
