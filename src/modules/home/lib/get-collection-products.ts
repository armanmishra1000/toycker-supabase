"use server"

import { listProducts } from "@lib/data/products"
import { getCollectionByHandle } from "@lib/data/collections"
import type { HttpTypes } from "@medusajs/types"

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
}: GetCollectionProductsArgs): Promise<HttpTypes.StoreProduct[]> => {
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
      fields:
        "id,title,handle,description,thumbnail,*images,*variants.id,*variants.title,*variants.calculated_price,*variants.prices,*variants.manage_inventory,*variants.allow_backorder,*variants.inventory_quantity",
    },
  })

  return products
}
