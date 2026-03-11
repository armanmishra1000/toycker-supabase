-- Manual admin phone update for WhatsApp OTP login
-- Run this in Supabase SQL Editor.
-- Project behavior: phone login normalizes Indian numbers to 91XXXXXXXXXX.
-- This script updates both public.profiles and auth.users so profile sync stays stable.

-- 1. Safety check: confirm the target email and whether the new phone already exists.
select
  p.id,
  p.email,
  p.phone as profile_phone,
  u.phone as auth_phone,
  p.role,
  p.admin_role_id,
  u.raw_user_meta_data
from public.profiles p
left join auth.users u
  on u.id = p.id
where lower(p.email) = lower('tutanymo@fxzig.com')
   or p.phone in ('9265348797', '919265348797')
   or u.phone in ('9265348797', '919265348797');

-- 2. Update auth.users first so later auth updates don't revert the profile phone.
with target_user as (
  select p.id
  from public.profiles p
  where lower(p.email) = lower('tutanymo@fxzig.com')
    and p.role = 'admin'
    and p.admin_role_id is not null
  limit 1
)
update auth.users u
set
  phone = '919265348797',
  phone_confirmed_at = coalesce(u.phone_confirmed_at, now()),
  raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object('phone', '919265348797', 'phone_number', '919265348797'),
  updated_at = now()
from target_user
where u.id = target_user.id;

-- 3. Update the profile to the same normalized phone.
update public.profiles
set
  phone = '919265348797',
  updated_at = now()
where lower(email) = lower('tutanymo@fxzig.com')
  and role = 'admin'
  and admin_role_id is not null;

-- 4. Verification: confirm the final stored values.
select
  p.id,
  p.email,
  p.phone as profile_phone,
  u.phone as auth_phone,
  p.role,
  p.admin_role_id,
  u.raw_user_meta_data,
  p.updated_at
from public.profiles p
left join auth.users u
  on u.id = p.id
where lower(p.email) = lower('tutanymo@fxzig.com');
