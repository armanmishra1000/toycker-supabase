"use server"

import { unstable_cache } from "next/cache"
import { listProducts } from "@lib/data/products"
import { getCollectionByHandle } from "@lib/data/collections"
import type { Product } from "@/lib/supabase/types"

type GetCollectionProductsArgs = {
  handle: string
  regionId: string
  limit?: number
  collectionId?: string
}

const getCollectionProductsByHandleInternal = async ({
  handle,
  regionId,
  limit = 5,
  collectionId,
}: GetCollectionProductsArgs): Promise<Product[]> => {
  let resolvedCollectionId = collectionId

  // Try to resolve collection ID if not provided
  if (!resolvedCollectionId) {
    const collection = await getCollectionByHandle(handle)
    resolvedCollectionId = collection?.id
  }

  // Fetch products
  // If we have a collection ID, try to fetch products for it
  if (resolvedCollectionId) {
    const { response: { products } } = await listProducts({
      regionId,
      queryParams: {
        collection_id: [resolvedCollectionId],
        limit,
      },
    })

    // If we found products, return them
    if (products.length > 0) {
      return products
    }
  }

  // FALLBACK: If collection doesn't exist or has no products, 
  // fetch latest products instead so the UI isn't empty.
  const {
    response: { products: fallbackProducts },
  } = await listProducts({
    regionId,
    queryParams: {
      limit,
    },
  })

  return fallbackProducts
}

export const getCollectionProductsByHandle = async (args: GetCollectionProductsArgs) =>
  unstable_cache(
    () => getCollectionProductsByHandleInternal(args),
    ["collection-products", args.handle, args.regionId, String(args.limit)],
    { revalidate: 3600, tags: ["products", "collections"] }
  )()