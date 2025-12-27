"use server"

import { listProducts } from "@lib/data/products"
import { getCollectionByHandle } from "@lib/data/collections"
import type { Product } from "@/lib/supabase/types"

type GetCollectionProductsArgs = {
  handle: string
  regionId: string
  limit?: number
  collectionId?: string
}

export const getCollectionProductsByHandle = async ({
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