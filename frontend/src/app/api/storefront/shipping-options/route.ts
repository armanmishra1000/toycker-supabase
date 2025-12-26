import { NextResponse } from "next/server"

import { HttpTypes } from "@medusajs/types"

import { listCartOptions, retrieveCart } from "@lib/data/cart"

const SHIPPING_OPTIONS_TTL = 1000 * 15 // 15 seconds cache window per cart snapshot

type ShippingOptionsCacheEntry = {
  data: HttpTypes.StoreCartShippingOption[]
  expiresAt: number
}

const shippingOptionsCache = new Map<string, ShippingOptionsCacheEntry>()

const normalizeUpdatedAt = (value?: string | Date | null) => {
  if (!value) return ""
  if (typeof value === "string") return value
  return value.toISOString()
}

const buildCacheKey = (cartId: string, regionId?: string | null, updatedAt?: string | Date | null) => {
  return `${cartId}-${regionId ?? ""}-${normalizeUpdatedAt(updatedAt)}`
}

const setCache = (
  key: string,
  data: HttpTypes.StoreCartShippingOption[],
) => {
  shippingOptionsCache.set(key, {
    data,
    expiresAt: Date.now() + SHIPPING_OPTIONS_TTL,
  })
}

const pruneCacheForCart = (cartId: string) => {
  for (const cacheKey of Array.from(shippingOptionsCache.keys())) {
    if (!cacheKey.startsWith(`${cartId}-`)) {
      continue
    }

    const entry = shippingOptionsCache.get(cacheKey)
    if (!entry) {
      continue
    }

    if (entry.expiresAt <= Date.now()) {
      shippingOptionsCache.delete(cacheKey)
    }
  }
}

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const cart = await retrieveCart(undefined, "id,region_id,updated_at")

    if (!cart) {
      return NextResponse.json({ shippingOptions: [], regionId: null })
    }

    pruneCacheForCart(cart.id)

    const cacheKey = buildCacheKey(cart.id, cart.region_id, cart.updated_at ?? undefined)
    const cachedEntry = shippingOptionsCache.get(cacheKey)

    if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
      return NextResponse.json({ shippingOptions: cachedEntry.data, regionId: cart.region_id })
    }

    const { shipping_options } = await listCartOptions()

    setCache(cacheKey, shipping_options)

    return NextResponse.json({ shippingOptions: shipping_options, regionId: cart.region_id })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load shipping options"
    return NextResponse.json({ message }, { status: 500 })
  }
}
