"use server"

import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"

import { getAuthHeaders, getCacheOptions } from "./cookies"

type StoreExclusiveCollectionEntry = {
  id: string
  product_id: string
  video_url: string
  poster_url: string | null
  sort_order: number | null
}

export type ExclusiveCollectionEntry = StoreExclusiveCollectionEntry & {
  product: HttpTypes.StoreProduct | null
}

const PRODUCT_FIELD_SELECTION = [
  "id",
  "title",
  "handle",
  "thumbnail",
  "*images",
  "+metadata",
  "*variants.calculated_price",
  "*variants.prices",
  "*variants.options",
  "*variants.inventory_quantity",
  "+variants.metadata",
].join(",")

const EXCLUSIVE_COLLECTIONS_REVALIDATE_SECONDS = (() => {
  const raw = process.env.NEXT_PUBLIC_EXCLUSIVE_COLLECTIONS_REVALIDATE

  if (!raw) {
    return 300
  }

  const normalized = raw.trim().toLowerCase()

  if (["0", "false", "off", "disable", "disabled"].includes(normalized)) {
    return 0
  }

  const parsed = Number(raw)
  if (Number.isFinite(parsed) && parsed >= 0) {
    return parsed
  }

  return 300
})()

const buildCacheConfig = async (tag: string) => {
  if (EXCLUSIVE_COLLECTIONS_REVALIDATE_SECONDS <= 0) {
    return { cache: "no-store" as const }
  }

  const cacheOptions = await getCacheOptions(tag)

  return {
    cache: "force-cache" as const,
    next: {
      revalidate: EXCLUSIVE_COLLECTIONS_REVALIDATE_SECONDS,
      ...(cacheOptions as { tags?: string[] }),
    },
  }
}

export const listExclusiveCollections = async ({
  regionId,
}: {
  regionId: string
}): Promise<ExclusiveCollectionEntry[]> => {
  if (!regionId) {
    return []
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  let entries: StoreExclusiveCollectionEntry[] = []

  try {
    const entryCacheConfig = await buildCacheConfig("exclusive-collections")
    const payload = await sdk.client.fetch<{ entries: StoreExclusiveCollectionEntry[] }>(
      "/store/exclusive-collections",
      {
        method: "GET",
        headers,
        cache: entryCacheConfig.cache,
        ...(entryCacheConfig.next ? { next: entryCacheConfig.next } : {}),
      },
    )

    entries = payload.entries ?? []
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Unable to load exclusive collections", error)
    }

    return []
  }

  if (!entries.length) {
    return []
  }

  const productIds = Array.from(new Set(entries.map((entry) => entry.product_id).filter(Boolean)))

  if (!productIds.length) {
    return entries.map((entry) => ({ ...entry, product: null }))
  }

  let products: HttpTypes.StoreProduct[] = []

  try {
    const productCacheConfig = await buildCacheConfig("exclusive-collection-products")
    const payload = await sdk.client.fetch<{ products: HttpTypes.StoreProduct[] }>(
      "/store/products",
      {
        method: "GET",
        headers,
        cache: productCacheConfig.cache,
        ...(productCacheConfig.next ? { next: productCacheConfig.next } : {}),
        query: {
          id: productIds,
          region_id: regionId,
          limit: productIds.length,
          fields: PRODUCT_FIELD_SELECTION,
        },
      },
    )

    products = payload.products ?? []
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Unable to load exclusive collection products", error)
    }
  }

  const productMap = new Map(products.map((product) => [product.id, product]))

  return entries.map((entry) => ({
    ...entry,
    product: productMap.get(entry.product_id) ?? null,
  }))
}
