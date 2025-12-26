import { Buffer } from "node:buffer"

import type { SearchResultsPayload } from "@lib/data/search"
import { listProducts } from "@lib/data/products"

type ImageSearchArgs = {
  fileBuffer: Buffer
  countryCode: string
  limit?: number
}

const FALLBACK_LIMIT = 6

export const isImageSearchEnabled = Boolean(process.env.IMAGE_SEARCH_PROVIDER)

export const searchByImage = async ({
  fileBuffer,
  countryCode,
  limit = FALLBACK_LIMIT,
}: ImageSearchArgs): Promise<SearchResultsPayload> => {
  // Basic prototype: if no provider configured, return top products fallback to keep UX fast.
  // Use byteLength to avoid unused variable warnings and allow future provider integration.
  const _size = fileBuffer.byteLength

  if (!countryCode) {
    throw new Error("countryCode is required for image search")
  }

  // When a provider is configured, plug in provider call here. For now, reuse products list as fast fallback.
  const { response } = await listProducts(
    {
      pageParam: 1,
      queryParams: {
        limit,
        fields: "id,title,handle,thumbnail,+variants.prices",
      },
      countryCode,
    },
    { skipCollectionExpansion: true }
  )

  return {
    products: response.products.map((product) => {
      const firstVariant = Array.isArray(product.variants)
        ? (product.variants[0] as
            | (typeof product.variants[number] & {
                prices?: Array<{ amount: number; currency_code: string }>
              })
            | undefined)
        : undefined

      const firstPrice = firstVariant?.prices?.[0]

      const price = firstPrice
        ? {
            amount: firstPrice.amount,
            currencyCode: firstPrice.currency_code,
            formatted: firstPrice.amount.toLocaleString(undefined, {
              style: "currency",
              currency: firstPrice.currency_code,
            }),
          }
        : undefined

      return {
        id: product.id,
        title: product.title,
        handle: product.handle,
        thumbnail: product.thumbnail || product.images?.[0]?.url || null,
        price,
      }
    }),
    categories: [],
    collections: [],
    suggestions: [],
  }
}
