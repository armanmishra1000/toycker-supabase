"use server"

import { listProducts } from "@lib/data/products"
import { listCategories } from "@lib/data/categories"
import { listCollections } from "@lib/data/collections"
import { Product, Category, Collection } from "@/lib/supabase/types"

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

const normalizeProduct = (product: Product): SearchProductSummary => {
  return {
    id: product.id,
    title: product.name,
    handle: product.handle,
    thumbnail: product.image_url,
    price: {
      amount: product.price,
      currencyCode: product.currency_code,
      formatted: `₹${product.price}`,
    },
  }
}

const normalizeCategory = (
  category: Category
): SearchCategorySummary => ({
  id: category.id,
  name: category.name,
  handle: category.handle,
})

const normalizeCollection = (
  collection: Collection
): SearchCollectionSummary => ({
  id: collection.id,
  title: collection.title,
  handle: collection.handle,
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

  const [allProducts, categories, collectionsResponse] = await Promise.all([
    listProducts(),
    listCategories(),
    listCollections(),
  ])

  const products = allProducts
    .filter(p => p.name.toLowerCase().includes(normalizedQuery.toLowerCase()))
    .slice(0, productLimit)
    .map(normalizeProduct)
    
  const trimmedCategories = categories
    .filter(c => c.name.toLowerCase().includes(normalizedQuery.toLowerCase()))
    .slice(0, taxonomyLimit)
    .map(normalizeCategory)
    
  const trimmedCollections = collectionsResponse.collections
    .filter(c => c.title.toLowerCase().includes(normalizedQuery.toLowerCase()))
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
