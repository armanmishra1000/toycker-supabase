"use server"

import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { Product } from "@/lib/supabase/types"
import { SortOptions } from "@modules/store/components/refinement-list/types"

import { normalizeProductImage } from "@lib/util/images"

const PRODUCT_SELECT = `
  *, 
  variants:product_variants(*), 
  options:product_options(*, values:product_option_values(*)),
  related_combinations:product_combinations!product_id(
    *,
    related_product:products!related_product_id(
      *,
      variants:product_variants(*), 
      options:product_options(*, values:product_option_values(*))
    )
  )
`

export const listProducts = cache(async function listProducts(options: {
  regionId?: string
  queryParams?: {
    limit?: number
    collection_id?: string[]
    category_id?: string[]
    exclude_id?: string
  }
} = {}): Promise<{ response: { products: Product[]; count: number } }> {
  const supabase = await createClient()

  let selectString = PRODUCT_SELECT
  const joins: string[] = []

  if (options.queryParams?.collection_id?.length) {
    joins.push(`product_collections!inner(collection_id)`)
  }
  if (options.queryParams?.category_id?.length) {
    joins.push(`product_categories!inner(category_id)`)
  }

  if (joins.length > 0) {
    selectString = `${PRODUCT_SELECT}, ${joins.join(', ')}`
  }

  let query = supabase
    .from("products")
    .select(selectString, { count: "exact" })

  if (options.queryParams?.collection_id?.length) {
    query = query.in("product_collections.collection_id", options.queryParams.collection_id)
  }

  if (options.queryParams?.category_id?.length) {
    query = query.in("product_categories.category_id", options.queryParams.category_id)
  }

  if (options.queryParams?.exclude_id) {
    query = query.neq("id", options.queryParams.exclude_id)
  }

  // Apply limit AFTER exclusions and filters
  if (options.queryParams?.limit) {
    query = query.limit(options.queryParams.limit)
  }

  const { data, count, error } = await query.order("created_at", { ascending: false })

  if (error) {
    console.error("Error listing products:", error.message)
    return { response: { products: [], count: 0 } }
  }

  const products = (data || []).map((p) => normalizeProductImage(p as unknown as Product))
  return { response: { products, count: count || 0 } }
})

export const retrieveProduct = cache(async function retrieveProduct(id: string): Promise<Product | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .maybeSingle()

  if (error || !data) return null
  return normalizeProductImage(data as Product)
})

export const getProductByHandle = cache(async function getProductByHandle(handle: string): Promise<Product | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("handle", handle)
    .maybeSingle()

  if (error || !data) return null
  return normalizeProductImage(data as Product)
})

export const listPaginatedProducts = cache(async function listPaginatedProducts({
  page = 1,
  limit = 12,
  sortBy = "featured",
  queryParams,
  priceFilter,
  availability,
  ageFilter,
}: {
  page?: number
  limit?: number
  sortBy?: SortOptions
  countryCode?: string
  queryParams?: Record<string, string[] | string | undefined>
  availability?: string
  priceFilter?: { min?: number; max?: number }
  ageFilter?: string
}) {
  const supabase = await createClient()
  const offset = (page - 1) * limit

  // Determine if we need joins for category or collection filtering
  const categoryIds = queryParams?.category_id
    ? (Array.isArray(queryParams.category_id) ? queryParams.category_id : [queryParams.category_id])
    : []
  const collectionIds = queryParams?.collection_id
    ? (Array.isArray(queryParams.collection_id) ? queryParams.collection_id : [queryParams.collection_id])
    : []

  const needsCategoryJoin = categoryIds.length > 0
  const needsCollectionJoin = collectionIds.length > 0
  const needsPriceFilter = priceFilter?.min !== undefined || priceFilter?.max !== undefined

  // Build query with appropriate SELECT based on join requirements
  // When price filter is applied, we need to join variants to get accurate min price
  let query = needsCategoryJoin
    ? supabase.from("products").select(`
        ${PRODUCT_SELECT},
        product_categories!inner(category_id)
      `, { count: "exact" })
    : needsCollectionJoin
      ? supabase.from("products").select(`
        ${PRODUCT_SELECT},
        product_collections!inner(collection_id)
      `, { count: "exact" })
      : supabase.from("products").select(PRODUCT_SELECT, { count: "exact" })

  // Chain filters WITHOUT recreating the query object
  if (needsCategoryJoin) {
    query = query.in("product_categories.category_id", categoryIds)
  }

  if (needsCollectionJoin) {
    query = query.in("product_collections.collection_id", collectionIds)
  }

  if (queryParams?.id) {
    const ids = Array.isArray(queryParams.id) ? queryParams.id : [queryParams.id]
    query = query.in("id", ids)
  }

  if (queryParams?.q) {
    query = query.ilike("name", `%${queryParams.q}%`)
  }

  // NOTE: Price filtering is done CLIENT-SIDE after fetching
  // because we need to filter by variant prices, not just product.price
  // See the client-side filter logic below

  // Apply availability filter
  if (availability) {
    if (availability === 'in_stock') {
      query = query.gt("stock_count", 0)
    } else if (availability === 'out_of_stock') {
      query = query.eq("stock_count", 0)
    }
  }

  // Apply sorting
  const sortConfigs: Record<string, { col: string; asc: boolean }> = {
    price_asc: { col: "price", asc: true },
    price_desc: { col: "price", asc: false },
    alpha_asc: { col: "name", asc: true },
    alpha_desc: { col: "name", asc: false },
    featured: { col: "created_at", asc: false },
  }

  const sort = sortConfigs[sortBy] || sortConfigs.featured
  query = query.order(sort.col, { ascending: sort.asc })

  // Apply pagination only if NOT doing client-side filtering
  // If we have a price filter, we must fetch everything to find matches and then paginate manually
  const needsClientSideFiltering = priceFilter?.min !== undefined || priceFilter?.max !== undefined

  const { data, count, error } = needsClientSideFiltering
    ? await query // Fetch everything if we need to filter client-side
    : await query.range(offset, offset + limit - 1)

  if (error) {
    return { response: { products: [], count: 0 }, pagination: { page, limit } }
  }

  let products = (data || []).map((p) => normalizeProductImage(p as Product))

  // Apply price filtering (only when price filter is active)
  if (needsClientSideFiltering) {
    products = products.filter((product) => {
      // Calculate the actual displayed price (same logic as getProductPrice)
      let displayPrice = product.price

      if (product.variants && product.variants.length > 0) {
        // Find cheapest variant price
        const cheapestVariant = [...product.variants].sort((a, b) => a.price - b.price)[0]
        displayPrice = cheapestVariant.price
      }

      // Exclude products with price 0 when price filter is active
      if (displayPrice === 0) {
        return false
      }

      // Apply min filter
      if (priceFilter!.min !== undefined && displayPrice < priceFilter!.min) {
        return false
      }

      // Apply max filter
      if (priceFilter!.max !== undefined && displayPrice > priceFilter!.max) {
        return false
      }

      return true
    })

    // Update total count after filtering
    const totalFilteredCount = products.length

    // Manual offset/limit for paginated response
    const paginatedProducts = products.slice(offset, offset + limit)

    return {
      response: {
        products: paginatedProducts,
        count: totalFilteredCount,
      },
      pagination: { page, limit },
    }
  }

  return {
    response: {
      products,
      count: count || 0,
    },
    pagination: { page, limit },
  }
})