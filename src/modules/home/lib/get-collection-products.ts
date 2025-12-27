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
  const resolvedCollectionId = collectionId ?? (await getCollectionByHandle(handle))?.id

  if (!resolvedCollectionId) {
    return []
  }

  const {
    response: { products },
  } = await listProducts({
    regionId,
    queryParams: {
      collection_id: [resolvedCollectionId],
      limit,
    },
  })

  return products
}