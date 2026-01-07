-- Fix order_id type mismatch in reward_transactions
-- Current type is UUID but Medusa order IDs are TEXT
ALTER TABLE reward_transactions ALTER COLUMN order_id TYPE TEXT;
