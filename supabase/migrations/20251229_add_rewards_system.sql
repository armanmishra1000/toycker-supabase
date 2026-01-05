-- Add rewards_percentage to club_settings (default 5%)
ALTER TABLE club_settings ADD COLUMN IF NOT EXISTS rewards_percentage INTEGER NOT NULL DEFAULT 5;

-- Update default row to have rewards_percentage
UPDATE club_settings SET rewards_percentage = 5 WHERE id = 'default' AND rewards_percentage IS NULL;

-- Create reward_wallets table (stores current balance for fast lookup)
CREATE TABLE IF NOT EXISTS reward_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reward_transactions table (ledger for history and auditability)
CREATE TABLE IF NOT EXISTS reward_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES reward_wallets(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- positive = earned, negative = spent
    type TEXT NOT NULL CHECK (type IN ('earned', 'spent')),
    description TEXT NOT NULL,
    order_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE reward_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_transactions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own wallet
CREATE POLICY "Users read own wallet" ON reward_wallets 
FOR SELECT TO authenticated 
USING (auth.uid() = user_id);

-- Allow insert for authenticated (wallet creation during order)
CREATE POLICY "Users can create own wallet" ON reward_wallets 
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Allow update for authenticated (balance updates)
CREATE POLICY "Users can update own wallet" ON reward_wallets 
FOR UPDATE TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can only read their own transactions
CREATE POLICY "Users read own transactions" ON reward_transactions 
FOR SELECT TO authenticated 
USING (wallet_id IN (SELECT id FROM reward_wallets WHERE user_id = auth.uid()));

-- Allow insert for authenticated (transaction logging)
CREATE POLICY "Users can create own transactions" ON reward_transactions 
FOR INSERT TO authenticated 
WITH CHECK (wallet_id IN (SELECT id FROM reward_wallets WHERE user_id = auth.uid()));

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_reward_wallets_user_id ON reward_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_transactions_wallet_id ON reward_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_reward_transactions_created_at ON reward_transactions(created_at DESC);
