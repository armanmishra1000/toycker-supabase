"use server"

import { createClient } from "@/lib/supabase/server"
import { Product } from "@/lib/supabase/types"
import { SortOptions } from "@modules/store/components/refinement-list/types"

export async function listProducts({
  regionId,
  queryParams
}: {
  regionId?: string
  queryParams?: Record<string, unknown>
} = {}): Promise<{ response: { products: Product[]; count: number } }> {
  const supabase = await createClient()
  
  let query = supabase.from("products").select("*", { count: "exact" })

  if (queryParams?.limit) {
    query = query.limit(Number(queryParams.limit))
  }

  if (queryParams?.collection_id) {
    // Assuming collection_id is a single value filter for now or array
    // Adjust based on your schema. If products have collection_id column:
    const collectionIds = Array.isArray(queryParams.collection_id) ? queryParams.collection_id : [queryParams.collection_id]
    if (collectionIds.length > 0) {
        // If queryParams.collection_id is passed, we filter by it.
        // Assuming products table has 'collection_id' column or M-to-M relation.
        // For simplicity based on types: product has collection_id
        query = query.in("collection_id", collectionIds)
    }
  }
  
  // Basic implementation of listing
  const { data, count, error } = await query.order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching products:", error)
    return { response: { products: [], count: 0 } }
  }

  return { response: { products: data as Product[], count: count || 0 } }
}

export async function retrieveProduct(id: string): Promise<Product | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error(`Error fetching product by ID ${id}:`, error)
    return null
  }

  return data as Product
}

export async function getProductByHandle(handle: string): Promise<Product | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("handle", handle)
    .single()

  if (error) {
    console.error("Error fetching product:", error)
    return null
  }

  return data as Product
}

export async function listPaginatedProducts({
  page = 1,
  limit = 12,
  sortBy = "featured",
  countryCode,
  queryParams,
  availability,
  priceFilter,
  ageFilter,
}: {
  page?: number
  limit?: number
  sortBy?: SortOptions
  countryCode?: string
  queryParams?: Record<string, unknown>
  availability?: "in_stock" | "out_of_stock"
  priceFilter?: { min?: number; max?: number }
  ageFilter?: string
}): Promise<{
  response: { products: Product[]; count: number }
  pagination: { page: number; limit: number }
}> {
  const supabase = await createClient()
  const offset = (page - 1) * limit

  let query = supabase
    .from("products")
    .select("*", { count: "exact" })

  // Apply filters from queryParams
  if (queryParams?.category_id) {
    query = query.in("category_id", Array.isArray(queryParams.category_id) ? queryParams.category_id : [queryParams.category_id])
  }
  
  if (queryParams?.collection_id) {
    query = query.in("collection_id", Array.isArray(queryParams.collection_id) ? queryParams.collection_id : [queryParams.collection_id])
  }

  if (queryParams?.id) {
    query = query.in("id", Array.isArray(queryParams.id) ? queryParams.id : [queryParams.id])
  }

  if (queryParams?.q) {
    query = query.ilike("name", `%${queryParams.q}%`)
  }

  if (priceFilter?.min !== undefined) {
    query = query.gte("price", priceFilter.min)
  }
  if (priceFilter?.max !== undefined) {
    query = query.lte("price", priceFilter.max)
  }

  // Sorting
  if (sortBy === "price_asc") {
    query = query.order("price", { ascending: true })
  } else if (sortBy === "price_desc") {
    query = query.order("price", { ascending: false })
  } else if (sortBy === "alpha_asc") {
    query = query.order("name", { ascending: true })
  } else if (sortBy === "alpha_desc") {
    query = query.order("name", { ascending: false })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  const { data, count, error } = await query
    .range(offset, offset + limit - 1)

  if (error) {
    console.error("Error fetching paginated products:", error)
    return {
      response: { products: [], count: 0 },
      pagination: { page, limit },
    }
  }

  let products = data as Product[]

  // In-memory filtering for properties not easily queryable if they are in JSONB or computed
  if (availability === "in_stock") {
    products = products.filter(p => p.stock_count > 0)
  } else if (availability === "out_of_stock") {
    products = products.filter(p => p.stock_count <= 0)
  }

  return {
    response: {
      products: products,
      count: count || 0,
    },
    pagination: {
      page,
      limit,
    },
  }
}