/**
 * CSV Parser utility for Medusa product exports
 * Uses Papa Parse for robust CSV parsing
 */

import Papa from "papaparse"
import type {
    MedusaCsvRow,
    ParsedProduct,
    ParsedVariant,
} from "./csv-types"

/**
 * Parse CSV text into typed rows
 */
export function parseCsvText(csvText: string): MedusaCsvRow[] {
    const result = Papa.parse<MedusaCsvRow>(csvText, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) => header.trim(),
    })

    if (result.errors.length > 0) {
        console.warn("CSV parsing warnings:", result.errors)
    }

    return result.data
}

/**
 * Extract all images from a CSV row
 * Medusa exports images as Product Image 1, Product Image 2, etc.
 */
function extractImages(row: MedusaCsvRow): string[] {
    const images: string[] = []

    // Add thumbnail first if it exists
    if (row["Product Thumbnail"]) {
        images.push(row["Product Thumbnail"])
    }

    // Add numbered image columns
    for (let i = 1; i <= 10; i++) {
        const imageKey = `Product Image ${i}` as keyof MedusaCsvRow
        const imageUrl = row[imageKey]
        if (imageUrl && typeof imageUrl === "string" && imageUrl.trim()) {
            // Avoid duplicates with thumbnail
            if (!images.includes(imageUrl)) {
                images.push(imageUrl)
            }
        }
    }

    return images
}

/**
 * Map Medusa status to Supabase status
 */
function mapStatus(medusaStatus: string): "active" | "draft" | "archived" {
    const status = medusaStatus?.toLowerCase() || "draft"
    if (status === "published" || status === "active") return "active"
    if (status === "archived") return "archived"
    return "draft"
}

/**
 * Parse price string to number (in smallest currency unit for INR)
 */
function parsePrice(priceStr: string | undefined): number {
    if (!priceStr) return 0
    const cleaned = priceStr.replace(/[^0-9.]/g, "")
    const parsed = parseFloat(cleaned)
    return isNaN(parsed) ? 0 : parsed
}

/**
 * Group CSV rows by product handle and transform to Supabase format
 * Products with multiple variants have multiple rows in CSV
 */
export function transformCsvToProducts(rows: MedusaCsvRow[]): {
    products: ParsedProduct[]
    variants: ParsedVariant[]
} {
    const productMap = new Map<string, {
        product: ParsedProduct
        variants: ParsedVariant[]
        images: Set<string>
    }>()

    for (const row of rows) {
        const handle = row["Product Handle"]
        if (!handle) continue

        if (!productMap.has(handle)) {
            // First row for this product - create the product entry
            const images = extractImages(row)

            productMap.set(handle, {
                product: {
                    handle,
                    name: row["Product Title"] || handle,
                    description: row["Product Description"] || null,
                    status: mapStatus(row["Product Status"]),
                    thumbnail: row["Product Thumbnail"] || null,
                    image_url: images[0] || row["Product Thumbnail"] || null,
                    images,
                    price: parsePrice(row["Price INR"]),
                    stock_count: parseInt(row["Variant Inventory Quantity"] || "0") || 0,
                    currency_code: "inr",
                    metadata: {
                        medusa_id: row["Product Id"],
                    },
                },
                variants: [],
                images: new Set(images),
            })
        }

        const entry = productMap.get(handle)!

        // Add any new images from this row
        const rowImages = extractImages(row)
        for (const img of rowImages) {
            if (!entry.images.has(img)) {
                entry.images.add(img)
                entry.product.images.push(img)
            }
        }

        // Add variant for this row
        const variantPrice = parsePrice(row["Price INR"])
        const variantInventory = parseInt(row["Variant Inventory Quantity"] || "0") || 0

        entry.variants.push({
            product_id: "", // Will be set after product insertion
            title: row["Variant Title"] || "Default",
            sku: row["Variant SKU"] || null,
            barcode: row["Variant Barcode"] || null,
            price: variantPrice > 0 ? variantPrice : entry.product.price,
            inventory_quantity: variantInventory,
            manage_inventory: row["Variant Manage Inventory"]?.toLowerCase() !== "false",
            allow_backorder: row["Variant Allow Backorder"]?.toLowerCase() === "true",
            options: [],
            metadata: {
                medusa_variant_id: row["Variant Id"],
            },
        })

        // Update product stock count to sum of variants
        entry.product.stock_count += variantInventory

        // Use first variant's price if product price not set
        if (entry.product.price === 0 && variantPrice > 0) {
            entry.product.price = variantPrice
        }
    }

    // Flatten the map to arrays
    const products: ParsedProduct[] = []
    const variants: ParsedVariant[] = []

    const entries = Array.from(productMap.values())
    for (const entry of entries) {
        products.push(entry.product)
        variants.push(...entry.variants)
    }

    return { products, variants }
}

/**
 * Generate CSV text from products for export
 */
export function generateProductCsv(products: {
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
}[]): string {
    const rows: Record<string, string>[] = []

    for (const product of products) {
        const variants = product.variants || [{
            id: "",
            title: "Default",
            sku: null,
            price: product.price,
            inventory_quantity: product.stock_count
        }]

        for (const variant of variants) {
            const row: Record<string, string> = {
                "Product Id": product.id,
                "Product Handle": product.handle,
                "Product Title": product.name,
                "Product Status": product.status === "active" ? "published" : product.status,
                "Product Thumbnail": product.thumbnail || product.image_url || "",
                "Product Description": product.description || "",
                "Variant Id": variant.id || "",
                "Variant Title": variant.title,
                "Variant SKU": variant.sku || "",
                "Price INR": variant.price.toString(),
                "Variant Inventory Quantity": variant.inventory_quantity.toString(),
            }

            // Add image columns
            const images = product.images || []
            for (let i = 0; i < 10; i++) {
                row[`Product Image ${i + 1}`] = images[i] || ""
            }

            rows.push(row)
        }
    }

    return Papa.unparse(rows)
}
