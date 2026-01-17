export interface CsvProductRow {
    // === Product Identification ===
    Handle: string // Required pivot. 
    "Product Type"?: "single" | "variable" // Optional. Defaults to single if no variants.

    // === Product Details (First row uses these) ===
    Title?: string
    Description?: string
    "Short Description"?: string
    Subtitle?: string
    Status?: "active" | "draft" | "archived"

    // === Product Media (First row) ===
    "Thumbnail URL"?: string
    "Image URLs"?: string // Semicolon separated list
    "Video URL"?: string

    // === Organization (First row) ===
    "Category Handles"?: string // Semicolon separated
    "Collection Handles"?: string // Semicolon separated

    // === Global Pricing/Settings ===
    Currency?: string // defaults to INR

    // === Variant Details (Each row defines a variant) ===
    // If Product Type is 'single', we still treat it as a default variant
    SKU?: string
    Price?: number | string
    "Compare At Price"?: number | string
    Stock?: number | string
    Barcode?: string

    // === Variant Options ===
    "Option 1 Name"?: string
    "Option 1 Value"?: string
    "Option 2 Name"?: string
    "Option 2 Value"?: string
    "Option 3 Name"?: string
    "Option 3 Value"?: string
}

export type ImportStats = {
    productsCreated: number
    productsUpdated: number
    variantsCreated: number
    variantsUpdated: number
    categoriesFoundOrCreated: number
    collectionsFoundOrCreated: number
    errors: string[]
}
