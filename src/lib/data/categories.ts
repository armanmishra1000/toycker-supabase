"use server"

import { unstable_cache } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { Category } from "@/lib/supabase/types"

// Cache TTL: 10 minutes in seconds
const CATEGORIES_CACHE_TTL = 86400

// Internal function for listCategories
const listCategoriesInternal = async (page: number = 1, limit: number = 20) => {
  const supabase = await createClient()
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from("categories")
    .select("id, name, handle, description, image_url", { count: "exact" })
    .range(from, to)

  if (error) {
    console.error("Error fetching categories:", error)
    return { categories: [], count: 0 }
  }

  return { categories: data as Category[], count: count || 0 }
}

export const listCategories = unstable_cache(
  listCategoriesInternal,
  ["categories", "list"],
  { revalidate: CATEGORIES_CACHE_TTL, tags: ["categories"] }
)

// Internal function for getCategoryByHandle
const getCategoryByHandleInternal = async (categoryHandle: string[]): Promise<Category | null> => {
  const handle = categoryHandle[categoryHandle.length - 1]
  const supabase = await createClient()

  // Fetch the current category and its parent information
  const { data, error } = await supabase
    .from("categories")
    .select("*, parent_category:categories!categories_parent_category_id_fkey(*)")
    .eq("handle", handle)
    .maybeSingle()

  if (error) {
    if (error.code !== 'PGRST116') {
      console.error("Error fetching category:", error)
    }
    return null
  }

  return data as Category
}

export const getCategoryByHandle = unstable_cache(
  getCategoryByHandleInternal,
  ["categories", "handle"],
  { revalidate: CATEGORIES_CACHE_TTL, tags: ["categories"] }
)