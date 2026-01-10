"use server"

import { createClient } from "@/lib/supabase/server"
import { Product } from "@/lib/supabase/types"

export type ExclusiveCollectionEntry = {
  id: string
  product_id: string
  video_url: string
  poster_url: string | null
  video_duration: number | null
  sort_order: number
  product: Product | null
}

export const listExclusiveCollections = async ({
  regionId,
}: {
  regionId: string
}): Promise<ExclusiveCollectionEntry[]> => {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("home_exclusive_collections")
    .select(`
      *,
      product:products (
        id,
        name,
        handle,
        image_url,
        images,
        price,
        description,
        collection_id,
        metadata,
        created_at,
        updated_at
      )
    `)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (error) {
    console.warn("Error fetching exclusive collections:", error)
    return []
  }

  if (!data || data.length === 0) {
    return []
  }

  return data as ExclusiveCollectionEntry[]
}