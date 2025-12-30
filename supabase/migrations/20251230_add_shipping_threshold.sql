-- Add min_order_free_shipping column to shipping_options table
-- This allows setting a threshold for free shipping per shipping option

ALTER TABLE shipping_options 
ADD COLUMN min_order_free_shipping DECIMAL(10,2) DEFAULT NULL;

COMMENT ON COLUMN shipping_options.min_order_free_shipping IS 'Order subtotal threshold above which shipping is free. NULL means never free (unless covered by other rules).';
