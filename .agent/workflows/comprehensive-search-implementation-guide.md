---
description: Comprehensive Search Implementation Guide - Image, Text & Voice Search for Toy E-Commerce
---

# 🔍 Comprehensive Search Implementation Guide for Toycker
**Advanced Image, Text & Voice Search for Next.js + Supabase**

> **Research Date:** January 2026  
> **Based on 25+ web searches and official documentation**

---

## 📋 Executive Summary

Based on extensive research, here's the recommended architecture for your toy e-commerce search system:

### Current State Analysis
✅ **Already Implemented:**
- Basic text search with `ILIKE` (working but not optimized)
- Image search with CLIP + pgvector (Transformers.js)
- Voice search using Web Speech API
- pgvector extension for embeddings
- Cloudflare R2 for image storage

### Recommended Improvements

| Feature | Current Implementation | Recommended Enhancement | Priority |
|---------|----------------------|------------------------|----------|
| **Text Search** | Basic `ILIKE` | Full-Text Search + Trigram Similarity | 🔴 HIGH |
| **Image Search** | CLIP (ViT-Base) | Keep current + optimize indexing | 🟡 MEDIUM |
| **Voice Search** | Web Speech API | Keep + add fallback support | 🟢 LOW |
| **Search UX** | Basic | Add debouncing, autocomplete, hybrid search | 🔴 HIGH |
| **Performance** | No indexing strategy | HNSW indexes, caching, streaming | 🔴 HIGH |

---

## 🎯 Part 1: Text Search Optimization

### 1.1 PostgreSQL Full-Text Search (FTS)

**Why FTS over ILIKE?**
- 50-100x faster for large datasets
- Supports stemming (e.g., "toy" matches "toys")
- Built-in relevance ranking
- Language-aware search

#### Implementation Steps

**Step 1: Database Migration** (`supabase/migrations/XXX_fulltext_search.sql`)

```sql
-- Enable pg_trgm for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add generated tsvector column for full-text search
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS search_vector tsvector 
GENERATED ALWAYS AS (
  setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(brand, '')), 'C')
) STORED;

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS products_search_vector_idx 
ON products USING GIN (search_vector);

-- Create GIN index for trigram similarity (typo tolerance)
CREATE INDEX IF NOT EXISTS products_name_trgm_idx 
ON products USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS products_description_trgm_idx 
ON products USING GIN (description gin_trgm_ops);

-- Create search function with ranking
CREATE OR REPLACE FUNCTION search_products_advanced(
  search_query TEXT,
  similarity_threshold FLOAT DEFAULT 0.3,
  result_limit INT DEFAULT 20
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
  WITH fts_results AS (
    SELECT 
      p.id,
      p.name,
      p.handle,
      p.image_url,
      p.thumbnail,
      p.price,
      p.currency_code,
      ts_rank_cd(p.search_vector, websearch_to_tsquery('english', search_query)) AS fts_rank
    FROM products p
    WHERE p.search_vector @@ websearch_to_tsquery('english', search_query)
  ),
  trigram_results AS (
    SELECT 
      p.id,
      p.name,
      p.handle,
      p.image_url,
      p.thumbnail,
      p.price,
      p.currency_code,
      GREATEST(
        similarity(p.name, search_query),
        similarity(p.description, search_query)
      ) AS trgm_score
    FROM products p
    WHERE 
      p.name % search_query OR 
      p.description % search_query
  ),
  combined AS (
    SELECT 
      COALESCE(fts.id, trgm.id) AS id,
      COALESCE(fts.name, trgm.name) AS name,
      COALESCE(fts.handle, trgm.handle) AS handle,
      COALESCE(fts.image_url, trgm.image_url) AS image_url,
      COALESCE(fts.thumbnail, trgm.thumbnail) AS thumbnail,
      COALESCE(fts.price, trgm.price) AS price,
      COALESCE(fts.currency_code, trgm.currency_code) AS currency_code,
      COALESCE(fts.fts_rank, 0) * 0.7 + COALESCE(trgm.trgm_score, 0) * 0.3 AS combined_score
    FROM fts_results fts
    FULL OUTER JOIN trigram_results trgm ON fts.id = trgm.id
    WHERE COALESCE(fts.fts_rank, 0) > 0 OR COALESCE(trgm.trgm_score, 0) >= similarity_threshold
  )
  SELECT 
    c.id,
    c.name,
    c.handle,
    c.image_url,
    c.thumbnail,
    c.price,
    c.currency_code,
    c.combined_score as relevance_score
  FROM combined c
  ORDER BY combined_score DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;
```

**Step 2: Update `src/lib/data/search.ts`**

```typescript
"use server"

import { createClient } from "@/lib/supabase/server"

export type SearchProductSummary = {
  id: string
  title: string
  handle: string
  thumbnail?: string | null
  price?: {
    amount: number
    currencyCode: string
    formatted: string
  }
  relevanceScore: number // Add score for debugging/ranking
}

export type SearchResultsPayload = {
  products: SearchProductSummary[]
  categories: SearchCategorySummary[]
  collections: SearchCollectionSummary[]
  suggestions: string[]
}

export const searchEntities = async ({
  query,
  countryCode: _countryCode,
  productLimit = 20,
  taxonomyLimit = 5,
}: SearchEntitiesArgs): Promise<SearchResultsPayload> => {
  const normalizedQuery = query.trim()

  if (!normalizedQuery) {
    return { products: [], categories: [], collections: [], suggestions: [] }
  }

  const supabase = await createClient()

  // Use advanced search function
  const { data: productsData, error: productsError } = await supabase
    .rpc("search_products_advanced", {
      search_query: normalizedQuery,
      similarity_threshold: 0.3,
      result_limit: productLimit
    })

  if (productsError) {
    console.error("[Search] Products error:", productsError)
  }

  // Parallel category/collection searches still use basic ILIKE
  const [categoriesRes, collectionsRes] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, handle")
      .or(`name.ilike.%${normalizedQuery}%,description.ilike.%${normalizedQuery}%`)
      .limit(taxonomyLimit),
    
    supabase
      .from("collections")
      .select("id, title, handle")
      .or(`title.ilike.%${normalizedQuery}%`)
      .limit(taxonomyLimit),
  ])

  const products = (productsData || []).map((p: any) => ({
    id: p.id,
    title: p.name,
    handle: p.handle,
    thumbnail: p.image_url || p.thumbnail,
    relevanceScore: p.relevance_score,
    price: {
      amount: p.price,
      currencyCode: p.currency_code,
      formatted: `₹${p.price}`,
    },
  }))

  // Generate suggestions from search results
  const suggestions = Array.from(
    new Set([
      normalizedQuery,
      ...products.slice(0, 3).map((p) => p.title),
    ])
  ).slice(0, 6)

  return {
    products,
    categories: categoriesRes.data || [],
    collections: collectionsRes.data || [],
    suggestions,
  }
}
```

---

## 🖼️ Part 2: Image Search Optimization

### 2.1 Current Implementation Analysis

Your current implementation using **CLIP (Xenova/clip-vit-base-patch32)** with **Transformers.js** is already solid! Here's what's good and what to optimize:

#### ✅ What's Working Well
- CLIP model is industry-standard for multimodal search
- Transformers.js enables browser/server-side execution
- pgvector for similarity search
- Quantization enabled (`quantized: true`)

#### ⚠️ Performance Bottlenecks
1. **Model loading time** (~150MB download)
2. **No caching strategy** for /tmp
3. **Vector index not optimized** (IVFFlat vs HNSW)
4. **No embedding generation pipeline** for new products

### 2.2 Optimization Steps

**Step 1: Optimize Vector Index** (`supabase/migrations/XXX_optimize_vector_index.sql`)

```sql
-- Drop old index if using IVFFlat
DROP INDEX IF EXISTS products_embedding_idx;

-- Create HNSW index (faster queries, better recall)
CREATE INDEX products_embedding_hnsw_idx 
ON products 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Tune HNSW parameters for search
-- Run this before each search query in your session
SET hnsw.ef_search = 40;

-- Update match function to use HNSW
CREATE OR REPLACE FUNCTION match_products (
  query_embedding vector(512),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    products.id,
    1 - (products.embedding <=> query_embedding) as similarity
  FROM products
  WHERE 
    products.embedding IS NOT NULL
    AND 1 - (products.embedding <=> query_embedding) > match_threshold
  ORDER BY products.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

**Step 2: Create Background Embedding Generation**

Create a Supabase Edge Function to generate embeddings asynchronously:

```typescript
// supabase/functions/generate-product-embedding/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { productId, imageUrl } = await req.json()
    
    // Fetch image from R2
    const imageResponse = await fetch(imageUrl)
    const imageBuffer = await imageResponse.arrayBuffer()
    
    // Generate embedding using your CLIP model
    // (You'll need to deploy CLIP in a serverless environment or use an API)
    const embedding = await generateEmbedding(imageBuffer)
    
    // Update product in database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    
    await supabase
      .from('products')
      .update({ embedding })
      .eq('id', productId)
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    })
  }
})
```

**Step 3: Optimize Client-Side Image Search** (`src/lib/data/image-search.ts`)

```typescript
import sharp from "sharp"
import { pipeline, env, RawImage } from "@xenova/transformers"
import { createClient } from "@/lib/supabase/server"
import { SearchResultsPayload } from "./search"

// OPTIMIZATION 1: Cache model in memory
let imagePipeline: any = null

// OPTIMIZATION 2: Set cache directory
if (process.env.NODE_ENV === 'production') {
  env.cacheDir = "/tmp/transformers-cache"
}
env.allowLocalModels = false
env.useBrowserCache = false
env.backends.onnx.wasm.numThreads = 1 // Limit threads for serverless

async function getPipeline() {
  if (!imagePipeline) {
    console.log(`[ImageSearch] Loading CLIP model...`)
    const start = Date.now()
    imagePipeline = await pipeline("image-feature-extraction", "Xenova/clip-vit-base-patch32", {
      quantized: true, // Keep quantization
    })
    console.log(`[ImageSearch] Model loaded in ${Date.now() - start}ms`)
  }
  return imagePipeline
}

export async function searchByImage({
  fileBuffer,
  limit = 12,
}: {
  fileBuffer: Buffer
  limit?: number
}): Promise<SearchResultsPayload> {
  try {
    const pipe = await getPipeline()

    // OPTIMIZATION 3: Resize image before processing
    const resizedBuffer = await sharp(fileBuffer)
      .resize(224, 224, { fit: 'cover' }) // CLIP expects 224x224
      .toBuffer()

    const { data, info } = await sharp(resizedBuffer)
      .raw()
      .toBuffer({ resolveWithObject: true })

    const image = new RawImage(new Uint8Array(data), info.width, info.height, info.channels)

    // Generate embedding
    const output = await pipe(image, { pooling: "mean", normalize: true })
    const embedding = Array.from(output.data)

    // Query with optimized params
    const supabase = await createClient()
    
    const { data: productIds, error } = await supabase.rpc("match_products", {
      query_embedding: embedding,
      match_threshold: 0.6, // Increased threshold for better quality
      match_count: limit
    })

    if (error) {
      console.error("[ImageSearch] Vector search error:", error)
      throw new Error("Image search failed")
    }

    if (!product Ids || productIds.length === 0) {
      return { products: [], categories: [], collections: [], suggestions: [] }
    }

    // Fetch full product details
    const ids = productIds.map((p: any) => p.id)
    const { data: products } = await supabase
      .from("products")
      .select("id, name, handle, image_url, price, currency_code, thumbnail")
      .in("id", ids)

    const normalizedProducts = (products || []).map((p: any) => ({
      id: p.id,
      title: p.name,
      handle: p.handle,
      thumbnail: p.image_url || p.thumbnail,
      price: {
        amount: p.price,
        currencyCode: p.currency_code,
        formatted: `₹${p.price}`,
      },
    }))

    return {
      products: normalizedProducts,
      categories: [],
      collections: [],
      suggestions: [],
    }
  } catch (err) {
    console.error("[ImageSearch] Error:", err)
    throw err
  }
}
```

---

## 🎤 Part 3: Voice Search Optimization

### 3.1 Current Implementation Review

Your current `useVoiceSearch` hook using **Web Speech API** is good, but has limitations:

#### ✅ Strengths
- Native browser support (Chrome, Edge)
- Free tier
- Real-time transcription

#### ⚠️ Limitations
- **Firefox & Safari**: Limited/no support
- **Privacy**: Sends audio to Google servers
- **Accuracy**: Basic compared to Whisper

### 3.2 Enhanced Implementation

**Recommended Approach: Keep Web Speech API + Add Fallback**

**Step 1: Add Browser Compatibility Check**

```typescript
// src/modules/layout/hooks/useVoiceSearch.ts (enhanced)
"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export const useVoiceSearch = ({
  language = "en-US",
  onResult,
}: UseVoiceSearchArgs = {}) => {
  const [isSupported, setIsSupported] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [browserInfo, setBrowserInfo] = useState<string>("")

  const recognitionRef = useRef<SpeechRecognitionShape | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    // Detect browser
    const ua = navigator.userAgent
    let browser = "Unknown"
    if (ua.includes("Chrome")) browser = "Chrome"
    else if (ua.includes("Firefox")) browser = "Firefox"
    else if (ua.includes("Safari")) browser = "Safari"
    else if (ua.includes("Edge")) browser = "Edge"
    
    setBrowserInfo(browser)

    const RecognitionConstructor =
      window.SpeechRecognition || window.webkitSpeechRecognition

    if (!RecognitionConstructor) {
      setIsSupported(false)
      setError(`Voice search is not supported on ${browser}. Please use Chrome or Edge.`)
      return
    }

    const recognition = new RecognitionConstructor()
    recognition.lang = language
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognition.continuous = false // Better for search queries

    recognition.onstart = () => {
      setIsListening(true)
      setTranscript("")
      setError(null)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const message =
        event.error === "not-allowed"
          ? "Microphone permission denied. Please allow microphone access."
          : event.error === "network"
            ? "Network error. Please check your connection."
            : event.error === "no-speech"
              ? "No speech detected. Please try again."
            : `Error: ${event.error}`
      setError(message)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ""
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript
        }
      }

      if (finalTranscript) {
        setTranscript(finalTranscript)
        onResult?.(finalTranscript)
        // Auto-stop after final result
        recognition.stop()
      }
    }

    recognitionRef.current = recognition
    setIsSupported(true)

    return () => {
      recognition.stop()
    }
  }, [language, onResult])

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      setError("Voice search is not available in your browser.")
      return
    }

    try {
      recognitionRef.current.start()
    } catch (err) {
      if (err instanceof DOMException && err.name === "InvalidStateError") {
        // Already listening, ignore
        return
      }
      setError("Failed to start voice recognition")
    }
  }, [isSupported])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  return {
    isSupported,
    isListening,
    transcript,
    error,
    browserInfo,
    startListening,
    stopListening,
  }
}
```

---

## 🚀 Part 4: Search UX Best Practices

### 4.1 Debounced Search Input

```typescript
// src/lib/hooks/useDebounce.ts
import { useEffect, useState } from 'react'

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
```

**Usage in Search Component:**

```typescript
"use client"

import { useState } from 'react'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { searchEntities } from '@/lib/data/search'

export function SearchInput() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  
  const debouncedQuery = useDebounce(query, 300)

  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setResults([])
        return
      }

      setIsLoading(true)
      try {
        const data = await searchEntities({
          query: debouncedQuery,
          countryCode: 'IN',
          productLimit: 8,
        })
        setResults(data.products)
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    performSearch()
  }, [debouncedQuery])

  return (
    <div className="relative">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search toys..."
        className="w-full px-4 py-2 border rounded-lg"
      />
      
      {isLoading && <LoadingSpinner />}
      
      {results.length > 0 && (
        <SearchDropdown results={results} />
      )}
    </div>
  )
}
```

### 4.2 Autocomplete with Suggestions

```typescript
// src/components/search/SearchAutocomplete.tsx
"use client"

import { useState, useRef, useEffect } from 'react'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { searchEntities } from '@/lib/data/search'
import Image from 'next/image'
import Link from 'next/link'

export function SearchAutocomplete() {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState<SearchResultsPayload | null>(null)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const debouncedQuery = useDebounce(query, 250)

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setResults(null)
      setIsOpen(false)
      return
    }

    searchEntities({
      query: debouncedQuery,
      countryCode: 'IN',
      productLimit: 6,
      taxonomyLimit: 3,
    }).then((data) => {
      setResults(data)
      setIsOpen(true)
    })
  }, [debouncedQuery])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!results || !isOpen) return

    const totalItems = (results.suggestions?.length || 0) + (results.products?.length || 0)

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev + 1) % totalItems)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev - 1 + totalItems) % totalItems)
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault()
      // Handle selection
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className="relative w-full max-w-2xl">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => results && setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        placeholder="Search for toys, brands, categories..."
        className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-xl focus:border-black focus:ring-0 transition-all"
      />

      {isOpen && results && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 max-h-[600px] overflow-y-auto z-50">
          {/* Suggestions */}
          {results.suggestions && results.suggestions.length > 0 && (
            <div className="border-b border-gray-100 p-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
                Suggestions
              </p>
              {results.suggestions.map((suggestion, idx) => (
                <Link
                  key={idx}
                  href={`/store?q=${encodeURIComponent(suggestion)}`}
                  className="block px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="text-sm text-gray-700">{suggestion}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Products */}
          {results.products && results.products.length > 0 && (
            <div className="p-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">
                Products
              </p>
              {results.products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.handle}`}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {product.thumbnail && (
                    <Image
                      src={product.thumbnail}
                      alt={product.title}
                      width={48}
                      height={48}
                      className="rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">{product.title}</p>
                    <p className="text-sm text-gray-600">{product.price?.formatted}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Categories & Collections */}
          {(results.categories?.length > 0 || results.collections?.length > 0) && (
            <div className="border-t border-gray-100 p-3">
              {results.categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.handle}`}
                  className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  <span className="font-medium">Category:</span> {cat.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

---

## 🏗️ Part 5: Hybrid Search Implementation

### 5.1 Combining Vector + Keyword Search

```sql
-- Migration: Hybrid search function
CREATE OR REPLACE FUNCTION hybrid_search_products(
  text_query TEXT,
  image_embedding vector(512) DEFAULT NULL,
  text_weight FLOAT DEFAULT 0.6,
  image_weight FLOAT DEFAULT 0.4,
  result_limit INT DEFAULT 20
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  handle TEXT,
  image_url TEXT,
  price DECIMAL,
  currency_code TEXT,
  combined_score FLOAT,
  text_score FLOAT,
  image_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  WITH text_search AS (
    SELECT 
      p.id,
      p.name,
      p.handle,
      p.image_url,
      p.price,
      p.currency_code,
      ts_rank_cd(p.search_vector, websearch_to_tsquery('english', text_query)) AS score
    FROM products p
    WHERE p.search_vector @@ websearch_to_tsquery('english', text_query)
  ),
  image_search AS (
    SELECT 
      p.id,
      p.name,
      p.handle,
      p.image_url,
      p.price,
      p.currency_code,
      1 - (p.embedding <=> image_embedding) AS score
    FROM products p
    WHERE 
      image_embedding IS NOT NULL 
      AND p.embedding IS NOT NULL
  )
  SELECT 
    COALESCE(ts.id, imgs.id) AS id,
    COALESCE(ts.name, imgs.name) AS name,
    COALESCE(ts.handle, imgs.handle) AS handle,
    COALESCE(ts.image_url, imgs.image_url) AS image_url,
    COALESCE(ts.price, imgs.price) AS price,
    COALESCE(ts.currency_code, imgs.currency_code) AS currency_code,
    (COALESCE(ts.score, 0) * text_weight + COALESCE(imgs.score, 0) * image_weight) AS combined_score,
    COALESCE(ts.score, 0) AS text_score,
    COALESCE(imgs.score, 0) AS image_score
  FROM text_search ts
  FULL OUTER JOIN image_search imgs ON ts.id = imgs.id
  WHERE (COALESCE(ts.score, 0) * text_weight + COALESCE(imgs.score, 0) * image_weight) > 0
  ORDER BY combined_score DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql STABLE;
```

---

## 📊 Part 6: Performance Monitoring

### 6.1 Search Analytics Schema

```sql
-- Analytics table
CREATE TABLE IF NOT EXISTS search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_query TEXT NOT NULL,
  search_type TEXT NOT NULL, -- 'text', 'image', 'voice', 'hybrid'
  results_count INT NOT NULL,
  user_id TEXT,
  clicked_product_id TEXT,
  session_id TEXT,
  search_duration_ms INT,
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- Index for analytics queries
CREATE INDEX search_analytics_query_idx ON search_analytics(search_query);
CREATE INDEX search_analytics_created_at_idx ON search_analytics(created_at);
CREATE INDEX search_analytics_type_idx ON search_analytics(search_type);

-- Function to track searches
CREATE OR REPLACE FUNCTION track_search(
  p_query TEXT,
  p_type TEXT,
  p_results_count INT,
  p_user_id TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_duration_ms INT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO search_analytics (
    search_query, search_type, results_count, 
    user_id, session_id, search_duration_ms
  )
  VALUES (
    p_query, p_type, p_results_count,
    p_user_id, p_session_id, p_duration_ms
  )
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;
```

### 6.2 Client-Side Tracking

```typescript
// src/lib/analytics/search-tracking.ts
export async function trackSearch({
  query,
  type,
  resultsCount,
  durationMs,
}: {
  query: string
  type: 'text' | 'image' | 'voice' | 'hybrid'
  resultsCount: number
  durationMs: number
}) {
  const supabase = createClientComponentClient()
  
  await supabase.rpc('track_search', {
    p_query: query,
    p_type: type,
    p_results_count: resultsCount,
    p_duration_ms: durationMs,
    p_session_id: sessionStorage.getItem('session_id'),
  })
}
```

---

## 🛠️ Part 7: Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Implement Full-Text Search with trigram fallback
- [ ] Add GIN indexes
- [ ] Optimize existing image search with HNSW
- [ ] Create debounced search hook
- [ ] Add basic autocomplete

### Phase 2: UX Enhancement (Week 3-4)
- [ ] Build advanced autocomplete with categories
- [ ] Add search suggestions
- [ ] Implement keyboard navigation
- [ ] Add mobile-optimized search
- [ ] Create loading states and skeletons

### Phase 3: Advanced Features (Week 5-6)
- [ ] Implement hybrid search (text + image)
- [ ] Add search analytics tracking
- [ ] Create admin search dashboard
- [ ] Optimize voice search with better error handling
- [ ] Add"did you mean" for misspellings

### Phase 4: Performance & Scale (Week 7-8)
- [ ] Set up Redis caching for popular searches
- [ ] Implement search result pagination
- [ ] Add streaming search results
- [ ] Create background job for embedding generation
- [ ] Optimize database queries

---

## 🎯 Key Recommendations Summary

### Text Search
- ✅ Use PostgreSQL Full-Text Search (FTS) with `tsvector`
- ✅ Add `pg_trgm` for fuzzy matching and typo tolerance
- ✅ Create weighted ranking (title > description > brand)
- ✅ Use GIN indexes for performance

### Image Search
- ✅ Keep CLIP model (industry standard)
- ✅ Switch from IVFFlat to HNSW indexing
- ✅ Optimize image preprocessing (resize to 224x224)
- ✅ Cache model in `/tmp` for serverless
- ✅ Generate embeddings in background jobs

### Voice Search
- ✅ Keep Web Speech API (free, native, fast)
- ✅ Add browser compatibility warnings
- ✅ Improve error handling
- 🚫 Don't use Whisper API (costly, overkill for search queries)
- ⚠️ Consider Whisper Web (browser-based) only if privacy is critical

### UX & Performance
- ✅ Implement debouncing (300ms delay)
- ✅ Add autocomplete with product thumbnails
- ✅ Use hybrid search for best results
- ✅ Track search analytics
- ✅ Implement streaming results for large datasets

### Infrastructure
- ✅ Use Supabase Edge Functions for heavy compute
- ✅ Cache popular searches in Redis/KV store
- ✅ Monitor query performance with `EXPLAIN ANALYZE`
- ✅ Set up search analytics dashboard

---

## 📚 References & Resources

### Official Documentation
1. [PostgreSQL Full-Text Search](https://www.postgresql.org/docs/current/textsearch.html)
2. [pgvector Documentation](https://github.com/pgvector/pgvector)
3. [Transformers.js](https://huggingface.co/docs/transformers.js)
4. [CLIP Model Paper](https://arxiv.org/abs/2103.00020)
5. [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

### Performance Guides
6. [Supabase Vector Search Guide](https://supabase.com/docs/guides/ai/vector-indexes)
7. [Next.js Search Optimization](https://nextjs.org/docs/app/building-your-application/optimizing)
8. [pgvector HNSW vs IVFFlat](https://tembo.io/blog/pgvector-indexes)

### Best Practices
9. [E-commerce Search UX](https://baymard.com/blog/autocomplete-search)
10. [Hybrid Search Implementation](https://weaviate.io/blog/hybrid-search-explained)
11. [Search Analytics Tracking](https://www.optimizely.com/optimization-glossary/search-analytics/)

---

**Generated:** January 13, 2026  
**Version:** 1.0  
**Based on:** 25+ authoritative sources including official documentation, research papers, and industry best practices
