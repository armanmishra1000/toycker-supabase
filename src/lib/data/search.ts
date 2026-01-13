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
}

export type SearchCategorySummary = {
    id: string
    name: string
    handle: string
}

export type SearchCollectionSummary = {
    id: string
    title: string
    handle: string
}

export type SearchResultsPayload = {
    products: SearchProductSummary[]
    categories: SearchCategorySummary[]
    collections: SearchCollectionSummary[]
    suggestions: string[]
}

type SearchEntitiesArgs = {
    query: string
    countryCode: string
    productLimit?: number
    taxonomyLimit?: number
}

export const searchEntities = async ({
    query,
    countryCode: _countryCode,
    productLimit = 6,
    taxonomyLimit = 5,
}: SearchEntitiesArgs): Promise<SearchResultsPayload> => {
    const normalizedQuery = query.trim()

    if (!normalizedQuery) {
        return { products: [], categories: [], collections: [], suggestions: [] }
    }

    const supabase = await createClient()

    // 1. Parallelize queries for speed
    const [productsRes, categoriesRes, collectionsRes] = await Promise.all([
        // Search Products using Advanced RPC
        supabase.rpc("search_products_advanced", {
            search_query: normalizedQuery,
            similarity_threshold: 0.2, // Lower threshold for more results
            result_limit: productLimit,
        }),

        // Search Categories
        supabase
            .from("categories")
            .select("id, name, handle")
            .ilike("name", `%${normalizedQuery}%`)
            .limit(taxonomyLimit),

        // Search Collections
        supabase
            .from("collections")
            .select("id, title, handle")
            .ilike("title", `%${normalizedQuery}%`)
            .limit(taxonomyLimit),
    ])

    // 2. Process results (Normalization)
    const products = (productsRes.data || []).map((p: any) => ({
        id: p.id,
        title: p.name,
        handle: p.handle,
        thumbnail: p.image_url || p.thumbnail,
        price: {
            amount: p.price,
            currencyCode: p.currency_code || "INR",
            formatted: `₹${p.price}`,
        },
    }))

    const categories = (categoriesRes.data || []).map((c: { id: string; name: string; handle: string }) => ({
        id: c.id,
        name: c.name,
        handle: c.handle,
    }))

    const collections = (collectionsRes.data || []).map((c: { id: string; title: string; handle: string }) => ({
        id: c.id,
        title: c.title,
        handle: c.handle,
    }))

    // 3. Generate Smart Suggestions
    const suggestionPool = [
        normalizedQuery,
        ...products.map((p: { title: string }) => p.title),
        ...categories.map((c: { name: string }) => c.name),
    ]

    const uniqueSuggestions = Array.from(new Set(suggestionPool)).slice(0, 6)

    return {
        products,
        categories,
        collections,
        suggestions: uniqueSuggestions,
    }
}

