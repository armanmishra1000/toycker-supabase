import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { CsvProductRow } from "@/lib/types/import"
import Papa from "papaparse"

export async function GET(_request: NextRequest) {
    try {
        const supabase = await createClient()

        // Check Admin Auth
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
        if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

        // 1. Fetch ALL products with relations
        const { data: products, error } = await supabase
            .from("products")
            .select(`
                *,
                variants:product_variants(*),
                collections:product_collections(collection:collections(handle)),
                categories:product_categories(category:categories(handle))
            `)
            .neq("id", "00000000-0000-0000-0000-000000000000") // Exclude potential dummy

        if (error) throw error

        // 2. Define standard columns for consistency
        const COLUMNS = [
            "Handle", "Title", "Description", "Short Description", "Subtitle", "Status",
            "Product Type", "Thumbnail URL", "Image URLs", "Video URL", "Category Handles", "Collection Handles",
            "Currency", "SKU", "Price", "Compare At Price", "Stock", "Barcode",
            "Option 1 Name", "Option 1 Value", "Option 2 Name", "Option 2 Value", "Option 3 Name", "Option 3 Value"
        ]

        // 3. Transform to CSV Rows
        const csvRows: any[] = []

        for (const product of products || []) {
            const baseRow: Partial<CsvProductRow> = {
                Handle: product.handle,
                Title: product.name,
                Description: product.description || "",
                "Short Description": product.short_description || "",
                Subtitle: product.subtitle || "",
                Status: product.status as "active" | "draft" | "archived",
                "Product Type": (product.variants && product.variants.length > 0) ? "variable" : "single",
                "Thumbnail URL": product.thumbnail || product.image_url || "",
                "Image URLs": (product.images || []).join(";"),
                "Video URL": product.video_url || "",
                "Category Handles": product.categories?.map((c: any) => c.category?.handle).filter(Boolean).join(";") || "",
                "Collection Handles": product.collections?.map((c: any) => c.collection?.handle).filter(Boolean).join(";") || "",
                Currency: product.currency_code || "INR"
            }

            const variants = product.variants || []

            if (variants.length === 0) {
                // If no variants (which shouldn't happen for valid products in our schema usually, but handled gracefully)
                // We export just the product row with base price/stock
                csvRows.push({
                    ...baseRow,
                    SKU: "",
                    Price: product.price,
                    "Compare At Price": product.metadata?.compare_at_price || "",
                    Stock: product.stock_count || 0,
                    Barcode: "",
                } as CsvProductRow)
            } else {
                // One row per variant
                // For the first variant, we can include the full product metadata (actually, CSV convention often duplicates it, stripping it is harder for import logic)
                // We will duplicate product data for every row to make it robust and easy to read/filter in Excel

                for (const variant of variants) {
                    const variantRow: CsvProductRow = {
                        ...baseRow, // Spread base row
                        SKU: variant.sku || "",
                        Price: variant.price,
                        "Compare At Price": variant.compare_at_price || "",
                        Stock: variant.inventory_quantity || 0,
                        Barcode: variant.barcode || "",
                    } as CsvProductRow

                    // Map options to columns
                    // 1. Try JSONB field first (from our new import)
                    // 2. Fallback to parsing title (for existing/Medusa data)
                    const rawOptions = (variant.options as any) || []
                    if (Array.isArray(rawOptions) && rawOptions.length > 0) {
                        rawOptions.forEach((opt: any, index: number) => {
                            if (index < 3) {
                                const i = index + 1
                                // @ts-ignore
                                variantRow[`Option ${i} Name`] = opt.name || opt.title || `Option ${i}`
                                // @ts-ignore
                                variantRow[`Option ${i} Value`] = opt.value || ""
                            }
                        })
                    } else if (variant.title && variant.title !== product.name && variant.title.toLowerCase() !== "default") {
                        // For variable products, the title usually contains the options
                        const parts = variant.title.split(" / ").map((s: string) => s.trim())
                        parts.forEach((val: string, index: number) => {
                            if (index < 3) {
                                const i = index + 1
                                // @ts-ignore
                                variantRow[`Option ${i} Name`] = `Option ${i}`
                                // @ts-ignore
                                variantRow[`Option ${i} Value`] = val
                            }
                        })
                    }

                    csvRows.push(variantRow)
                }
            }
        }

        // 4. Generate CSV with fixed columns
        const csv = Papa.unparse({
            fields: COLUMNS,
            data: csvRows
        })

        // 4. Return as file
        return new NextResponse(csv, {
            status: 200,
            headers: {
                "Content-Type": "text/csv",
                "Content-Disposition": `attachment; filename="toycker-products-${new Date().toISOString().split('T')[0]}.csv"`,
            },
        })

    } catch (error) {
        console.error("Export error:", error)
        return NextResponse.json({ error: "Export failed" }, { status: 500 })
    }
}
