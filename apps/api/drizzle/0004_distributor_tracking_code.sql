-- Migration: Add tracking_code column to distributors table
-- Allows assigning unique tracking codes to each distributor for attribution

ALTER TABLE "distributors" ADD COLUMN IF NOT EXISTS "tracking_code" text UNIQUE;
