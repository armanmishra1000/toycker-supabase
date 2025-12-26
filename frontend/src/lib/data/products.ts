"use server"

import { sdk } from "@lib/config"
import { sortProducts } from "@lib/util/sort-products"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import {
  AvailabilityFilter,
  PriceRangeFilter,
  SortOptions,
} from "@modules/store/components/refinement-list/types"
import { normalizeAgeFilterForComparison } from "@modules/store/utils/age-filter"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { getRegion, retrieveRegion } from "./regions"

type SdkFetchOptions = Parameters<typeof sdk.client.fetch>[1]
type ProductCacheMode = "force-cache" | "no-store"

const PRODUCT_CACHE_MODE: ProductCacheMode = (() => {
  const override = process.env.NEXT_PUBLIC_PRODUCTS_CACHE_MODE

  if (override === "force-cache" || override === "no-store") {
    return override
  }

  return "force-cache"
})()

const MULTI_COLLECTIONS_REVALIDATE_SECONDS = (() => {
  const raw = process.env.NEXT_PUBLIC_MULTI_COLLECTIONS_REVALIDATE

  if (!raw) {
    return 0
  }

  const normalized = raw.trim().toLowerCase()
  if (["0", "disable", "disabled", "off", "false"].includes(normalized)) {
    return 0
  }

  const parsed = Number(raw)
  if (Number.isFinite(parsed) && parsed >= 0) {
    return parsed
  }

  return 0
})()

const MULTI_COLLECTIONS_ENABLED = (() => {
  const raw = process.env.NEXT_PUBLIC_MULTI_COLLECTIONS_ENABLED

  if (!raw) {
    return false
  }

  const normalized = raw.trim().toLowerCase()

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true
  }

  return false
})()

const COLLECTION_PRODUCT_IDS_REVALIDATE_SECONDS = (() => {
  const raw = process.env.NEXT_PUBLIC_COLLECTION_PRODUCT_IDS_REVALIDATE

  if (!raw) {
    return 300
  }

  const normalized = raw.trim().toLowerCase()
  if (["0", "off", "false", "disable", "disabled"].includes(normalized)) {
    return 0
  }

  const parsed = Number(raw)
  if (Number.isFinite(parsed) && parsed >= 0) {
    return parsed
  }

  return 300
})()

const DEFAULT_PRODUCT_FIELDS =
  "*variants.calculated_price,+variants.prices,+variants.metadata,+variants.inventory_quantity,*variants.images,+metadata,+tags,+short_description.*"

const ensureVariantMetadataSelection = (fields?: string) => {
  const normalized = (fields ?? DEFAULT_PRODUCT_FIELDS).replace(/,+$/g, "")
  const parts = normalized.split(",").map((part) => part.trim()).filter(Boolean)

  const ensurePart = (value: string) => {
    if (!parts.includes(value)) {
      parts.push(value)
    }
  }

  ensurePart("+variants.metadata")
  ensurePart("+variants.prices")
  ensurePart("*variants.calculated_price")
  ensurePart("+short_description.*")
  ensurePart("*options")
  ensurePart("*variants.options")

  return parts.join(",")
}

const normalizeStringArray = (value?: string | string[] | null): string[] => {
  if (!value) {
    return []
  }

  return (Array.isArray(value) ? value : [value]).map((entry) => entry ?? "").filter(Boolean)
}

const fetchCollectionProductIds = async (
  collectionIds: string[],
  headers: Record<string, string>
) => {
  if (!collectionIds.length) {
    return [] as string[]
  }

  const identifierSet = new Set<string>()

  await Promise.all(
    collectionIds.map(async (collectionId) => {
      try {
        const cacheOptions = await getCacheOptions(`collection-product-ids-${collectionId}`)
        const cacheMode = COLLECTION_PRODUCT_IDS_REVALIDATE_SECONDS === 0 ? "no-store" : "force-cache"
        const response = await sdk.client.fetch<{ product_ids?: string[] }>(
          `/store/collections/${collectionId}/product-ids`,
          {
            method: "GET",
            headers,
            cache: cacheMode,
            ...(cacheMode === "force-cache"
              ? {
                  next: {
                    revalidate: COLLECTION_PRODUCT_IDS_REVALIDATE_SECONDS,
                    ...(cacheOptions as { tags?: string[] }),
                  },
                }
              : {}),
          }
        )

        response.product_ids?.forEach((productId) => {
          if (productId) {
            identifierSet.add(productId)
          }
        })
      } catch (error) {
        console.warn(`Unable to load products for collection ${collectionId}`, error)
      }
    })
  )

  return Array.from(identifierSet)
}

const prepareCollectionAwareQuery = async (
  query: (HttpTypes.FindParams & HttpTypes.StoreProductListParams) | undefined,
  headers: Record<string, string>,
  skipExpansion?: boolean
) => {
  if (!query || skipExpansion) {
    return { query }
  }

  const collectionIds = normalizeStringArray(query.collection_id as string | string[] | undefined)

  if (!collectionIds.length) {
    return { query }
  }

  const productIds = await fetchCollectionProductIds(collectionIds, headers)

  if (!productIds.length) {
    return { query: null }
  }

  const nextQuery: HttpTypes.FindParams & HttpTypes.StoreProductListParams = {
    ...query,
  }

  delete nextQuery.collection_id

  const existingIds = normalizeStringArray(nextQuery.id as string | string[] | undefined)

  if (existingIds.length) {
    const combined = new Set([...existingIds, ...productIds])
    nextQuery.id = Array.from(combined)
  } else {
    nextQuery.id = productIds
  }

  return { query: nextQuery }
}

const shouldHydrateAdditionalCollections = () =>
  MULTI_COLLECTIONS_ENABLED && MULTI_COLLECTIONS_REVALIDATE_SECONDS !== 0

const hydrateProductsWithCollections = async (
  products: HttpTypes.StoreProduct[],
  headers: Record<string, string>
) => {
  const productIds = products.map((product) => product.id).filter(Boolean)

  if (!productIds.length || !shouldHydrateAdditionalCollections()) {
    return
  }

  try {
    const fetchOptions: SdkFetchOptions = {
      method: "GET",
      query: {
        product_id: productIds,
      },
      headers,
      cache:
        MULTI_COLLECTIONS_REVALIDATE_SECONDS > 0 ? "force-cache" : ("no-store" as const),
    }

    if (MULTI_COLLECTIONS_REVALIDATE_SECONDS > 0) {
      const cacheTags = await getCacheOptions("product-multi-collections")
      fetchOptions.next = {
        revalidate: MULTI_COLLECTIONS_REVALIDATE_SECONDS,
        ...(cacheTags as { tags?: string[] }),
      }
    }

    const payload = await sdk.client.fetch<{
      items: { product_id: string; collections: HttpTypes.StoreCollection[] }[]
    }>("/store/product-multi-collections", fetchOptions)

    const collectionMap = new Map(
      (payload.items ?? []).map((item) => [item.product_id, item.collections ?? []])
    )

    products.forEach((product) => {
      const assigned = collectionMap.get(product.id)
      if (assigned?.length) {
        ;(product as HttpTypes.StoreProduct & {
          additional_collections?: HttpTypes.StoreCollection[]
        }).additional_collections = assigned
      }
    })
  } catch (error) {
    console.warn("Unable to hydrate product collections", error)
  }
}

export const listProducts = async (
  {
    pageParam = 1,
    queryParams,
    countryCode,
    regionId,
  }: {
    pageParam?: number
    queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
    countryCode?: string
    regionId?: string
  },
  options?: { headers?: Record<string, string>; skipCollectionExpansion?: boolean }
): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
}> => {
  if (!countryCode && !regionId) {
    throw new Error("Country code or region ID is required")
  }

  const limit = queryParams?.limit || 12
  const _pageParam = Math.max(pageParam, 1)
  const offset = _pageParam === 1 ? 0 : (_pageParam - 1) * limit

  let region: HttpTypes.StoreRegion | undefined | null

  if (regionId) {
    try {
      region = await retrieveRegion(regionId)
    } catch (error) {
      console.warn(
        `Unable to retrieve region with id ${regionId}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      )
      region = null
    }
  }

  if (!region && countryCode) {
    region =
      (await getRegion(countryCode)) || (await getRegion(countryCode, { forceRefresh: true }))
  }

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }

  const headers = options?.headers ?? {
    ...(await getAuthHeaders()),
  }

  const next =
    PRODUCT_CACHE_MODE === "force-cache"
      ? {
          ...(await getCacheOptions("products")),
        }
      : undefined

  const { fields: requestedFields, ...restQuery } = queryParams ?? {}

  const preparedQueryResult = await prepareCollectionAwareQuery(
    restQuery,
    headers,
    options?.skipCollectionExpansion
  )

  if (!preparedQueryResult.query) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
      queryParams,
    }
  }

  const normalizedQuery = preparedQueryResult.query

  const requestOptions: SdkFetchOptions = {
    method: "GET",
    query: {
      limit,
      offset,
      region_id: region?.id,
      fields: ensureVariantMetadataSelection(requestedFields),
      ...normalizedQuery,
    },
    headers,
    cache: PRODUCT_CACHE_MODE,
  }

  if (next) {
    requestOptions.next = next
  }

  return sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[]; count: number }>(
      `/store/products`,
      requestOptions
    )
    .then(async ({ products, count }) => {
      await hydrateProductsWithCollections(products, headers)
      const nextPage = count > offset + limit ? pageParam + 1 : null

      return {
        response: {
          products,
          count,
        },
        nextPage: nextPage,
        queryParams,
      }
    })
}

const ORDER_MAP: Record<SortOptions, string | undefined> = {
  featured: "-created_at",
  best_selling: undefined,
  alpha_asc: "title",
  alpha_desc: "-title",
  price_asc: undefined,
  price_desc: undefined,
  date_old_new: "created_at",
  date_new_old: "-created_at",
}

const AGE_METADATA_KEY = "age_band"
const CLIENT_SCAN_LIMIT = 600
const CLIENT_SCAN_MAX_PAGES = 50

const isProductInStock = (product: HttpTypes.StoreProduct) => {
  return product.variants?.some((variant) => {
    if (variant?.manage_inventory === false) {
      return true
    }

    const quantity = variant?.inventory_quantity ?? 0
    return quantity > 0
  })
}

const matchesPriceFilter = (product: HttpTypes.StoreProduct, priceFilter?: PriceRangeFilter) => {
  if (!priceFilter || (priceFilter.min === undefined && priceFilter.max === undefined)) {
    return true
  }

  const cheapestPrice = getProductPrice({ product }).cheapestPrice

  if (!cheapestPrice) {
    return false
  }
  const amount = cheapestPrice.calculated_price_number

  const min =
    typeof priceFilter.min === "number" ? Math.max(priceFilter.min, 0) : undefined
  const max =
    typeof priceFilter.max === "number" ? Math.max(priceFilter.max, 0) : undefined

  if (min !== undefined && amount < min) {
    return false
  }

  if (max !== undefined && amount > max) {
    return false
  }

  return true
}

const matchesAgeFilter = (product: HttpTypes.StoreProduct, ageFilter?: string) => {
  const normalizedFilter = normalizeAgeFilterForComparison(ageFilter)

  if (!normalizedFilter) {
    return true
  }

  const metadataValue = typeof product.metadata?.[AGE_METADATA_KEY] === "string"
    ? product.metadata[AGE_METADATA_KEY]
    : undefined

  const normalizedMetadata = normalizeAgeFilterForComparison(metadataValue)

  if (!normalizedMetadata) {
    return false
  }

  return normalizedMetadata === normalizedFilter
}

const applyClientSideFilters = (
  product: HttpTypes.StoreProduct,
  filters: {
    availability?: AvailabilityFilter
    price?: PriceRangeFilter
    age?: string
  }
) => {
  const inStock = isProductInStock(product)

  if (filters.availability === "in_stock" && !inStock) {
    return false
  }

  if (filters.availability === "out_of_stock" && inStock) {
    return false
  }

  if (!matchesPriceFilter(product, filters.price)) {
    return false
  }

  if (!matchesAgeFilter(product, filters.age)) {
    return false
  }

  return true
}

type ListPaginatedProductsArgs = {
  page?: number
  limit?: number
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
  sortBy?: SortOptions
  countryCode: string
  availability?: AvailabilityFilter
  priceFilter?: PriceRangeFilter
  ageFilter?: string
}

export const listPaginatedProducts = async ({
  page = 1,
  limit = 12,
  queryParams,
  sortBy = "featured",
  countryCode,
  availability,
  priceFilter,
  ageFilter,
}: ListPaginatedProductsArgs): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  pagination: { page: number; limit: number }
}> => {
  const normalizedPage = Math.max(page, 1)
  const requiresClientSideSorting = sortBy === "price_asc" || sortBy === "price_desc"
  const requiresClientSideFiltering = Boolean(availability || priceFilter || ageFilter)
  const needsFullScan = requiresClientSideFiltering || requiresClientSideSorting
  const order = ORDER_MAP[sortBy]
  const baseQuery: HttpTypes.FindParams & HttpTypes.StoreProductListParams = {
    ...(queryParams ?? {}),
    ...(order ? { order } : {}),
  }

  const authHeaders = await getAuthHeaders()
  const collectionFilterValues = normalizeStringArray(
    baseQuery.collection_id as string | string[] | undefined
  )
  const hasCollectionFilter = collectionFilterValues.length > 0

  const preparedQueryResult = await prepareCollectionAwareQuery(
    baseQuery,
    authHeaders,
    !hasCollectionFilter
  )

  if (!preparedQueryResult.query) {
    return {
      response: { products: [], count: 0 },
      pagination: {
        page: normalizedPage,
        limit,
      },
    }
  }

  const normalizedQuery = preparedQueryResult.query
  const sharedListOptions = {
    headers: authHeaders,
    skipCollectionExpansion: !hasCollectionFilter,
  }

  if (!needsFullScan) {
    const {
      response: { products, count },
    } = await listProducts(
      {
        pageParam: normalizedPage,
        queryParams: {
          ...normalizedQuery,
          limit,
        },
        countryCode,
      },
      sharedListOptions
    )

    return {
      response: {
        products,
        count,
      },
      pagination: {
        page: normalizedPage,
        limit,
      },
    }
  }

  const aggregated: HttpTypes.StoreProduct[] = []
  let cursor = 1
  let iterations = 0
  const chunkSize = Math.max(limit, 24)

  while (iterations < CLIENT_SCAN_MAX_PAGES && aggregated.length < CLIENT_SCAN_LIMIT) {
    iterations += 1
    const { response, nextPage } = await listProducts(
      {
        pageParam: cursor,
        queryParams: {
          ...normalizedQuery,
          limit: chunkSize,
        },
        countryCode,
      },
      sharedListOptions
    )

    aggregated.push(...response.products)

    if (!nextPage) {
      break
    }

    cursor = nextPage
  }

  const filteredProducts = aggregated.filter((product) =>
    applyClientSideFilters(product, {
      availability,
      price: priceFilter,
      age: ageFilter,
    })
  )

  const sortedProducts = requiresClientSideSorting
    ? sortProducts(filteredProducts, sortBy)
    : filteredProducts

  const offset = (normalizedPage - 1) * limit
  const paginatedProducts = sortedProducts.slice(offset, offset + limit)

  return {
    response: {
      products: paginatedProducts,
      count: sortedProducts.length,
    },
    pagination: {
      page: normalizedPage,
      limit,
    },
  }
}

export const getStoreStats = async ({
  countryCode,
  queryParams,
}: {
  countryCode: string
  queryParams?: HttpTypes.FindParams & HttpTypes.StoreProductListParams
}) => {
  const {
    response: { count },
  } = await listProducts({
    pageParam: 1,
    queryParams: {
      limit: 1,
      ...queryParams,
    },
    countryCode,
  })

  return { count }
}
