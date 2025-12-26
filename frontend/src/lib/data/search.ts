"use server"

import { HttpTypes } from "@medusajs/types"

import { listProducts } from "@lib/data/products"
import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { getProductPrice } from "@lib/util/get-product-price"

export type SearchProductSummary = {
  id: string
  title: string
  handle: string
  thumbnail?: string | null
  price?: {
    amount: number
    currencyCode: string
    formatted: string
  }
}

export type SearchCategorySummary = {
  id: string
  name: string
  handle: string
}

export type SearchCollectionSummary = {
  id: string
  title: string
  handle: string
}

export type SearchResultsPayload = {
  products: SearchProductSummary[]
  categories: SearchCategorySummary[]
  collections: SearchCollectionSummary[]
  suggestions: string[]
}

type SearchEntitiesArgs = {
  query: string
  countryCode: string
  productLimit?: number
  taxonomyLimit?: number
}

const SEARCH_PRODUCT_FIELDS = "id,title,handle,thumbnail,+variants.prices"

const normalizeProduct = (product: HttpTypes.StoreProduct): SearchProductSummary => {
  const priceData = getProductPrice({ product }).cheapestPrice

  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    thumbnail: product.thumbnail || product.images?.[0]?.url || null,
    price: priceData
      ? {
          amount: priceData.calculated_price_number,
          currencyCode: priceData.currency_code,
          formatted: priceData.calculated_price,
        }
      : undefined,
  }
}

const normalizeCategory = (
  category: HttpTypes.StoreProductCategory
): SearchCategorySummary => ({
  id: category.id,
  name: category.name,
  handle: category.handle ?? category.id,
})

const normalizeCollection = (
  collection: HttpTypes.StoreCollection
): SearchCollectionSummary => ({
  id: collection.id,
  title: collection.title,
  handle: collection.handle ?? collection.id,
})

export const searchEntities = async ({
  query,
  countryCode,
  productLimit = 6,
  taxonomyLimit = 5,
}: SearchEntitiesArgs): Promise<SearchResultsPayload> => {
  const normalizedQuery = query.trim()

  if (!normalizedQuery) {
    return { products: [], categories: [], collections: [], suggestions: [] }
  }

  if (!countryCode) {
    throw new Error("countryCode is required for search")
  }

  const [productResponse, categories, collectionsResponse] = await Promise.all([
    listProducts({
      pageParam: 1,
      queryParams: {
        limit: productLimit,
        q: normalizedQuery,
        fields: SEARCH_PRODUCT_FIELDS,
      },
      countryCode,
    }, { skipCollectionExpansion: true }),
    listCategories({
      q: normalizedQuery,
      limit: taxonomyLimit,
    }),
    listCollections({
      q: normalizedQuery,
      limit: String(taxonomyLimit ?? 5),
    }),
  ])

  const products = productResponse.response.products.map(normalizeProduct)
  const trimmedCategories = categories.slice(0, taxonomyLimit).map(normalizeCategory)
  const trimmedCollections = collectionsResponse.collections
    .slice(0, taxonomyLimit)
    .map(normalizeCollection)

  const suggestionPool = [
    normalizedQuery,
    ...products.map((p) => p.title),
    ...trimmedCategories.map((c) => c.name),
    ...trimmedCollections.map((c) => c.title),
  ]

  const suggestions = suggestionPool
    .filter((value, index, self) => value && self.indexOf(value) === index)
    .slice(0, 6)

  return {
    products,
    categories: trimmedCategories,
    collections: trimmedCollections,
    suggestions,
  }
}
