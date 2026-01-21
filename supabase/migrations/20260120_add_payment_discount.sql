-- Add discount_percentage column to payment_providers
ALTER TABLE public.payment_providers 
ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC DEFAULT 0;

-- Update create_order_with_payment to handle payment discount
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
  v_payment_discount_percentage NUMERIC := 0;
  v_item_subtotal NUMERIC := 0;
  v_shipping_total NUMERIC := 0;
  v_tax_total NUMERIC := 0;
  v_currency_code TEXT;
  v_shipping_methods JSONB;
  v_payment_collection JSONB;
  v_items_json JSONB;
  v_payment_discount_amount NUMERIC := 0;
  v_promo_code TEXT;
  v_promo_discount NUMERIC := 0;
  v_club_savings NUMERIC := 0;
  v_original_item_subtotal NUMERIC := 0;
BEGIN
  -- 1. Get cart basics, user info and payment data
  SELECT 
    user_id, 
    currency_code, 
    shipping_methods, 
    payment_collection,
    promo_code,
    discount_total
  INTO 
    v_user_id, 
    v_currency_code, 
    v_shipping_methods, 
    v_payment_collection,
    v_promo_code,
    v_promo_discount
  FROM carts
  WHERE id = p_cart_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cart not found';
  END IF;

  -- 2. Check Club Membership and Payment Discount
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

  -- Get payment provider discount
  SELECT discount_percentage INTO v_payment_discount_percentage
  FROM payment_providers
  WHERE id = p_payment_provider AND is_active = true;

  -- 3. Build Items JSON snapshot and calculate subtotal
  -- We also calculate v_original_item_subtotal to derive v_club_savings
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
    SUM(ROUND(COALESCE(pv.price, p.price, 0) * (1 - v_club_discount_percentage / 100)) * ci.quantity),
    SUM(COALESCE(pv.price, p.price, 0) * ci.quantity)
  INTO 
    v_items_json,
    v_item_subtotal,
    v_original_item_subtotal
  FROM cart_items ci
  JOIN products p ON ci.product_id = p.id
  LEFT JOIN product_variants pv ON ci.variant_id = pv.id
  WHERE ci.cart_id = p_cart_id;

  v_club_savings := v_original_item_subtotal - v_item_subtotal;

  -- 4. Calculate payment discount
  IF v_payment_discount_percentage > 0 THEN
    v_payment_discount_amount := ROUND(v_item_subtotal * (v_payment_discount_percentage / 100));
  END IF;

  -- 5. Get Shipping Total (Respect FREE ABOVE threshold)
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

  -- 6. Update cart with addresses and email
  UPDATE carts SET
    email = p_email,
    shipping_address = p_shipping_address,
    billing_address = p_billing_address,
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('rewards_to_apply', p_rewards_to_apply),
    updated_at = NOW()
  WHERE id = p_cart_id;

  -- 7. Create order
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
    promo_code,
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
    (p_rewards_to_apply + v_payment_discount_amount + COALESCE(v_promo_discount, 0)),
    GREATEST(0, v_item_subtotal + v_tax_total + v_shipping_total - p_rewards_to_apply - v_payment_discount_amount - COALESCE(v_promo_discount, 0)),
    GREATEST(0, v_item_subtotal + v_tax_total + v_shipping_total - p_rewards_to_apply - v_payment_discount_amount - COALESCE(v_promo_discount, 0)),
    v_currency_code,
    v_payment_collection,
    v_items_json,
    v_shipping_methods,
    jsonb_build_object(
      'cart_id', p_cart_id, 
      'rewards_used', p_rewards_to_apply,
      'payment_discount_amount', v_payment_discount_amount,
      'payment_discount_percentage', v_payment_discount_percentage,
      'promo_discount', COALESCE(v_promo_discount, 0),
      'promo_code', v_promo_code,
      'club_savings', v_club_savings,
      'club_discount_percentage', v_club_discount_percentage,
      'is_club_member', v_is_club_member
    ),
    v_promo_code,
    'pending',
    'pending',
    'not_shipped',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_order_id;

  -- 8. Return success with order ID
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id
  );

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Order creation failed: %', SQLERRM;
END;
$$;
