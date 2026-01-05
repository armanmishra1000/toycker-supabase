"use server"

import { unstable_cache } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export interface Collection {
  id: string
  title: string
  handle: string
  created_at: string
}

// Cache TTL: 10 minutes in seconds
const COLLECTIONS_CACHE_TTL = 86400

// Internal function for listCollections
const listCollectionsInternal = async () => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("collections")
    .select("id, title, handle, created_at")

  if (error) {
    console.error("Error fetching collections:", error.message)
    return { collections: [], count: 0 }
  }

  return { collections: data as Collection[], count: data.length }
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
    .select("id, title, handle, created_at")
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