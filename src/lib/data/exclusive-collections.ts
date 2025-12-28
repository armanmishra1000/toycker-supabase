"use server"

import { Product } from "@/lib/supabase/types"
import { listProducts } from "./products"

export type ExclusiveCollectionEntry = {
  id: string
  product_id: string
  video_url: string
  poster_url: string | null
  sort_order: number | null
  product: Product | null
}

export const listExclusiveCollections = async ({
  regionId,
}: {
  regionId: string
}): Promise<ExclusiveCollectionEntry[]> => {
  // Fetch products and assign local video files
  const { response: { products } } = await listProducts()
  return products.slice(0, 6).map((product, index) => ({
    id: `exclusive-${index}`,
    product_id: product.id,
    video_url: `/assets/videos/exclusive-${index + 1}.mp4`,
    poster_url: product.thumbnail ?? product.image_url ?? null,
    sort_order: index,
    product,
  }))
}