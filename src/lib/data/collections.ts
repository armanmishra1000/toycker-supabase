"use server"

import { unstable_cache } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { Collection } from "@/lib/supabase/types"

// Cache TTL: 10 minutes in seconds
const COLLECTIONS_CACHE_TTL = 86400

// Internal function for listCollections
const listCollectionsInternal = async (page: number = 1, limit: number = 20) => {
  const supabase = await createClient()
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from("collections")
    .select("id, title, handle, created_at, image_url", { count: "exact" })
    .range(from, to)

  if (error) {
    console.error("Error fetching collections:", error.message)
    return { collections: [], count: 0 }
  }

  return { collections: data as Collection[], count: count || 0 }
}

export const listCollections = unstable_cache(
  listCollectionsInternal,
  ["collections", "list"],
  { revalidate: COLLECTIONS_CACHE_TTL, tags: ["collections"] }
)

// Internal function for getCollectionByHandle
const getCollectionByHandleInternal = async (handle: string) => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("collections")
    .select("id, title, handle, created_at, image_url")
    .eq("handle", handle)
    .maybeSingle()

  if (error) {
    console.error("Error fetching collection:", error.message)
    return null
  }

  return data as Collection
}

export const getCollectionByHandle = unstable_cache(
  getCollectionByHandleInternal,
  ["collections", "handle"],
  { revalidate: COLLECTIONS_CACHE_TTL, tags: ["collections"] }
)