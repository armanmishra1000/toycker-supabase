-- Enable Realtime for orders table to support the Track Order feature
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Relax RLS policy to allow customers to see their own orders even if 'pending'
-- This ensures the Order Confirmation and Realtime Tracking work correctly.
DROP POLICY IF EXISTS "Customers can only see their own paid orders" ON orders;
CREATE POLICY "Customers can see their own orders" ON orders
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- Ensure Admins still have full access
DROP POLICY IF EXISTS "Admins can see all orders" ON orders;
CREATE POLICY "Admins can see all orders" ON orders
FOR ALL 
TO authenticated
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
