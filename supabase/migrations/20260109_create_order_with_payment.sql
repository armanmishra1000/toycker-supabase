-- Refactor the atomic order creation function to use the correct schema
-- 1. Remove dependency on non-existent order_items table
-- 2. Use the "items" JSONB column in the "orders" table for line items
-- 3. Include "shipping_methods" snapshot in the order creation
-- 4. Remove the non-existent "completed_at" column update on the carts table
-- 5. Ensure all totals and club discounts are accurately captured in the JSONB snapshot
-- 6. Fix for React unique key warning: Include original item ID in the snapshot
-- 7. Fix for Shipping Threshold: Respect free shipping threshold in order total calculation

CREATE OR REPLACE FUNCTION create_order_with_payment(
  p_cart_id TEXT,
  p_email TEXT,
  p_shipping_address JSONB,
  p_billing_address JSONB,
  p_payment_provider TEXT,
  p_rewards_to_apply INTEGER DEFAULT 0
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id TEXT;
  v_user_id UUID;
  v_is_club_member BOOLEAN := FALSE;
  v_club_discount_percentage NUMERIC := 0;
  v_item_subtotal NUMERIC := 0;
  v_shipping_total NUMERIC := 0;
  v_tax_total NUMERIC := 0;
  v_currency_code TEXT;
  v_shipping_methods JSONB;
  v_payment_collection JSONB;
  v_items_json JSONB;
BEGIN
  -- 1. Get cart basics, user info and payment data
  SELECT 
    user_id, 
    currency_code, 
    shipping_methods, 
    payment_collection 
  INTO 
    v_user_id, 
    v_currency_code, 
    v_shipping_methods, 
    v_payment_collection
  FROM carts
  WHERE id = p_cart_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cart not found';
  END IF;

  -- 2. Check Club Membership
  IF v_user_id IS NOT NULL THEN
    SELECT is_club_member INTO v_is_club_member
    FROM profiles
    WHERE id = v_user_id;

    IF v_is_club_member THEN
      SELECT discount_percentage INTO v_club_discount_percentage
      FROM club_settings
      WHERE is_active = true
      LIMIT 1;
    END IF;
  END IF;

  -- 3. Build Items JSON snapshot and calculate subtotal
  SELECT 
    jsonb_agg(
      jsonb_build_object(
        'id', ci.id,
        'product_id', ci.product_id,
        'variant_id', ci.variant_id,
        'title', COALESCE(pv.title, p.name, 'Product'),
        'quantity', ci.quantity,
        'unit_price', ROUND(COALESCE(pv.price, p.price, 0) * (1 - v_club_discount_percentage / 100)),
        'total', ROUND(COALESCE(pv.price, p.price, 0) * (1 - v_club_discount_percentage / 100)) * ci.quantity,
        'metadata', ci.metadata,
        'thumbnail', p.image_url,
        'created_at', ci.created_at
      )
    ),
    SUM(ROUND(COALESCE(pv.price, p.price, 0) * (1 - v_club_discount_percentage / 100)) * ci.quantity)
  INTO 
    v_items_json,
    v_item_subtotal
  FROM cart_items ci
  JOIN products p ON ci.product_id = p.id
  LEFT JOIN product_variants pv ON ci.variant_id = pv.id
  WHERE ci.cart_id = p_cart_id;

  -- 4. Get Shipping Total (Respect FREE ABOVE threshold)
  IF v_shipping_methods IS NOT NULL AND jsonb_array_length(v_shipping_methods) > 0 THEN
    DECLARE
      v_method JSONB := v_shipping_methods->-1;
      v_amount NUMERIC := (v_method->>'amount')::NUMERIC;
      v_threshold NUMERIC := (v_method->>'min_order_free_shipping')::NUMERIC;
    BEGIN
      IF v_threshold IS NOT NULL AND v_item_subtotal >= v_threshold THEN
        v_shipping_total := 0;
      ELSE
        v_shipping_total := COALESCE(v_amount, 0);
      END IF;
    END;
  END IF;

  -- 5. Update cart with addresses and email
  UPDATE carts SET
    email = p_email,
    shipping_address = p_shipping_address,
    billing_address = p_billing_address,
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('rewards_to_apply', p_rewards_to_apply),
    updated_at = NOW()
  WHERE id = p_cart_id;

  -- 6. Create order (storing items and shipping_methods in JSONB columns)
  INSERT INTO orders (
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
    p_rewards_to_apply,
    GREATEST(0, v_item_subtotal + v_tax_total + v_shipping_total - p_rewards_to_apply),
    GREATEST(0, v_item_subtotal + v_tax_total + v_shipping_total - p_rewards_to_apply),
    v_currency_code,
    v_payment_collection,
    v_items_json,
    v_shipping_methods,
    jsonb_build_object('cart_id', p_cart_id, 'rewards_used', p_rewards_to_apply),
    'pending',
    'pending',
    'not_shipped',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_order_id;

  -- 7. Return success with order ID
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id
  );

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Order creation failed: %', SQLERRM;
END;
$$;
