"use server"

import { createClient } from "@/lib/supabase/server"
import { Product } from "@/lib/supabase/types"
import { SortOptions } from "@modules/store/components/refinement-list/types"

export async function listProducts(): Promise<Product[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching products:", error)
    return []
  }

  return data as Product[]
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
}: {
  page?: number
  limit?: number
  sortBy?: SortOptions
}): Promise<{
  response: { products: Product[]; count: number }
  pagination: { page: number; limit: number }
}> {
  const supabase = await createClient()
  const offset = (page - 1) * limit

  let query = supabase
    .from("products")
    .select("*", { count: "exact" })

  if (sortBy === "price_asc") {
    query = query.order("price", { ascending: true })
  } else if (sortBy === "price_desc") {
    query = query.order("price", { ascending: false })
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

  return {
    response: {
      products: data as Product[],
      count: count || 0,
    },
    pagination: {
      page,
      limit,
    },
  }
}
