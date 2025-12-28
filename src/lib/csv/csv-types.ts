/**
 * TypeScript types for Medusa CSV product export/import
 */

/**
 * Medusa CSV row structure based on the export format
 * Each row represents a product variant (products with multiple variants have multiple rows)
 */
export interface MedusaCsvRow {
    "Product Id": string
    "Product Handle": string
    "Product Title": string
    "Product Status": string
    "Product Thumbnail": string
    "Product Sales Channel 1"?: string
    "Variant Id": string
    // Extended fields for more complete exports
    "Product Description"?: string
    "Product Subtitle"?: string
    "Variant SKU"?: string
    "Variant Title"?: string
    "Variant Barcode"?: string
    "Variant Inventory Quantity"?: string
    "Variant Manage Inventory"?: string
    "Variant Allow Backorder"?: string
    "Price INR"?: string
    "Price USD"?: string
    // Multiple image columns - Medusa exports as Product Image 1, Product Image 2, etc.
    "Product Image 1"?: string
    "Product Image 2"?: string
    "Product Image 3"?: string
    "Product Image 4"?: string
    "Product Image 5"?: string
    "Product Image 6"?: string
    "Product Image 7"?: string
    "Product Image 8"?: string
    "Product Image 9"?: string
    "Product Image 10"?: string
    // Collection and category
    "Product Collection"?: string
    "Product Type"?: string
    "Product Tags"?: string
}

/**
 * Parsed product data ready for Supabase insertion
 */
export interface ParsedProduct {
    id?: string
    handle: string
    name: string
    description: string | null
    status: "active" | "draft" | "archived"
    thumbnail: string | null
    image_url: string | null
    images: string[]
    price: number
    stock_count: number
    currency_code: string
    collection_id?: string | null
    category_id?: string | null
    metadata: Record<string, unknown>
}

/**
 * Parsed variant data ready for Supabase insertion
 */
export interface ParsedVariant {
    id?: string
    product_id: string
    title: string
    sku: string | null
    barcode: string | null
    price: number
    inventory_quantity: number
    manage_inventory: boolean
    allow_backorder: boolean
    options: Record<string, unknown>[]
    metadata: Record<string, unknown>
}

/**
 * Result of CSV import operation
 */
export interface ImportResult {
    success: boolean
    productsImported: number
    variantsImported: number
    errors: string[]
}

/**
 * Product with variants for export
 */
export interface ProductForExport {
    id: string
    handle: string
    name: string
    description: string | null
    status: string
    image_url: string | null
    thumbnail: string | null
    images: string[] | null
    price: number
    stock_count: number
    currency_code: string
    variants?: {
        id: string
        title: string
        sku: string | null
        price: number
        inventory_quantity: number
    }[]
}
