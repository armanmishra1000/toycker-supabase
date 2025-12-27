-- 1. Create temporary schema for migration
CREATE SCHEMA IF NOT EXISTS medusa_migration;

-- 2. Data Transformation Script
-- This script assumes you have imported the following Medusa V2 tables into 'medusa_migration' schema:
-- product, product_variant, price, image, product_images

INSERT INTO public.products (
    id, 
    handle, 
    name, 
    description, 
    price, 
    image_url,
    stock_count,
    metadata
)
SELECT 
    p.id, 
    p.handle, 
    p.title as name, 
    p.description,
    COALESCE(pr.amount / 100.0, 0) as price, -- Convert cents to decimal
    img.url as image_url,
    COALESCE(pv.inventory_quantity, 0) as stock_count,
    p.metadata
FROM medusa_migration.product p
LEFT JOIN medusa_migration.product_variant pv ON pv.product_id = p.id
-- Get the first price available for the variant
LEFT JOIN (
    SELECT variant_id, MIN(amount) as amount 
    FROM medusa_migration.price 
    GROUP BY variant_id
) pr ON pr.variant_id = pv.id
-- Get the first image associated with the product
LEFT JOIN (
    SELECT product_id, MIN(image_id) as image_id 
    FROM medusa_migration.product_images 
    GROUP BY product_id
) pi ON pi.product_id = p.id
LEFT JOIN medusa_migration.image img ON img.id = pi.image_id
ON CONFLICT (handle) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    image_url = EXCLUDED.image_url,
    stock_count = EXCLUDED.stock_count,
    metadata = EXCLUDED.metadata;

-- 3. Cleanup (Run this ONLY after verifying data in public.products)
-- DROP SCHEMA medusa_migration CASCADE;
