# AI-Powered Image Search - Complete Guide

## � Quick Setup Checklist

**If this is your first time setting up image search:**

- [ ] **Step 1:** Apply database migration (SQL in Supabase) - **5 minutes**
- [ ] **Step 2:** Verify column was created - **30 seconds**
- [ ] **Step 3:** Run backfill script for existing products - **3-5 minutes**
- [ ] **Step 4:** Test image search on storefront - **1 minute**

**Total Time: ~10 minutes**

---

## ⚠️ Common First-Time Error

**If you see error `42703` or "column does not exist":**

This means Step 1 (database migration) hasn't been completed yet. Jump to [Setup & Configuration](#setup--configuration) section and run the SQL migration first.

---

## �📋 Table of Contents
1. [How to Use Image Search](#how-to-use-image-search)
2. [Setup & Configuration](#setup--configuration)
3. [Automatic Embedding Generation](#automatic-embedding-generation)
4. [Adjusting Similarity Threshold](#adjusting-similarity-threshold)
5. [Maintenance & Monitoring](#maintenance--monitoring)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 How to Use Image Search

### **For End Users (Storefront)**

1. **Open Search Drawer**
   - Click the search icon on your website
   - Or click in the search bar

2. **Upload Product Image**
   - Click the **camera icon** (📷) in the search bar
   - Select an image from your device
   - Or drag & drop an image

3. **View Results**
   - AI analyzes the image (1-3 seconds)
   - Shows visually similar products
   - Results sorted by similarity (most similar first)
   - Displays up to 12 matching products

### **What Makes a Good Search Image?**

✅ **Good Images:**
- Clear, well-lit photos
- Product is centered
- Minimal background clutter
- Similar angle to catalog images

❌ **Poor Images:**
- Very blurry or dark
- Product is tiny in frame
- Extreme angles
- Heavy filters or editing

---

## ⚙️ Setup & Configuration

### **Initial Setup (One-Time)**

#### Step 1: Apply Database Migration

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run this SQL:

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add image_embedding column to products (512 dimensions for CLIP ViT-B-32)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS image_embedding vector(512);

-- Create HNSW index for fast similarity search
CREATE INDEX IF NOT EXISTS products_image_embedding_idx 
ON public.products USING hnsw (image_embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Create Hybrid Multimodal Search Function
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
      p.id as product_id,
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
      p.id as product_id,
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
    p.id,
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
  JOIN public.products p ON c.product_id = p.id
  WHERE c.final_score >= match_threshold
  ORDER BY c.final_score DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE;
```

3. Click **"Run"** (or press Ctrl+Enter)
4. You should see: **"Success. No rows returned"**

#### Step 1.5: Verify Column Was Created

To confirm the migration worked, run this quick check:

```sql
-- Verify image_embedding column exists
SELECT COUNT(*) 
FROM information_schema.columns 
WHERE table_name = 'products' 
  AND column_name = 'image_embedding';
```

**Expected Result:** `1` (column exists) ✅

If you get `0`, the migration didn't run correctly. Try again or check for errors.

---

#### Step 2: Initial Backfill (Existing Products)

Run this **once** to generate embeddings for all existing products:

1. Open your **storefront** in browser (localhost:3000)
2. Open **Browser Console** (F12 → Console)
3. Paste and run:

```javascript
async function backfillAll() {
  let total = 0;
  let successCount = 0;
  let failCount = 0;
  
  console.log("🚀 Starting image embedding backfill...");
  console.log("This will process all products without embeddings\n");
  
  while (true) {
    console.log(`\n📦 Processing batch ${Math.floor(total/5) + 1}...`);
    
    const res = await fetch('/api/admin/search/backfill');
    const data = await res.json();
    
    if (!res.ok) {
      console.error("❌ Batch failed:", data.message);
      break;
    }
    
    total += data.processed || 0;
    successCount += data.success || 0;
    failCount += data.failed || 0;
    
    console.log(`  ✓ Success: ${data.success}/${data.processed}`);
    if (data.failed > 0) {
      console.log(`  ✗ Failed: ${data.failed}/${data.processed}`);
    }
    console.log(`  📊 Progress: ${total} products (${successCount} ✓, ${failCount} ✗)`);
    
    if (!data.remaining) {
      console.log(`\n🎉 BACKFILL COMPLETE!`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📊 Total Processed: ${total}`);
      console.log(`✅ Successful: ${successCount}`);
      console.log(`❌ Failed: ${failCount}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      break;
    }
    
    // Wait 2 seconds between batches to avoid overwhelming the server
    await new Promise(r => setTimeout(r, 2000));
  }
}

backfillAll();
```

4. **Wait for completion** (3-5 minutes for ~200 products)
5. See final summary with success/failure counts

**Expected Output:**
```
🚀 Starting image embedding backfill...
📦 Processing batch 1...
  ✓ Success: 5/5
  📊 Progress: 5 products (5 ✓, 0 ✗)
...
🎉 BACKFILL COMPLETE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Total Processed: 192
✅ Successful: 192
❌ Failed: 0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🤖 Automatic Embedding Generation

### **✅ Already Implemented!**

Good news! Automatic embedding generation is **already working** in your codebase. When you:

1. ✅ **Edit a product** and change the `image_url`
2. ✅ The system **automatically**:
   - Detects the image URL changed
   - Clears the old embedding
   - Generates a new embedding in the background
   - Updates the database
   - Logs progress in console

**No manual work needed!**

### **How to See It Working:**

1. Go to **Admin** → **Products**
2. **Edit any product**
3. **Change the image URL**
4. **Save the product**
5. **Check browser console** - you'll see:
   ```
   Generating new embedding for product abc-123...
   ✓ Successfully updated embedding for product abc-123
   ```

### **Code Location:**

The auto-generation is implemented in:
- **File:** `src/lib/data/admin.ts`
- **Function:** `updateProduct()` (lines 577-700)
- **Helper:** `regenerateImageEmbedding()` (lines 703-730)

### **Implementation Details:**

```typescript
// When image URL changes during product update:
if (imageUrlChanged && newImageUrl) {
  // Clear old embedding
  updates.image_embedding = null
  
  // Generate new embedding in background (doesn't slow down save)
  regenerateImageEmbedding(id, newImageUrl).catch(err => {
    console.error(`Failed to regenerate embedding for product ${id}:`, err)
  })
}
```

**Benefits:**
- ✅ Runs in background - doesn't slow down product saves
- ✅ Errors logged but don't fail the update
- ✅ Works for both manual edits and bulk imports  
- ✅ No additional backend infrastructure needed

---

### **Future Enhancements (Optional)**

If you want even more automation, consider these options:

### **Option 1: Database Trigger (Advanced)**

Add this SQL trigger to auto-generate embeddings:

```sql
-- Create a function to queue embedding generation
CREATE OR REPLACE FUNCTION queue_embedding_generation()
RETURNS TRIGGER AS $$
BEGIN
  -- Only queue if image_url changed and no embedding exists yet
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.image_url IS DISTINCT FROM OLD.image_url)) 
     AND NEW.image_url IS NOT NULL 
     AND NEW.image_embedding IS NULL THEN
    
    -- In a real implementation, this would:
    -- 1. Send message to a queue (e.g., Supabase Edge Functions, AWS SQS)
    -- 2. Background worker picks it up
    -- 3. Generates embedding
    -- 4. Updates the product
    
    -- For now, log that it needs processing
    RAISE NOTICE 'Product % needs embedding generation for image: %', NEW.id, NEW.image_url;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to products table
DROP TRIGGER IF EXISTS trigger_queue_embedding ON products;
CREATE TRIGGER trigger_queue_embedding
  AFTER INSERT OR UPDATE OF image_url ON products
  FOR EACH ROW
  EXECUTE FUNCTION queue_embedding_generation();
```

**Pros:**
- ✅ Fully automatic
- ✅ No code changes needed
- ✅ Works immediately

**Cons:**
- ⚠️ Requires background worker setup
- ⚠️ Slightly more complex

### **Option 2: Application-Level Hook**

For **immediate implementation without background workers**, add this to your product creation/update logic:

**File:** `src/lib/actions/products.ts` (or wherever you handle product CRUD)

```typescript
import { generateImageEmbedding } from "@/lib/ml/embeddings"

// After saving product to database
async function handleProductSave(productId: string, imageUrl: string | null) {
  if (!imageUrl) return
  
  try {
    // Generate embedding in background (don't await)
    generateAndStoreEmbedding(productId, imageUrl).catch(err => {
      console.error(`Failed to generate embedding for product ${productId}:`, err)
    })
  } catch (error) {
    // Log but don't fail the product save
    console.error("Embedding generation error:", error)
  }
}

async function generateAndStoreEmbedding(productId: string, imageUrl: string) {
  const embedding = await generateImageEmbedding(imageUrl)
  
  const supabase = await createAdminClient()
  await supabase
    .from('products')
    .update({ image_embedding: embedding })
    .eq('id', productId)
}
```

**Pros:**
- ✅ Simple to implement
- ✅ Works immediately
- ✅ No infrastructure changes

**Cons:**
- ⚠️ Slower product saves (if await)
- ⚠️ Can fail silently (if background)

### **Recommended Approach**

For your current setup:

1. **Short-term:** Use **Option 2** (Application-Level Hook)
2. **Long-term:** Implement **Option 1** (Database Trigger + Background Worker)

---

## 🎚️ Adjusting Similarity Threshold

### **What is Similarity Threshold?**

The threshold determines how similar an image must be to show in results:
- **0.0** = No similarity required (all products match)
- **0.5** = 50% similar (loose matching)
- **0.7** = 70% similar (balanced) ← **Default**
- **0.9** = 90% similar (strict matching)
- **1.0** = Identical (almost nothing matches)

### **How to Adjust**

**File:** `src/app/api/storefront/search/image/route.ts`

Find line 43:

```typescript
const { data, error } = await supabase.rpc("search_products_multimodal", {
  search_embedding: embedding,
  match_threshold: 0.7,  // ← Change this value
  match_count: 12,
})
```

### **Recommended Thresholds by Use Case**

| Use Case | Threshold | Results |
|----------|-----------|---------|
| **"Find Exact Match"** | 0.85-0.95 | Only very similar products |
| **"Find Similar Products"** | 0.70-0.80 | Balanced relevance ← **Default** |
| **"Broad Discovery"** | 0.50-0.65 | Many loosely related items |
| **"Show Everything"** | 0.30-0.45 | Too many irrelevant results |

### **Testing Different Thresholds**

1. Change the value in `route.ts`
2. Save the file (dev server auto-reloads)
3. Upload a product image
4. Observe result quality
5. Adjust and repeat

**Example Adjustments:**

```typescript
// Stricter matching (fewer but more accurate results)
match_threshold: 0.85,

// Looser matching (more results, some less relevant)
match_threshold: 0.55,

// Very strict (only near-identical products)
match_threshold: 0.92,
```

### **Dynamic Threshold (Advanced)**

Allow users to control strictness:

```typescript
// Accept threshold from request
const formData = await request.formData()
const imageFile = formData.get("image") as File
const userThreshold = parseFloat(formData.get("threshold") as string) || 0.7

const { data, error } = await supabase.rpc("search_products_multimodal", {
  search_embedding: embedding,
  match_threshold: Math.max(0.3, Math.min(0.95, userThreshold)), // Clamp between 0.3-0.95
  match_count: 12,
})
```

Then in your UI, add a slider for users to adjust precision.

---

## 🔧 Maintenance & Monitoring

### **Check Embedding Coverage**

Run this SQL query in **Supabase SQL Editor**:

```sql
-- Check how many products have embeddings
SELECT 
  COUNT(*) as total_products,
  COUNT(image_embedding) as products_with_embeddings,
  COUNT(*) - COUNT(image_embedding) as products_without_embeddings,
  ROUND(
    (COUNT(image_embedding)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 
    2
  ) as coverage_percentage
FROM products;
```

**Expected Output:**
```
total_products | products_with_embeddings | products_without_embeddings | coverage_percentage
---------------|--------------------------|-----------------------------|-----------------
192            | 192                      | 0                           | 100.00
```

### **Find Products Missing Embeddings**

```sql
-- List products without embeddings
SELECT 
  id,
  name,
  handle,
  image_url,
  created_at
FROM products
WHERE image_embedding IS NULL
  AND image_url IS NOT NULL  -- Has image but no embedding
ORDER BY created_at DESC
LIMIT 20;
```

### **Check Specific Product Embedding**

```sql
-- Get embedding info for "Windup Fish Key Toy"
SELECT 
  id,
  name,
  handle,
  image_url,
  image_embedding IS NOT NULL as has_embedding,
  CASE 
    WHEN image_embedding IS NOT NULL 
    THEN vector_dims(image_embedding)
    ELSE NULL 
  END as embedding_dimensions
FROM products 
WHERE name ILIKE '%windup%fish%'
   OR handle ILIKE '%windup%fish%';
```

**Expected Output:**
```
id         | name                | handle            | image_url          | has_embedding | embedding_dimensions
-----------|---------------------|-------------------|--------------------|---------------|--------------------
prod_123   | Windup Fish Key Toy | windup-fish-key-toy | https://...       | true          | 512
```

### **Search Performance Check**

```sql
-- Test search function with known embedding
SELECT 
  name,
  relevance_score,
  image_embedding IS NOT NULL as has_embedding
FROM search_products_multimodal(
  search_embedding := (
    SELECT image_embedding 
    FROM products 
    WHERE name ILIKE '%windup%fish%' 
    LIMIT 1
  ),
  match_threshold := 0.7,
  match_count := 10
);
```

Should return the Windup Fish product as #1 with highest score.

### **Regenerate Embeddings for Specific Products**

If you need to regenerate embeddings for specific products:

```javascript
// In browser console
async function regenerateProduct(productId) {
  const res = await fetch('/api/admin/search/backfill', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId })
  });
  const data = await res.json();
  console.log('Result:', data);
}

// Usage
regenerateProduct('your-product-id-here');
```

### **Monitor Search Usage**

Add analytics to track:
- Number of image searches per day
- Average search time
- Most searched product types
- Failed searches

---

## 🐛 Troubleshooting

### **Problem: Error 42703 - "column does not exist"**

**Full Error:**
```
{code: "42703", details: null, hint: ..., message: "column \"image_embedding\" does not exist"}
```

**Cause:** The database migration hasn't been applied yet.

**Solution:**
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run the migration SQL from [Step 1](#step-1-apply-database-migration)
3. Verify with:
   ```sql
   SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = 'products' AND column_name = 'image_embedding';
   ```
4. **Hard refresh** your browser (Ctrl+Shift+R) or restart dev server
5. The error should disappear

**This is a one-time setup step** - once the column exists, you'll never see this error again.

---

### **Problem: "No results found"**

**Possible Causes:**
1. Product doesn't have embedding yet
2. Threshold too strict (>0.9)
3. Image too different from catalog
4. Wrong CLIP model version

**Solutions:**
```sql
-- Check if target product has embedding
SELECT name, image_embedding IS NOT NULL 
FROM products 
WHERE id = 'your-product-id';

-- If NULL, run backfill for that product
-- If NOT NULL, lower threshold to 0.5 temporarily
```

### **Problem: "Unsupported input type" error**

**Cause:** Image format not supported by RawImage

**Solution:**
- Ensure images are JPG, PNG, or WebP
- Check file size (< 10MB recommended)
- Verify image is not corrupted

### **Problem: "Search is slow (>5 seconds)"**

**Causes:**
1. First search (model loading)
2. Large result set
3. Missing index

**Solutions:**
```sql
-- Verify HNSW index exists
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'products' 
  AND indexname LIKE '%embedding%';

-- If missing, recreate:
CREATE INDEX products_image_embedding_idx 
ON products USING hnsw (image_embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

### **Problem: Wrong products appearing first**

**Causes:**
1. Threshold too low
2. Similar visual features (colors, shapes)
3. Low-quality product images

**Solutions:**
1. Increase threshold to 0.8-0.85
2. Improve product image quality
3. Re-generate embeddings with better images

### **Problem: Embedding generation fails during backfill**

**Check logs for:**
```
Error generating image embedding: [error message]
```

**Common Issues:**
- **Network error:** Image URL not accessible
- **Invalid URL:** Check `image_url` field
- **Timeout:** Server too slow, reduce batch size

**Fix:**
```typescript
// In backfill route, reduce batch size
.limit(5) // Change to 3 or even 2
```

---

## 📊 Performance Metrics

### **Expected Performance:**

| Metric | Value |
|--------|-------|
| **First search** | 3-5 seconds (model loading) |
| **Subsequent searches** | 1-2 seconds |
| **Embedding generation** | 100-300ms per image |
| **Database query** | 10-50ms |
| **Accuracy (similar products)** | 85-95% |
| **Accuracy (exact match)** | 95-99% |

### **Optimization Tips:**

1. **Use quantized models** (already enabled)
2. **HNSW index** with m=16, ef_construction=64 (optimal for 192-1000 products)
3. **Cache model in memory** (already implemented via singleton)
4. **Batch backfill** in groups of 3-5 (prevents timeout)

---

## 🔒 Security Considerations

1. **Rate Limiting:** 
   - Limit image uploads to prevent abuse
   - Recommended: 5 searches per minute per user

2. **File Size Limits:**
   - Max 10MB per image
   - Automatically resize large images

3. **Admin-Only Backfill:**
   - Backfill API uses admin client
   - Bypasses RLS policies
   - Only accessible with proper authentication

4. **Input Validation:**
   - Validate file types (JPG, PNG, WebP)
   - Scan for malicious content
   - Sanitize filenames

---

## 📚 Additional Resources

### **CLIP Model Information:**
- Model: `Xenova/clip-vit-base-patch32`
- Embedding Size: 512 dimensions
- Quantized: Yes (8-bit)
- Size: ~87MB (vs 345MB full precision)

### **Technologies Used:**
- **@xenova/transformers** - CLIP model inference
- **pgvector** - Vector similarity search
- **HNSW index** - Fast approximate nearest neighbor
- **L2 normalization** - Accurate cosine similarity

### **Useful SQL Queries:**

```sql
-- Get embedding statistics
SELECT 
  COUNT(*) FILTER (WHERE image_embedding IS NOT NULL) as with_embedding,
  COUNT(*) FILTER (WHERE image_embedding IS NULL AND image_url IS NOT NULL) as needs_embedding,
  COUNT(*) FILTER (WHERE image_url IS NULL) as no_image
FROM products;

-- Find most similar products to a given product
SELECT p2.name, 1 - (p1.image_embedding <=> p2.image_embedding) as similarity
FROM products p1
CROSS JOIN products p2
WHERE p1.id = 'your-product-id'
  AND p2.id != p1.id
  AND p2.image_embedding IS NOT NULL
ORDER BY similarity DESC
LIMIT 10;
```

---

## ✅ Checklist for New Setup

- [ ] Applied database migration
- [ ] Created HNSW index
- [ ] Ran initial backfill (all products)
- [ ] Verified 100% embedding coverage
- [ ] Tested image search with sample product
- [ ] Adjusted threshold to desired strictness
- [ ] Set up automatic generation (optional)
- [ ] Added monitoring queries to dashboard
- [ ] Documented product creation workflow
- [ ] Tested image update flow

---

## 📞 Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Run diagnostic queries in [Maintenance](#maintenance--monitoring)
3. Review server logs for error messages
4. Verify embedding coverage is 100%
5. Test with known-good product images

**Last Updated:** January 16, 2026
**Version:** 1.0
**Status:** ✅ Production Ready
