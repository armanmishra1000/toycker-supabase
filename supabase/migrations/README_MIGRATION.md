# Supabase Security & Performance Fixes

## What This Fixes

This migration resolves **93 issues** identified by Supabase's Security and Performance Advisor:

### Security (38 issues)
- ✅ Enable RLS on `product_categories` table
- ✅ Fix 4 functions with mutable search_path vulnerability
- ✅ Move `vector` extension to proper `extensions` schema
- ✅ Consolidate and secure 28 overly permissive RLS policies

### Performance (55 issues)
- ✅ Optimize 17 RLS policies with `auth.uid()` caching
- ✅ Consolidate 35 duplicate permissive policies  
- ✅ Add 16 missing foreign key indexes

## How to Apply

**Option 1: Supabase Dashboard (Recommended)**

1. Open your Supabase project dashboard
2. Go to **SQL Editor** (left sidebar)
3. Click **"New query"**
4. Copy the contents of `supabase/migrations/fix_security_and_performance_issues.sql`
5. Paste into the SQL editor
6. Click **"Run"** (or press `Ctrl+Enter`)

**Option 2: Supabase CLI**

```bash
# Apply migration using Supabase CLI
supabase db push
```

## Verification Steps

### 1. Check Dashboard Advisors

After running the migration:

1. Go to **Database** → **Advisors** in Supabase Dashboard
2. **Security Advisor**: Should show 0 critical issues
3. **Performance Advisor**: Should show significant reduction in warnings

### 2. Test Application

```bash
# Start dev server
pnpm run dev
```

Test these scenarios:
- ✅ **Admin user**: Can create/edit/delete products, categories, collections
- ✅ **Regular user**: Can view products but NOT edit them
- ✅ **Anonymous user**: Can browse products, add to cart
- ✅ **Cart functionality**: Still works for both logged-in and anonymous users

### 3. Run Quality Checks

```bash
# TypeScript type check
pnpm run typecheck

# Lint check
pnpm run lint

# Production build
pnpm run build
```

All should pass without errors.

## What Changed

### Security Fixes

**1. RLS Enabled on `product_categories`**
- Previously exposed via API with no protection
- Now requires admin role for modifications

**2. Function Security**
- `match_products`, `handle_new_user`, `handle_admin_notification`, `is_admin`
- Fixed `search_path` vulnerability (prevents privilege escalation)
- All now use fully qualified table names

**3. Extension Organization**
- `vector` extension moved from `public` to `extensions` schema
- Cleaner namespace, better security isolation

**4. RLS Policy Consolidation**
- **Before**: 28 policies with `USING (true)` (bypasses security)
- **After**: Proper admin checks using `is_admin()` function
- **Exception**: Cart tables kept permissive for prototype (documented)

### Performance Fixes

**1. Auth.uid() Optimization**
- **Before**: `auth.uid()` runs for EVERY row
- **After**: `(SELECT auth.uid())` runs ONCE per query
- **Impact**: 10-100x faster on tables with many rows

**2. Policy Consolidation**
- **Before**: Multiple duplicate policies for same table/role
- **After**: Single consolidated policy per operation
- **Impact**: Faster query planning, less overhead

**3. Foreign Key Indexes**
- Added 16 indexes on foreign key columns
- **Impact**: Faster JOINs, faster parent table deletes/updates

## Important Notes

### Cart Security (Prototype Mode)

Current RLS policies for `cart_items` and `carts` use `USING (true)`, allowing public access. This is **acceptable for a basic prototype** but should be secured before production:

**Before Production**:
```sql
-- Replace with session-based or user-based cart security
CREATE POLICY "Users manage own carts"
  ON public.carts FOR ALL
  TO authenticated  
  USING (user_id = (SELECT auth.uid()));
```

### Admin Role Function

The migration uses your existing `is_admin()` function without modifying its internal logic. It correctly checks the `admin_roles` table.

### Leaked Password Protection

Requires **Supabase Pro Plan**. If on free tier, document this as a production requirement:

```
Before production: Enable Leaked Password Protection in 
Dashboard → Authentication → Password Settings
```

## Rollback (If Needed)

If something goes wrong, you can rollback by:

1. Taking a database snapshot before applying (recommended)
2. Using Supabase's built-in point-in-time recovery
3. Manually reverting specific changes (see migration file for DROP statements)

## Support

If you encounter issues:

1. Check Supabase logs in Dashboard → Logs
2. Verify existing RLS policies weren't deleted accidentally
3. Ensure `is_admin()` function exists and works correctly
4. Check that `admin_roles` table has proper data

## Next Steps

After successful migration:

1. ✅ Monitor application for any broken functionality
2. ✅ Check query performance improvements with real traffic
3. ✅ Plan cart security implementation for production
4. ✅ Enable leaked password protection (if on Pro plan)
5. ✅ Consider adding more granular RLS policies as app grows
