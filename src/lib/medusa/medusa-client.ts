/**
 * Medusa Admin API Client
 * Fetches products, collections, categories with all related data
 */

// Types for Medusa API responses
export interface MedusaImage {
    id: string
    url: string
    rank?: number
}

export interface MedusaPrice {
    id: string
    amount: number
    currency_code: string
    min_quantity?: number
    max_quantity?: number
}

export interface MedusaVariant {
    id: string
    title: string
    sku: string | null
    barcode: string | null
    inventory_quantity: number
    manage_inventory: boolean
    allow_backorder: boolean
    prices?: MedusaPrice[]
    options?: { value: string; option_id: string }[]
}

export interface MedusaProduct {
    id: string
    title: string
    handle: string
    description: string | null
    subtitle: string | null
    status: string
    thumbnail: string | null
    images?: MedusaImage[]
    variants?: MedusaVariant[]
    collection_id?: string | null
    categories?: { id: string; name: string; handle: string }[]
    metadata?: Record<string, unknown>
}

export interface MedusaCollection {
    id: string
    title: string
    handle: string
    metadata?: Record<string, unknown>
}

export interface MedusaCategory {
    id: string
    name: string
    handle: string
    description?: string | null
    parent_category_id?: string | null
    category_children?: MedusaCategory[]
}

interface MedusaApiConfig {
    baseUrl: string
    email: string
    password: string
}

/**
 * Create Medusa API client with authentication
 */
export async function createMedusaClient(config: MedusaApiConfig) {
    // Get JWT token by logging in
    const loginResponse = await fetch(`${config.baseUrl}/auth/user/emailpass`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: config.email, password: config.password }),
    })

    if (!loginResponse.ok) {
        const error = await loginResponse.text()
        throw new Error(`Failed to login to Medusa: ${error}`)
    }

    const loginData = await loginResponse.json()
    const token = loginData.token

    // Helper to make authenticated requests
    async function fetchApi<T>(endpoint: string): Promise<T> {
        const response = await fetch(`${config.baseUrl}${endpoint}`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        })

        if (!response.ok) {
            const error = await response.text()
            throw new Error(`Medusa API error: ${error}`)
        }

        return response.json()
    }

    return {
        /**
         * Fetch all collections
         */
        async fetchCollections(): Promise<MedusaCollection[]> {
            const data = await fetchApi<{ collections: MedusaCollection[] }>(
                "/admin/collections?limit=1000"
            )
            return data.collections || []
        },

        /**
         * Fetch all categories
         */
        async fetchCategories(): Promise<MedusaCategory[]> {
            const data = await fetchApi<{ product_categories: MedusaCategory[] }>(
                "/admin/product-categories?limit=1000&include_descendants_tree=true"
            )
            return data.product_categories || []
        },

        /**
         * Fetch all products with variants, images, and prices
         */
        async fetchProducts(): Promise<MedusaProduct[]> {
            // Fetch products with expanded fields
            const data = await fetchApi<{ products: MedusaProduct[] }>(
                "/admin/products?limit=500&expand=variants,variants.prices,images,categories,collection"
            )
            return data.products || []
        },
    }
}

/**
 * Get the best price for INR currency from variant prices
 * Medusa v2 stores prices as actual amounts (not cents like v1)
 */
export function getVariantPrice(variant: MedusaVariant): number {
    if (!variant.prices || variant.prices.length === 0) return 0

    // Prefer INR price
    const inrPrice = variant.prices.find(p => p.currency_code?.toLowerCase() === "inr")
    if (inrPrice) return inrPrice.amount // v2 stores as actual amount

    // Fallback to first price
    return variant.prices[0].amount
}

/**
 * Extract all image URLs from a product
 */
export function getProductImages(product: MedusaProduct): string[] {
    const images: string[] = []

    // Add thumbnail first
    if (product.thumbnail) {
        images.push(product.thumbnail)
    }

    // Add other images
    if (product.images && product.images.length > 0) {
        for (const img of product.images) {
            if (img.url && !images.includes(img.url)) {
                images.push(img.url)
            }
        }
    }

    return images
}
