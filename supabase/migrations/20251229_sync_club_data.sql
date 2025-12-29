-- Add club membership columns to profiles table if they don't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_club_member BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS club_member_since TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_club_savings NUMERIC DEFAULT 0;

-- Sync existing data from auth.users metadata to profiles
-- This uses a CTE to extract metadata and update the profiles table
WITH user_data AS (
    SELECT 
        id, 
        (raw_user_meta_data->>'is_club_member')::boolean as is_member,
        (raw_user_meta_data->>'club_member_since')::timestamp with time zone as member_since,
        COALESCE((raw_user_meta_data->>'total_club_savings')::numeric, 0) as savings
    FROM auth.users
)
UPDATE profiles
SET 
    is_club_member = ud.is_member,
    club_member_since = ud.member_since,
    total_club_savings = ud.savings
FROM user_data ud
WHERE profiles.id = ud.id;

-- Optional: Create a function and trigger to keep this synced in the future
-- (Omitting for now to keep implementation simple as requested, assuming data flows via app logic update)
