-- Add RLS policies for Admins to access rewards and addresses
-- Uses the existing is_admin() function from 20251231_admin_profiles_rls.sql

-- 1. reward_wallets
DROP POLICY IF EXISTS "Admins read all wallets" ON public.reward_wallets;
CREATE POLICY "Admins read all wallets" ON public.reward_wallets
    FOR SELECT TO authenticated
    USING (is_admin());

-- 2. reward_transactions
DROP POLICY IF EXISTS "Admins read all reward transactions" ON public.reward_transactions;
CREATE POLICY "Admins read all reward transactions" ON public.reward_transactions
    FOR SELECT TO authenticated
    USING (is_admin());

-- 3. addresses
DROP POLICY IF EXISTS "Admins read all addresses" ON public.addresses;
CREATE POLICY "Admins read all addresses" ON public.addresses
    FOR SELECT TO authenticated
    USING (is_admin());
