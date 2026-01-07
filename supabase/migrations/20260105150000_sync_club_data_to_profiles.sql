-- Migration: Sync club membership data from auth.users metadata to profiles table
-- This ensures that historical savings and membership status are visible in the Admin panel

UPDATE profiles
SET 
  is_club_member = (au.raw_user_meta_data->>'is_club_member')::boolean,
  club_member_since = (au.raw_user_meta_data->>'club_member_since')::timestamp with time zone,
  total_club_savings = COALESCE((au.raw_user_meta_data->>'total_club_savings')::numeric, 0)
FROM auth.users au
WHERE profiles.id = au.id
AND au.raw_user_meta_data ? 'is_club_member';
