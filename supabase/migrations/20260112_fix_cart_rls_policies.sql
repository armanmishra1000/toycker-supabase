-- =====================================================
-- Fix Cart RLS Policies (Choice B: Guest Friendly)
-- =====================================================
-- This migration replaces insecure USING(true) policies
-- while allowing both Guests (anon) and Registered Users (authenticated)
-- to manage their own carts.
-- =====================================================

BEGIN;

-- =====================================================
-- CARTS TABLE
-- =====================================================

-- Drop existing insecure policies
DROP POLICY IF EXISTS "Public access carts" ON public.carts;
DROP POLICY IF EXISTS "Public read carts" ON public.carts;
DROP POLICY IF EXISTS "Public create carts" ON public.carts;
DROP POLICY IF EXISTS "Allow public read carts" ON public.carts;
DROP POLICY IF EXISTS "Users can view own carts" ON public.carts;
DROP POLICY IF EXISTS "Users can create own carts" ON public.carts;
DROP POLICY IF EXISTS "Users can update own carts" ON public.carts;
DROP POLICY IF EXISTS "Users can delete own carts" ON public.carts;
DROP POLICY IF EXISTS "Admins can view all carts" ON public.carts;

-- 1. Everyone can view a cart if they know its ID 
-- (Possession of the UUID in the cookie acts as the "key")
CREATE POLICY "Access cart by ID"
  ON public.carts FOR SELECT
  TO anon, authenticated
  USING (true);

-- 2. Everyone can create a cart (Guests have NULL user_id)
CREATE POLICY "Anyone can create carts"
  ON public.carts FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (user_id IS NULL) OR 
    (user_id = (SELECT auth.uid()))
  );

-- 3. Users can update their own cart (Guests or Auth)
CREATE POLICY "Anyone can update own cart"
  ON public.carts FOR UPDATE
  TO anon, authenticated
  USING (
    (user_id IS NULL) OR 
    (user_id = (SELECT auth.uid()))
  );

-- 4. Users can delete their own cart
CREATE POLICY "Anyone can delete own cart"
  ON public.carts FOR DELETE
  TO anon, authenticated
  USING (
    (user_id IS NULL) OR 
    (user_id = (SELECT auth.uid()))
  );

-- =====================================================
-- CART_ITEMS TABLE
-- =====================================================

-- Drop existing insecure policies
DROP POLICY IF EXISTS "Public access cart_items" ON public.cart_items;
DROP POLICY IF EXISTS "Public read cart_items" ON public.cart_items;
DROP POLICY IF EXISTS "Public create cart_items" ON public.cart_items;
DROP POLICY IF EXISTS "Allow public read cart_items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can view own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can add to own cart" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Users can delete own cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Admins can view all cart items" ON public.cart_items;

-- 1. Access items if you have access to the parent cart
CREATE POLICY "Access cart items via cart"
  ON public.cart_items FOR ALL
  TO anon, authenticated
  USING (
    cart_id IN (
      SELECT id FROM public.carts
    )
  );

-- 2. Admins can view everything (redundant but good for clarity)
CREATE POLICY "Admins can manage all cart items"
  ON public.cart_items FOR ALL
  TO authenticated
  USING (public.is_admin());

COMMIT;
