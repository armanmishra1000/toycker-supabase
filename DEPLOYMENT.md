# 🚀 Deployment Guide - AI Image Search Feature

## 📋 Overview

This guide covers deploying the AI-powered image search feature to production. Follow these steps in order.

---

## PART 1: Git Commit & Push (Development → Repository)

### Step 1: Check Current Status

```bash
git status
```

**You should see:**
- Modified: 5 files (embeddings.ts, routes, admin.ts, migration)
- Untracked: 1 file (IMAGE_SEARCH_GUIDE.md)

### Step 2: Stage All Changes

```bash
git add .
```

This stages all modified and new files.

### Step 3: Commit with Descriptive Message

```bash
git commit -m "feat: Add AI-powered image search with CLIP embeddings

- Implement CLIP-based image search using Transformers.js
- Add automatic embedding generation on product image updates
- Create hybrid search combining text + image similarity
- Add comprehensive image search guide and documentation
- Optimize with HNSW index and L2-normalized embeddings
- Support for 512-dim CLIP ViT-B-32 model embeddings
- Includes backfill script for existing products"
```

### Step 4: Push to Remote

```bash
git push origin feature/product-options-and-compare-price
```

**Expected output:**
```
Enumerating objects: ...
Counting objects: 100% ...
Writing objects: 100% ...
To https://github.com/your-repo/toycker-supabase.git
   abc1234..def5678  feature/product-options-and-compare-price -> feature/product-options-and-compare-price
```

### Step 5: Get Last Commit ID (for reference)

```bash
git log -1 --oneline
```

**Save this commit ID** for deployment tracking.

---

## PART 2: Supabase Database Setup (Production)

### Step 1: Access Supabase Production Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your **Production Project** (Toycker)
3. Click **SQL Editor** in left sidebar

### Step 2: Apply Database Migration

**Copy this EXACT SQL** and run it in SQL Editor:

```sql
-- Image and Voice Search Support
-- This migration enables pgvector and adds image embedding support to products

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Add image_embedding column to products (512 dimensions for CLIP ViT-B-32)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS image_embedding vector(512);

-- 3. Create HNSW index for fast similarity search
CREATE INDEX IF NOT EXISTS products_image_embedding_idx 
ON public.products USING hnsw (image_embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 4. Create Hybrid Multimodal Search Function
CREATE OR REPLACE FUNCTION public.search_products_multimodal(
  search_query TEXT DEFAULT NULL,
  search_embedding vector(512) DEFAULT NULL,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 20
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  handle TEXT,
  image_url TEXT,
  thumbnail TEXT,
  price DECIMAL,
  currency_code TEXT,
  relevance_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  WITH text_scores AS (
    SELECT 
      p.id::TEXT as product_id,
      GREATEST(
        CASE 
          WHEN search_query IS NOT NULL AND p.search_vector @@ websearch_to_tsquery('english', search_query)
          THEN ts_rank_cd(p.search_vector, websearch_to_tsquery('english', search_query)) * 0.5
          ELSE 0 
        END,
        CASE 
          WHEN search_query IS NOT NULL THEN similarity(p.name, search_query) * 0.4
          ELSE 0 
        END,
        CASE 
          WHEN search_query IS NOT NULL AND p.name ILIKE search_query || '%' THEN 0.1
          ELSE 0 
        END
      ) as text_score
    FROM public.products p
    WHERE search_query IS NOT NULL
  ),
  image_scores AS (
    SELECT 
      p.id::TEXT as product_id,
      1 - (p.image_embedding <=> search_embedding) as image_score
    FROM public.products p
    WHERE search_embedding IS NOT NULL
      AND p.image_embedding IS NOT NULL
  ),
  combined_scores AS (
    SELECT 
      COALESCE(t.product_id, i.product_id) as product_id,
      CASE 
        WHEN t.text_score > 0 AND i.image_score IS NOT NULL 
          THEN (t.text_score * 0.4 + i.image_score * 0.6)
        WHEN t.text_score > 0 
          THEN t.text_score
        WHEN i.image_score IS NOT NULL 
          THEN i.image_score
        ELSE 0
      END as final_score
    FROM text_scores t
    FULL OUTER JOIN image_scores i ON t.product_id = i.product_id
  )
  SELECT 
    p.id::TEXT,
    p.name,
    p.handle,
    p.image_url,
    p.thumbnail,
    COALESCE(
      (SELECT min(v.price) FROM public.product_variants v WHERE v.product_id = p.id),
      p.price
    )::DECIMAL as price,
    p.currency_code,
    c.final_score::FLOAT as relevance_score
  FROM combined_scores c
  JOIN public.products p ON c.product_id = p.id::TEXT
  WHERE c.final_score >= match_threshold
  ORDER BY c.final_score DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- 5. Add documentation
COMMENT ON FUNCTION public.search_products_multimodal IS 
'Hybrid multimodal search combining text and image search with CLIP embeddings';

COMMENT ON COLUMN public.products.image_embedding IS 
'512-dimensional CLIP ViT-B-32 embedding for visual similarity search';
```

**Click "Run"** and verify you see: **"Success. No rows returned"**

### Step 3: Verify Migration Worked

Run this verification query:

```sql
-- Verify column exists
SELECT COUNT(*) 
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name = 'image_embedding';
```

**Expected:** Returns `1` ✅

### Step 4: Check Current Product Count

```sql
-- See how many products need embeddings
SELECT 
  COUNT(*) as total_products,
  COUNT(image_embedding) as with_embeddings,
  COUNT(*) - COUNT(image_embedding) as needs_embeddings
FROM products;
```

**Note the number that "needs_embeddings"** - you'll process these next.

---

## PART 3: Deploy to Vercel (Code Deployment)

### Option A: Auto-Deploy (If Connected to GitHub)

1. **Push triggers auto-deploy** (already done in Part 1, Step 4)
2. Go to: https://vercel.com/dashboard
3. Check deployment status
4. Wait for "Ready" status
5. **Your new code is now live!** 🎉

### Option B: Manual Deploy (If Not Auto-Deploy)

```bash
# Install Vercel CLI if not already
npm i -g vercel

# Deploy to production
vercel --prod
```

Follow prompts and wait for deployment to complete.

### Step 5: Verify Deployment

1. Visit your live site: `https://your-domain.com`
2. Check that no errors appear
3. Try opening search - should work without errors

---

## PART 4: Generate Embeddings (Production Data)

### Step 1: Open Production Site

Go to your **live website**: `https://your-domain.com`

### Step 2: Open Browser Console

Press **F12** → **Console** tab

### Step 3: Run Backfill Script

Paste this entire script:

```javascript
async function backfillProduction() {
  let total = 0;
  let successCount = 0;
  let failCount = 0;
  
  console.log("🚀 Starting PRODUCTION backfill...");
  console.log("⚠️  This will process ALL products without embeddings\n");
  
  const startTime = Date.now();
  
  while (true) {
    console.log(`\n📦 Processing batch ${Math.floor(total/5) + 1}...`);
    
    try {
      const res = await fetch('/api/admin/search/backfill');
      const data = await res.json();
      
      if (!res.ok) {
        console.error("❌ Batch failed:", data.message || data.error);
        break;
      }
      
      total += data.processed || 0;
      successCount += data.success || 0;
      failCount += data.failed || 0;
      
      console.log(`  ✓ Success: ${data.success}/${data.processed}`);
      if (data.failed > 0) {
        console.log(`  ✗ Failed: ${data.failed}/${data.processed}`);
        console.log(`  Details:`, data.details?.filter(d => d.status === 'failed'));
      }
      console.log(`  📊 Progress: ${total} products (${successCount} ✓, ${failCount} ✗)`);
      
      if (!data.remaining) {
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`\n🎉 BACKFILL COMPLETE!`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`📊 Total Processed: ${total}`);
        console.log(`✅ Successful: ${successCount}`);
        console.log(`❌ Failed: ${failCount}`);
        console.log(`⏱️  Duration: ${duration}s`);
        console.log(`📈 Rate: ${(total / duration).toFixed(1)} products/sec`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        break;
      }
      
      // Wait 2 seconds between batches
      await new Promise(r => setTimeout(r, 2000));
      
    } catch (error) {
      console.error("💥 Fatal error:", error);
      break;
    }
  }
}

// Run it
backfillProduction();
```

### Step 4: Monitor Progress

You'll see output like:
```
🚀 Starting PRODUCTION backfill...
📦 Processing batch 1...
  ✓ Success: 5/5
  📊 Progress: 5 products (5 ✓, 0 ✗)
...
🎉 BACKFILL COMPLETE!
```

**Expected time:** 3-5 minutes for ~200 products

### Step 5: Verify Completion

Run this in **Supabase SQL Editor**:

```sql
-- Check coverage
SELECT 
  COUNT(*) as total,
  COUNT(image_embedding) as with_embeddings,
  ROUND((COUNT(image_embedding)::DECIMAL / COUNT(*)) * 100, 1) as coverage_pct
FROM products;
```

**Expected:** `coverage_pct` should be near **100.0%** ✅

---

## PART 5: Test Image Search (Production)

### Step 1: Go to Storefront

Visit: `https://your-domain.com`

### Step 2: Open Search

Click the search icon

### Step 3: Upload Product Image

1. Click camera icon 📷
2. Select product image (e.g., Windup Fish toy)
3. Upload

### Step 4: Verify Results

**You should see:**
- ✅ Uploaded product appears as **#1 result**
- ✅ Similar products shown below
- ✅ Results load in 1-2 seconds
- ✅ No errors in console

---

## ✅ Final Verification Checklist

Run through this checklist to confirm everything works:

### Code Deployment:
- [ ] Git commit created with descriptive message
- [ ] Changes pushed to GitHub
- [ ] Vercel deployment completed successfully
- [ ] No build errors in Vercel dashboard
- [ ] Site loads without errors

### Database Setup:
- [ ] Migration applied to production database
- [ ] `image_embedding` column exists (verified)
- [ ] HNSW index created successfully
- [ ] `search_products_multimodal` function exists

### Data Processing:
- [ ] Backfill script completed successfully
- [ ] 100% (or near) embedding coverage
- [ ] No failed products (or acceptable failure rate)

### Feature Testing:
- [ ] Image search UI appears in search drawer
- [ ] Image upload works
- [ ] Search returns correct results
- [ ] Top result is the uploaded product
- [ ] No console errors during search

### Automatic Updates:
- [ ] Edit a product and change image
- [ ] Save product
- [ ] Check console for embedding generation log
- [ ] Verify new image works in search

---

## 🎉 Success!

If all checkboxes above are ✅, your AI-powered image search is **LIVE IN PRODUCTION**!

---

## 📊 Monitoring & Maintenance

### Daily Checks (Optional):

```sql
-- Check for products missing embeddings
SELECT COUNT(*) 
FROM products 
WHERE image_url IS NOT NULL 
  AND image_embedding IS NULL;
```

If you see any, they'll auto-generate when the product is next edited.

### Performance Monitoring:

- **First search:** 3-5 seconds (normal - model loading)
- **Subsequent searches:** 1-2 seconds (target)
- **Embedding generation:** 100-300ms per image

### Troubleshooting:

If issues arise, check:
1. Browser console for errors
2. Vercel deployment logs
3. Supabase logs (Database → Logs)
4. IMAGE_SEARCH_GUIDE.md troubleshooting section

---

## 📞 Deployment Support

**If deployment fails:**

1. Check Vercel logs for build errors
2. Verify environment variables are set
3. Confirm Supabase connection works
4. Review IMAGE_SEARCH_GUIDE.md

**If search doesn't work:**

1. Verify migration was applied
2. Check embedding coverage (should be ~100%)
3. Test with known product image
4. Check browser console for errors

---

**Deployment Date:** Run `date` when completed  
**Deployed By:** Your name  
**Commit ID:** From Step 1.5 in Part 1  
**Production URL:** https://your-domain.com

**🎊 Congratulations on deploying AI-powered image search!** 🎊
