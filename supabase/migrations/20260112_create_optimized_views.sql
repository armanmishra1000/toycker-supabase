-- =====================================================
-- Optimized Database Views for Storefront and Admin
-- Issue #14 in FIXES_CHECKLIST.md
-- =====================================================
-- Fixed: Removed non-existent 'phone' column from profiles join
-- =====================================================

BEGIN;

-- 1. Products with Variants View
-- Simplifies fetching products along with their first variant or aggregate data
CREATE OR REPLACE VIEW public.products_with_variants AS
SELECT 
    p.*,
    (
        SELECT jsonb_agg(v.*)
        FROM public.product_variants v
        WHERE v.product_id = p.id
    ) as variants_data,
    COALESCE(
        (SELECT min(price) FROM public.product_variants v WHERE v.product_id = p.id),
        p.price
    ) as min_price,
    COALESCE(
        (SELECT sum(inventory_quantity) FROM public.product_variants v WHERE v.product_id = p.id),
        p.stock_count
    ) as total_inventory
FROM 
    public.products p;

-- 2. Order Details View
-- Joins orders with basic profile data. 
-- Note: first_name/last_name/phone are typically in auth.users metadata in this project.
CREATE OR REPLACE VIEW public.order_details_view AS
SELECT 
    o.*,
    p.role as user_role
FROM 
    public.orders o
LEFT JOIN 
    public.profiles p ON o.user_id = p.id;

-- 3. Cart Items with Products View
-- Useful for calculating totals and displaying cart contents without manual joins
CREATE OR REPLACE VIEW public.cart_items_extended AS
SELECT 
    ci.*,
    p.name as product_name,
    p.handle as product_handle,
    p.image_url as product_thumbnail,
    v.title as variant_title,
    v.sku as variant_sku
FROM 
    public.cart_items ci
JOIN 
    public.products p ON ci.product_id = p.id
LEFT JOIN 
    public.product_variants v ON ci.variant_id = v.id;

COMMIT;
