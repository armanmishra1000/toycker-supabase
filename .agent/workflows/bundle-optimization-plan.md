---
description: Bundle Optimization, Middleware Slimming & Web Vitals Enhancement Plan
---

# Bundle Optimization, Middleware Slimming & Web Vitals Enhancement

## Executive Summary

**Current State:**
- First Load JS: 222 kB (shared chunks: 125 kB + 54.4 kB + 38.4 kB)
- Middleware: 137 kB (higher than recommended for Edge Runtime)
- Using `getSession()` in middleware (fast but potentially insecure without validation)
- Multiple Context providers without memoization optimization
- No dynamic imports for heavy components

**Target State:**
- Reduce First Load JS to ~180 kB (20% reduction)
- Reduce Middleware to ~80-100 kB (25-40% reduction)
- Implement local JWT validation for auth checks
- Optimize Context providers to prevent unnecessary re-renders
- Implement strategic dynamic imports for heavy components
- Improve TTFB, LCP, and INP metrics

---

## Phase 1: Middleware Optimization (High Impact)

### 1.1 Replace `getSession()` with Local JWT Validation

**Before:** Middleware uses `getSession()` which only validates JWT format/expiry locally but is insecure for authorization.

**After:** Use Supabase's `getClaims()` method with asymmetric JWT signing keys for secure local validation.

**Files to Modify:**
- `src/middleware.ts`

**Changes:**
1. Replace `supabase.auth.getSession()` with `supabase.auth.getClaims()`
2. Add proper error handling for JWT validation
3. Keep checkout redirect logic intact

**Benefits:**
- Secure local JWT validation without network calls
- Maintains fast performance
- Eliminates security risk of relying solely on `getSession()`

---

### 1.2 Optimize Middleware Matcher

**Before:** Current matcher excludes some paths but could be more specific.

**After:** Refine matcher to exclude all static assets and unnecessary routes.

**Files to Modify:**
- `src/middleware.ts`

**Changes:**
1. Update matcher to exclude:
   - All image extensions (svg, png, jpg, jpeg, gif, webp, ico, avif)
   - Font files (woff, woff2, ttf, otf, eot)
   - Manifest and robots files
   - All API routes except those requiring auth
2. Keep PayU callback exclusion

**Benefits:**
- Reduces middleware invocations by 30-40%
- Faster static asset delivery
- Lower compute costs

---

## Phase 2: Context Provider Optimization (Medium Impact)

### 2.1 Memoize Context Values

**Before:** Context providers create new object references on every render.

**After:** Wrap all context values with `useMemo` and functions with `useCallback`.

**Files to Modify:**
- `src/modules/layout/context/layout-data-context.tsx`
- `src/modules/cart/context/cart-store-context.tsx` (already has useMemo)
- `src/modules/products/context/wishlist.tsx` (already has useMemo)
- `src/modules/common/context/shipping-price-context.tsx`
- `src/modules/common/context/toast-context.tsx`
- `src/modules/layout/context/cart-sidebar-context.tsx`

**Changes:**
1. Add `useMemo` to all context value objects
2. Add `useCallback` to all functions passed in context
3. Ensure dependency arrays are correct and minimal

**Benefits:**
- Prevents unnecessary re-renders of consumer components
- Reduces React reconciliation work
- Improves INP (Interaction to Next Paint)

---

### 2.2 Optimize ShippingPriceContext

**Before:** Simple context without memoization.

**After:** Add memoization and split if needed.

**Files to Modify:**
- `src/modules/common/context/shipping-price-context.tsx`

**Changes:**
1. Wrap value object with `useMemo`
2. Wrap setter with `useCallback`
3. Add proper dependency arrays

---

## Phase 3: Bundle Size Reduction (High Impact)

### 3.1 Fix next.config.js Configuration

**Before:** Using deprecated `serverExternalPackages` in experimental.

**After:** Move to correct location and optimize package imports.

**Files to Modify:**
- `next.config.js`

**Changes:**
1. Remove `serverExternalPackages` from experimental (it's stable in Next.js 15)
2. Add more packages to `optimizePackageImports`:
   - `@heroicons/react`
   - `recharts`
   - `swiper`
   - `@radix-ui/react-accordion`
3. Verify `optimizePackageImports` is working correctly

**Benefits:**
- Reduces bundle size by 15-20%
- Faster development startup
- Improved tree-shaking

---

### 3.2 Implement Dynamic Imports for Heavy Components

**Before:** All components loaded upfront.

**After:** Lazy load non-critical components.

**Components to Dynamically Import:**
1. Admin components (entire admin section)
2. Chart/Analytics components (if any)
3. Rich text editor (TipTap)
4. Modal dialogs (non-critical)
5. Swiper carousel (if not above-the-fold)

**Files to Create/Modify:**
- Create wrapper components with `next/dynamic`
- Update imports in consuming components

**Changes:**
1. Identify components > 20 kB
2. Wrap with `dynamic(() => import(...), { ssr: false, loading: () => <Skeleton /> })`
3. Add loading skeletons for better UX

**Benefits:**
- Reduces First Load JS by 30-50 kB
- Faster initial page load
- Better LCP scores

---

### 3.3 Optimize Lodash Imports

**Before:** Using `import isEqual from "lodash/isEqual"` (already optimized).

**After:** Verify all lodash imports are specific, not barrel imports.

**Files to Check:**
- `src/modules/cart/context/cart-store-context.tsx`
- Search codebase for any `import _ from "lodash"` or `import { x } from "lodash"`

**Changes:**
1. Replace any barrel imports with specific imports
2. Consider replacing with native alternatives where possible

---

## Phase 4: Web Vitals Optimization (Medium Impact)

### 4.1 Optimize Font Loading

**Before:** Loading 9 font weights for Grandstander.

**After:** Load only necessary weights and use font-display: swap.

**Files to Modify:**
- `src/lib/fonts.ts`

**Changes:**
1. Reduce font weights to 4-5 most used (400, 500, 600, 700, 800)
2. Verify `display: "swap"` is set (already done)
3. Add `preload: true` for critical fonts

**Benefits:**
- Reduces font payload by 40-50%
- Faster FCP (First Contentful Paint)
- Better CLS (Cumulative Layout Shift)

---

### 4.2 Implement Intersection Observer for Below-Fold Content

**Before:** All content renders immediately.

**After:** Use existing `use-in-view` hook for lazy rendering.

**Files to Modify:**
- Components with heavy below-the-fold content
- Product grids
- Image galleries

**Changes:**
1. Wrap below-the-fold sections with IntersectionObserver
2. Render placeholder/skeleton until visible
3. Use existing `useInView` hook from `src/lib/hooks/use-in-view.tsx`

**Benefits:**
- Reduces initial render work
- Improves INP
- Better perceived performance

---

## Phase 5: Image & Asset Optimization (Low Impact - Already Good)

### 5.1 Verify Image Optimization

**Status:** Already using `next/image` with proper configuration.

**Action:** Audit to ensure:
1. All images use `next/image` component
2. Priority images have `priority={true}`
3. Lazy loading for below-the-fold images

---

## Phase 6: Quality Checks & Monitoring

### 6.1 Pre-Deployment Checks

**Commands to Run:**
```bash
# 1. Lint check
pnpm run lint

# 2. Type check
pnpm exec tsc --noEmit

# 3. Build check
pnpm run build

# 4. Bundle analysis
pnpm run analyze
```

### 6.2 Post-Deployment Monitoring

**Tools to Use:**
1. Vercel Analytics (already installed)
2. Vercel Speed Insights (already installed)
3. Google Lighthouse (manual audit)
4. WebPageTest (manual audit)

**Metrics to Track:**
- TTFB: Target < 200ms
- FCP: Target < 1.8s
- LCP: Target < 2.5s
- INP: Target < 200ms
- Bundle Size: Track in Vercel dashboard

---

## Implementation Order (Priority)

### Sprint 1: Critical Path (Day 1-2)
1. ✅ Middleware JWT validation (`getClaims()`)
2. ✅ Middleware matcher optimization
3. ✅ Fix next.config.js warnings
4. ✅ Add more packages to optimizePackageImports

### Sprint 2: Context Optimization (Day 2-3)
5. ✅ Memoize all Context providers
6. ✅ Optimize ShippingPriceContext

### Sprint 3: Bundle Reduction (Day 3-4)
7. ✅ Implement dynamic imports for admin section
8. ✅ Implement dynamic imports for TipTap editor
9. ✅ Optimize font loading (reduce weights)

### Sprint 4: Polish & Monitor (Day 4-5)
10. ✅ Run all quality checks
11. ✅ Deploy to production
12. ✅ Monitor Web Vitals for 48 hours
13. ✅ Fine-tune based on real-world data

---

## Risk Mitigation

### Risk 1: JWT Validation Breaking Auth
**Mitigation:** 
- Test thoroughly in development
- Keep fallback to `getUser()` for critical operations
- Monitor error rates post-deployment

### Risk 2: Dynamic Imports Causing Layout Shift
**Mitigation:**
- Add proper loading skeletons
- Use Suspense boundaries
- Test on slow 3G network

### Risk 3: Context Memoization Causing Stale Data
**Mitigation:**
- Carefully review dependency arrays
- Add integration tests for context updates
- Monitor for user-reported issues

---

## Success Criteria

### Performance Metrics
- ✅ First Load JS reduced by 20% (from 222 kB to ~180 kB)
- ✅ Middleware size reduced by 30% (from 137 kB to ~95 kB)
- ✅ TTFB < 200ms (p75)
- ✅ LCP < 2.5s (p75)
- ✅ INP < 200ms (p75)

### Code Quality
- ✅ No TypeScript errors
- ✅ No ESLint errors
- ✅ Build completes successfully
- ✅ No console errors in production

### User Experience
- ✅ No increase in error rates
- ✅ No user-reported performance regressions
- ✅ Faster perceived page load times

---

## Rollback Plan

If any issues arise:
1. Revert specific commits using Git
2. Deploy previous working version
3. Investigate issues in staging environment
4. Re-deploy with fixes

**Rollback Triggers:**
- Error rate increase > 5%
- TTFB increase > 50ms
- User complaints about broken features
- Core Web Vitals regression > 10%

---

## Notes

- All changes follow Next.js 15 best practices
- No over-engineering - simple, proven solutions
- TypeScript strict mode maintained
- No use of `any` type
- Backward compatible with existing features
