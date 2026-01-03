"use server"

import { unstable_cache } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { Category } from "@/lib/supabase/types"

// Cache TTL: 10 minutes in seconds
const CATEGORIES_CACHE_TTL = 86400

// Internal function for listCategories
const listCategoriesInternal = async (): Promise<Category[]> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, handle, description")

  if (error) {
    console.error("Error fetching categories:", error)
    return []
  }

  return data as Category[]
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

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, handle, description")
    .eq("handle", handle)
    .maybeSingle()

  if (error) {
    // Only log if it's not a 'no rows' error to keep build logs clean
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