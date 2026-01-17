-- Reset orders and display_id sequence
-- This migration deletes all existing orders and resets the auto-incrementing display_id to 1.
-- Useful for resetting the store state.

BEGIN;

-- 1. Delete all orders (this will cascade to order_items)
DELETE FROM public.orders;

-- 2. Reset the sequence for display_id
-- The sequence name is typically table_column_seq
ALTER SEQUENCE IF EXISTS public.orders_display_id_seq RESTART WITH 1;

COMMIT;
