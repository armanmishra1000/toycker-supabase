"use server"

import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { Product } from "@/lib/supabase/types"
import { SortOptions } from "@modules/store/components/refinement-list/types"

const CDN_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || `https://${process.env.NEXT_PUBLIC_R2_MEDIA_HOSTNAME || "cdn.toycker.in"}`

const normalizeProductImage = (product: Product): Product => {
  const fixUrl = (url: string | null) => {
    if (!url) return null
    if (url.startsWith("http") || url.startsWith("/")) return url
    return `${CDN_URL}/${url}`
  }

  const rawImages: string[] = []
  if (Array.isArray(product.images)) {
    product.images.forEach((img: string | { url: string }) => {
      if (typeof img === 'string') rawImages.push(img)
      else if (typeof img === 'object' && img?.url) rawImages.push(img.url)
    })
  }

  if (product.image_url && !rawImages.includes(product.image_url)) {
    rawImages.unshift(product.image_url)
  }

  const cleanedImages = rawImages
    .map((url) => fixUrl(url))
    .filter((url): url is string => !!url)

  const uniqueImages = Array.from(new Set(cleanedImages))
  const mainImage = fixUrl(product.image_url) || uniqueImages[0] || null

  return {
    ...product,
    title: product.name, // Ensure UI can use .title or .name
    image_url: mainImage,
    thumbnail: fixUrl(product.thumbnail) || mainImage,
    images: uniqueImages,
  }
}

const PRODUCT_SELECT = `
  *, 
  variants:product_variants(*), 
  options:product_options(*, values:product_option_values(*))
`

export const listProducts = cache(async function listProducts(options: {
  regionId?: string
  queryParams?: {
    limit?: number
    collection_id?: string[]
  }
} = {}): Promise<{ response: { products: Product[]; count: number } }> {
  const supabase = await createClient()

  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT, { count: "exact" })

  if (options.queryParams?.limit) {
    query = query.limit(options.queryParams.limit)
  }

  if (options.queryParams?.collection_id?.length) {
    // Filter by junction table
    const { data: productIds } = await supabase
      .from("product_collections")
      .select("product_id")
      .in("collection_id", options.queryParams.collection_id)

    if (productIds && productIds.length > 0) {
      query = query.in("id", productIds.map(p => p.product_id))
    } else {
      // Return empty if filtered collection has no products
      return { response: { products: [], count: 0 } }
    }
  }

  const { data, count, error } = await query.order("created_at", { ascending: false })

  if (error) {
    console.error("Error listing products:", error.message)
    return { response: { products: [], count: 0 } }
  }

  const products = (data || []).map((p) => normalizeProductImage(p as Product))
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

  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT, { count: "exact" })

  if (queryParams?.category_id) query = query.in("category_id", queryParams.category_id as string[])
  if (queryParams?.category_id) query = query.in("category_id", queryParams.category_id as string[])

  if (queryParams?.collection_id) {
    const collectionIds = queryParams.collection_id as string[]
    const { data: productIds } = await supabase
      .from("product_collections")
      .select("product_id")
      .in("collection_id", collectionIds)

    if (productIds && productIds.length > 0) {
      query = query.in("id", productIds.map(p => p.product_id))
    } else {
      return { response: { products: [], count: 0 }, pagination: { page, limit } }
    }
  }
  if (queryParams?.q) query = query.ilike("name", `%${queryParams.q}%`)

  if (priceFilter?.min !== undefined) query = query.gte("price", priceFilter.min)
  if (priceFilter?.max !== undefined) query = query.lte("price", priceFilter.max)

  const sortConfigs: Record<string, { col: string; asc: boolean }> = {
    price_asc: { col: "price", asc: true },
    price_desc: { col: "price", asc: false },
    alpha_asc: { col: "name", asc: true },
    alpha_desc: { col: "name", asc: false },
    featured: { col: "created_at", asc: false },
  }

  const sort = sortConfigs[sortBy] || sortConfigs.featured
  query = query.order(sort.col, { ascending: sort.asc })

  const { data, count, error } = await query.range(offset, offset + limit - 1)

  if (error) {
    return { response: { products: [], count: 0 }, pagination: { page, limit } }
  }

  return {
    response: {
      products: (data || []).map((p) => normalizeProductImage(p as Product)),
      count: count || 0,
    },
    pagination: { page, limit },
  }
})