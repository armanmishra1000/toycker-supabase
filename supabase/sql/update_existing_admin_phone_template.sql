-- Reusable manual SQL template for assigning a WhatsApp OTP phone
-- to an existing admin/staff user.
--
-- Run this in Supabase SQL Editor.
-- Replace only the two values in the "EDIT THESE VALUES" section.
--
-- Behavior:
-- 1. Accepts a 10-digit Indian mobile or a 91-prefixed mobile
-- 2. Normalizes it to 91XXXXXXXXXX
-- 3. Confirms the admin user exists
-- 4. Prevents accidental phone conflicts
-- 5. Updates both auth.users and public.profiles

-- ============================================================
-- EDIT THESE VALUES
-- ============================================================
do $$
declare
  v_admin_email text := lower('admin@toycker.com');
  v_input_phone text := '8849498140';

  v_digits text;
  v_normalized_phone text;
  v_user_id uuid;
  v_conflict_exists boolean;
begin
  -- Normalize the phone the same way the app does.
  v_digits := regexp_replace(v_input_phone, '\D', '', 'g');

  if length(v_digits) = 10 then
    v_normalized_phone := '91' || v_digits;
  elsif length(v_digits) = 12 and left(v_digits, 2) = '91' then
    v_normalized_phone := v_digits;
  else
    raise exception 'Invalid phone format. Use a 10-digit Indian mobile or 91XXXXXXXXXX.';
  end if;

  if v_normalized_phone !~ '^91[6-9][0-9]{9}$' then
    raise exception 'Invalid Indian mobile number after normalization: %', v_normalized_phone;
  end if;

  -- Find the target admin/staff user.
  select p.id
  into v_user_id
  from public.profiles p
  where lower(p.email) = v_admin_email
    and p.role = 'admin'
  limit 1;

  if v_user_id is null then
    raise exception 'No admin profile found for email: %', v_admin_email;
  end if;

  -- Prevent assigning a phone that already belongs to a different profile.
  select exists (
    select 1
    from public.profiles p
    where p.phone = v_normalized_phone
      and p.id <> v_user_id
  )
  into v_conflict_exists;

  if v_conflict_exists then
    raise exception 'Phone % is already used by another row in public.profiles', v_normalized_phone;
  end if;

  -- Prevent assigning a phone that already belongs to a different auth user.
  select exists (
    select 1
    from auth.users u
    where u.phone = v_normalized_phone
      and u.id <> v_user_id
  )
  into v_conflict_exists;

  if v_conflict_exists then
    raise exception 'Phone % is already used by another row in auth.users', v_normalized_phone;
  end if;

  -- Update auth.users first so later profile sync stays correct.
  update auth.users u
  set
    phone = v_normalized_phone,
    phone_confirmed_at = coalesce(u.phone_confirmed_at, now()),
    raw_user_meta_data = coalesce(u.raw_user_meta_data, '{}'::jsonb)
      || jsonb_build_object(
        'phone', v_normalized_phone,
        'phone_number', v_normalized_phone
      ),
    updated_at = now()
  where u.id = v_user_id;

  -- Update the profile copy of the phone.
  update public.profiles p
  set
    phone = v_normalized_phone,
    updated_at = now()
  where p.id = v_user_id;

  raise notice 'Admin phone updated successfully. email=%, user_id=%, phone=%',
    v_admin_email, v_user_id, v_normalized_phone;
end $$;

-- ============================================================
-- VERIFICATION
-- ============================================================
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
where lower(p.email) = lower('admin@toycker.com');
