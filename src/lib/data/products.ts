"use server"

import { createClient } from "@/lib/supabase/server"
import { Product } from "@/lib/supabase/types"
import { SortOptions } from "@modules/store/components/refinement-list/types"

const CDN_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || `https://${process.env.NEXT_PUBLIC_R2_MEDIA_HOSTNAME || "cdn.toycker.in"}`

const normalizeProductImage = (product: any): Product => {
  const fixUrl = (url: string | null) => {
    if (!url) return null
    if (url.startsWith("http") || url.startsWith("/")) return url
    return `${CDN_URL}/${url}`
  }

  // Collect all image sources
  const rawImages: string[] = []

  // 1. Check direct 'images' array (if array of strings)
  if (Array.isArray(product.images)) {
    product.images.forEach((img: any) => {
      if (typeof img === 'string') rawImages.push(img)
      else if (typeof img === 'object' && img?.url) rawImages.push(img.url)
    })
  }

  // 2. Check 'product_images' relation (standard many-to-many)
  if (Array.isArray(product.product_images)) {
    product.product_images.forEach((rel: any) => {
      if (rel.image?.url) rawImages.push(rel.image.url)
    })
  }

  // 3. Check 'image_url' (single column)
  if (product.image_url) {
    // Add to beginning if not present
    if (!rawImages.includes(product.image_url)) {
      rawImages.unshift(product.image_url)
    }
  }

  // Clean and prefix URLs
  const cleanedImages = rawImages
    .map((url) => fixUrl(url))
    .filter((url): url is string => !!url)

  // Ensure unique
  const uniqueImages = Array.from(new Set(cleanedImages))

  // Determine main thumbnail
  const mainImage = fixUrl(product.image_url) || uniqueImages[0] || null

  // Normalize base product
  const normalizedProduct = {
    ...product,
    image_url: mainImage,
    thumbnail: fixUrl(product.thumbnail) || mainImage,
    images: uniqueImages,
  }

  // Normalize variants
  if (normalizedProduct.variants && Array.isArray(normalizedProduct.variants)) {
    normalizedProduct.variants = normalizedProduct.variants.map((v: any) => ({
      ...v,
    }))
  }

  return normalizedProduct
}

// Fetch products with variants, options, AND images (via junction table)
const PRODUCT_SELECT = `
  *, 
  variants:product_variants(*), 
  options:product_options(*, values:product_option_values(*)),
  product_images(image(*))
`

export async function listProducts({
  regionId,
  queryParams
}: {
  regionId?: string
  queryParams?: Record<string, unknown>
} = {}): Promise<{ response: { products: Product[]; count: number } }> {
  const supabase = await createClient()
  
  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT, { count: "exact" })

  if (queryParams?.limit) {
    query = query.limit(Number(queryParams.limit))
  }

  if (queryParams?.collection_id) {
    const collectionIds = Array.isArray(queryParams.collection_id) ? queryParams.collection_id : [queryParams.collection_id]
    if (collectionIds.length > 0) {
        query = query.in("collection_id", collectionIds)
    }
  }
  
  const { data, count, error } = await query.order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching products:", error.message)
    return { response: { products: [], count: 0 } }
  }

  const products = (data as any[]).map(normalizeProductImage)

  return { response: { products, count: count || 0 } }
}

export async function retrieveProduct(id: string): Promise<Product | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .single()

  if (error) {
    console.error(`Error fetching product ${id}:`, error.message)
    return null
  }

  return normalizeProductImage(data)
}

export async function getProductByHandle(handle: string): Promise<Product | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("handle", handle)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
        console.error("Error fetching product by handle:", error.message)
    }
    return null
  }

  return normalizeProductImage(data)
}

export async function listPaginatedProducts({
  page = 1,
  limit = 12,
  sortBy = "featured",
  countryCode,
  queryParams,
  availability,
  priceFilter,
  ageFilter,
}: {
  page?: number
  limit?: number
  sortBy?: SortOptions
  countryCode?: string
  queryParams?: Record<string, unknown>
  availability?: "in_stock" | "out_of_stock"
  priceFilter?: { min?: number; max?: number }
  ageFilter?: string
}): Promise<{
  response: { products: Product[]; count: number }
  pagination: { page: number; limit: number }
}> {
  const supabase = await createClient()
  const offset = (page - 1) * limit

  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT, { count: "exact" })

  if (queryParams?.category_id) {
    query = query.in("category_id", Array.isArray(queryParams.category_id) ? queryParams.category_id : [queryParams.category_id])
  }
  
  if (queryParams?.collection_id) {
    query = query.in("collection_id", Array.isArray(queryParams.collection_id) ? queryParams.collection_id : [queryParams.collection_id])
  }

  if (queryParams?.id) {
    query = query.in("id", Array.isArray(queryParams.id) ? queryParams.id : [queryParams.id])
  }

  if (queryParams?.q) {
    query = query.ilike("name", `%${queryParams.q}%`)
  }

  if (priceFilter?.min !== undefined) {
    query = query.gte("price", priceFilter.min)
  }
  if (priceFilter?.max !== undefined) {
    query = query.lte("price", priceFilter.max)
  }

  if (sortBy === "price_asc") {
    query = query.order("price", { ascending: true })
  } else if (sortBy === "price_desc") {
    query = query.order("price", { ascending: false })
  } else if (sortBy === "alpha_asc") {
    query = query.order("name", { ascending: true })
  } else if (sortBy === "alpha_desc") {
    query = query.order("name", { ascending: false })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  const { data, count, error } = await query.range(offset, offset + limit - 1)

  if (error) {
    console.error("Error fetching paginated products:", error.message)
    return {
      response: { products: [], count: 0 },
      pagination: { page, limit },
    }
  }

  let products = (data as any[]).map(normalizeProductImage)

  if (availability === "in_stock") {
    products = products.filter(p => {
      const hasVariantStock = p.variants?.some((v: any) => (v.inventory_quantity > 0 || v.allow_backorder || !v.manage_inventory))
      return p.stock_count > 0 || hasVariantStock
    })
  } else if (availability === "out_of_stock") {
    products = products.filter(p => {
      const hasVariantStock = p.variants?.some((v: any) => (v.inventory_quantity > 0 || v.allow_backorder || !v.manage_inventory))
      return p.stock_count <= 0 && !hasVariantStock
    })
  }

  return {
    response: {
      products: products,
      count: count || 0,
    },
    pagination: {
      page,
      limit,
    },
  }
}