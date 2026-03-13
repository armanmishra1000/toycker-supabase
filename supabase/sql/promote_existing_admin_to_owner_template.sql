-- Reusable manual SQL template for promoting an existing admin/staff user
-- to the system Owner role.
--
-- Run this in Supabase SQL Editor.
-- Replace the email value in both places before running.
--
-- Why this script is shaped this way:
-- 1. This project treats "Owner" as a system role in public.admin_roles
-- 2. Admin access compatibility still depends on public.profiles.role = 'admin'
-- 3. Permissions are resolved from public.profiles.admin_role_id -> public.admin_roles
-- 4. The script repairs the Owner role if it exists but is misconfigured

-- ============================================================
-- EDIT THIS VALUE
-- ============================================================
do $$
declare
  v_admin_email text := lower('tutanymo@fxzig.com');
  v_user_id uuid;
  v_owner_role_id text;
  v_previous_role text;
  v_previous_admin_role_id text;
begin
  -- Ensure the canonical Owner system role exists and has wildcard access.
  insert into public.admin_roles (name, permissions, is_system)
  values ('Owner', '["*"]'::jsonb, true)
  on conflict (name) do update
    set permissions = '["*"]'::jsonb,
        is_system = true,
        updated_at = now()
  returning id into v_owner_role_id;

  -- Find an existing admin-capable profile only.
  -- This allows both:
  -- - current RBAC admins/staff with admin_role_id
  -- - legacy admins with role = 'admin' but no admin_role_id yet
  select
    p.id,
    p.role,
    p.admin_role_id
  into
    v_user_id,
    v_previous_role,
    v_previous_admin_role_id
  from public.profiles p
  where lower(p.email) = v_admin_email
    and (
      p.role = 'admin'
      or p.admin_role_id is not null
    )
  limit 1;

  if v_user_id is null then
    raise exception
      'No existing admin/staff profile found for email: %. The user must already have admin access before promoting to Owner.',
      v_admin_email;
  end if;

  -- Keep role = 'admin' for compatibility with ensureAdmin() and is_admin().
  update public.profiles p
  set
    role = 'admin',
    admin_role_id = v_owner_role_id,
    updated_at = now()
  where p.id = v_user_id;

  raise notice
    'Owner role assigned successfully. email=%, user_id=%, previous_role=%, previous_admin_role_id=%, owner_role_id=%',
    v_admin_email,
    v_user_id,
    coalesce(v_previous_role, '<null>'),
    coalesce(v_previous_admin_role_id, '<null>'),
    v_owner_role_id;
end $$;

-- ============================================================
-- VERIFICATION
-- ============================================================
select
  p.id,
  p.email,
  p.role,
  p.admin_role_id,
  ar.name as admin_role_name,
  ar.is_system as admin_role_is_system,
  ar.permissions,
  (ar.permissions ? '*') as has_full_access_wildcard,
  p.updated_at
from public.profiles p
left join public.admin_roles ar
  on ar.id = p.admin_role_id
where lower(p.email) = lower('tutanymo@fxzig.com');
