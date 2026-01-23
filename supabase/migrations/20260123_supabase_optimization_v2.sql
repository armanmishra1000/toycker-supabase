-- =====================================================
-- Supabase Security and Performance Optimization v2
-- =====================================================
-- Addressing 46 issues identified in the Dashboard
-- =====================================================

BEGIN;

-- =====================================================
-- PHASE 1: SECURITY HARDENING
-- =====================================================

-- -----------------------------------------------------
-- 1. Enable RLS on search_analytics and global_settings
-- -----------------------------------------------------

ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- 2. Access Policies for search_analytics
-- -----------------------------------------------------

DROP POLICY IF EXISTS "Public can insert search_analytics" ON public.search_analytics;
DROP POLICY IF EXISTS "Admins can manage search_analytics" ON public.search_analytics;

-- Allow anyone to track search (Append-only)
CREATE POLICY "Public can insert search_analytics"
  ON public.search_analytics FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow admins to view search reports (Protects session_id/user_id)
CREATE POLICY "Admins can manage search_analytics"
  ON public.search_analytics FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------
-- 3. Access Policies for global_settings
-- -----------------------------------------------------

DROP POLICY IF EXISTS "Public read global_settings" ON public.global_settings;
DROP POLICY IF EXISTS "Admins manage global_settings" ON public.global_settings;

-- Allow anyone to read settings (e.g., gift wrap fee)
CREATE POLICY "Public read global_settings"
  ON public.global_settings FOR SELECT
  TO public
  USING (true);

-- Allow admins to update settings
CREATE POLICY "Admins manage global_settings"
  ON public.global_settings FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- -----------------------------------------------------
-- 4. Secure Functions (search_path & SECURITY DEFINER)
-- -----------------------------------------------------

-- Fix: track_search_rpc
-- Adding SECURITY DEFINER allows it to write to search_analytics even if user has no RLS insert permissions
CREATE OR REPLACE FUNCTION public.track_search_rpc(
  p_query TEXT,
  p_type TEXT,
  p_results_count INT,
  p_user_id TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_duration_ms INT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.search_analytics (
    search_query, search_type, results_count, 
    user_id, session_id, search_duration_ms
  )
  VALUES (
    p_query, p_type, p_results_count,
    p_user_id, p_session_id, p_duration_ms
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$;

-- Fix: create_order_with_payment (Ensuring search_path is safe)
-- Note: Logic is preserved from 20260113_gift_wrap_feature.sql
CREATE OR REPLACE FUNCTION public.create_order_with_payment(
  p_cart_id TEXT,
  p_email TEXT,
  p_shipping_address JSONB,
  p_billing_address JSONB,
  p_payment_provider TEXT,
  p_rewards_to_apply INTEGER DEFAULT 0
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order_id TEXT;
  v_user_id UUID;
  v_is_club_member BOOLEAN := FALSE;
  v_club_discount_percentage NUMERIC := 0;
  v_club_savings NUMERIC := 0;
  v_promo_discount NUMERIC := 0;
  v_item_subtotal NUMERIC := 0;
  v_item_subtotal_before_club NUMERIC := 0;
  v_shipping_total NUMERIC := 0;
  v_tax_total NUMERIC := 0;
  v_total_discount NUMERIC := 0;
  v_final_total NUMERIC := 0;
  v_currency_code TEXT := 'INR';
  v_shipping_methods JSONB;
  v_payment_collection JSONB;
  v_items_json JSONB := '[]'::jsonb;
  v_cart_discount_total NUMERIC := 0;
  v_gift_wrap_setting_fee NUMERIC := 0;
BEGIN
  -- 1. Get cart data
  SELECT 
    user_id, 
    COALESCE(currency_code, 'INR'), 
    shipping_methods, 
    payment_collection,
    COALESCE(discount_total, 0)
  INTO 
    v_user_id, 
    v_currency_code, 
    v_shipping_methods, 
    v_payment_collection,
    v_cart_discount_total
  FROM public.carts
  WHERE id = p_cart_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cart not found';
  END IF;

  -- 2. Get Gift Wrap Fee from Settings
  SELECT COALESCE(gift_wrap_fee, 0) INTO v_gift_wrap_setting_fee
  FROM public.global_settings
  WHERE id = 'default'
  LIMIT 1;

  -- 3. Check Club Membership
  IF v_user_id IS NOT NULL THEN
    SELECT COALESCE(is_club_member, FALSE) INTO v_is_club_member
    FROM public.profiles
    WHERE id = v_user_id;

    IF v_is_club_member THEN
      SELECT COALESCE(discount_percentage, 0) INTO v_club_discount_percentage
      FROM public.club_settings
      WHERE is_active = true
      LIMIT 1;
    END IF;
  END IF;

  -- 4. Build Items JSON and calculate subtotals (Including Gift Wrap)
  SELECT 
    COALESCE(jsonb_agg(
      jsonb_build_object(
        'id', ci.id,
        'product_id', ci.product_id,
        'variant_id', ci.variant_id,
        'title', CASE 
          WHEN COALESCE((ci.metadata->>'gift_wrap_line')::boolean, false) = true THEN 'Gift Wrap'
          ELSE COALESCE(pv.title, p.name, 'Product')
        END,
        'product_title', COALESCE(p.name, 'Product'),
        'quantity', ci.quantity,
        'unit_price', CASE 
          WHEN COALESCE((ci.metadata->>'gift_wrap_line')::boolean, false) = true THEN COALESCE((ci.metadata->>'gift_wrap_fee')::numeric, v_gift_wrap_setting_fee)
          ELSE ROUND(COALESCE(pv.price, p.price, 0) * (1 - v_club_discount_percentage / 100))
        END,
        'total', (CASE 
          WHEN COALESCE((ci.metadata->>'gift_wrap_line')::boolean, false) = true THEN COALESCE((ci.metadata->>'gift_wrap_fee')::numeric, v_gift_wrap_setting_fee)
          ELSE ROUND(COALESCE(pv.price, p.price, 0) * (1 - v_club_discount_percentage / 100))
        END) * ci.quantity,
        'metadata', COALESCE(ci.metadata, '{}'::jsonb),
        'thumbnail', CASE WHEN COALESCE((ci.metadata->>'gift_wrap_line')::boolean, false) = true THEN NULL ELSE p.image_url END,
        'variant', CASE 
          WHEN COALESCE((ci.metadata->>'gift_wrap_line')::boolean, false) = true THEN NULL
          WHEN pv.id IS NOT NULL THEN jsonb_build_object('title', pv.title, 'id', pv.id)
          ELSE NULL
        END,
        'created_at', ci.created_at
      )
    ), '[]'::jsonb),
    COALESCE(SUM((CASE 
      WHEN COALESCE((ci.metadata->>'gift_wrap_line')::boolean, false) = true THEN COALESCE((ci.metadata->>'gift_wrap_fee')::numeric, v_gift_wrap_setting_fee)
      ELSE ROUND(COALESCE(pv.price, p.price, 0) * (1 - v_club_discount_percentage / 100))
    END) * ci.quantity), 0),
    COALESCE(SUM((CASE 
      WHEN COALESCE((ci.metadata->>'gift_wrap_line')::boolean, false) = true THEN COALESCE((ci.metadata->>'gift_wrap_fee')::numeric, v_gift_wrap_setting_fee)
      ELSE COALESCE(pv.price, p.price, 0)
    END) * ci.quantity), 0)
  INTO 
    v_items_json,
    v_item_subtotal,
    v_item_subtotal_before_club
  FROM public.cart_items ci
  LEFT JOIN public.products p ON ci.product_id = p.id
  LEFT JOIN public.product_variants pv ON ci.variant_id = pv.id
  WHERE ci.cart_id = p_cart_id;

  -- Calculate discounts
  v_club_savings := COALESCE(v_item_subtotal_before_club - v_item_subtotal, 0);
  v_promo_discount := COALESCE(v_cart_discount_total, 0);
  v_total_discount := COALESCE(p_rewards_to_apply, 0) + v_promo_discount;

  -- Calculate Shipping
  v_shipping_total := 0;
  IF v_shipping_methods IS NOT NULL AND jsonb_array_length(v_shipping_methods) > 0 THEN
    DECLARE
      v_method JSONB := v_shipping_methods->-1;
      v_amount NUMERIC := COALESCE((v_method->>'amount')::NUMERIC, 0);
      v_threshold NUMERIC := (v_method->>'min_order_free_shipping')::NUMERIC;
    BEGIN
      IF v_threshold IS NOT NULL AND v_item_subtotal >= v_threshold THEN
        v_shipping_total := 0;
      ELSE
        v_shipping_total := v_amount;
      END IF;
    END;
  END IF;

  -- Calculate final total
  v_final_total := GREATEST(0, v_item_subtotal + COALESCE(v_tax_total, 0) + v_shipping_total - v_total_discount);

  -- Update cart
  UPDATE public.carts SET
    email = p_email,
    shipping_address = p_shipping_address,
    billing_address = p_billing_address,
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('rewards_to_apply', COALESCE(p_rewards_to_apply, 0)),
    updated_at = NOW()
  WHERE id = p_cart_id;

  -- Create order
  INSERT INTO public.orders (
    user_id,
    email,
    customer_email,
    shipping_address,
    billing_address,
    subtotal,
    tax_total,
    shipping_total,
    discount_total,
    total_amount,
    total,
    currency_code,
    payment_collection,
    items,
    shipping_methods,
    metadata,
    status,
    payment_status,
    fulfillment_status,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    p_email,
    p_email,
    p_shipping_address,
    p_billing_address,
    v_item_subtotal,
    v_tax_total,
    v_shipping_total,
    v_total_discount,
    v_final_total,
    v_final_total,
    v_currency_code,
    v_payment_collection,
    v_items_json,
    v_shipping_methods,
    jsonb_build_object(
      'cart_id', p_cart_id, 
      'rewards_used', COALESCE(p_rewards_to_apply, 0),
      'rewards_discount', COALESCE(p_rewards_to_apply, 0),
      'club_savings', v_club_savings,
      'promo_discount', v_promo_discount,
      'is_club_member', v_is_club_member,
      'club_discount_percentage', v_club_discount_percentage
    ),
    'pending',
    'pending',
    'not_shipped',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id
  );

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Order creation failed: %', SQLERRM;
END;
$$;

-- Fix: update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Fix: is_admin (Hardening)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admin_roles
    WHERE user_id = auth.uid()
      AND is_active = true
  );
END;
$$;

-- =====================================================
-- PHASE 2: PERFORMANCE OPTIMIZATION
-- =====================================================

-- -----------------------------------------------------
-- 5. Add Recommended Indexes
-- -----------------------------------------------------

-- Optimize product sorting by creation date
CREATE INDEX IF NOT EXISTS products_created_at_desc_idx ON public.products (created_at DESC);

-- Optimize relationship lookups for collections
CREATE INDEX IF NOT EXISTS product_collections_product_id_idx ON public.product_collections (product_id);

-- Optimize text-based search/filter on short_description
CREATE INDEX IF NOT EXISTS products_short_description_trgm_idx ON public.products USING GIN (short_description gin_trgm_ops);

COMMIT;
