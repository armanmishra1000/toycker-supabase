import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { CsvProductRow, ImportStats } from "@/lib/types/import"
import Papa from "papaparse"
import { revalidatePath } from "next/cache"

// Set max duration to 5 mins only for Vercel/similar (Next.js config)
export const maxDuration = 300

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // 1. Auth Check
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
        if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

        // 2. Parse File
        const formData = await request.formData()
        const file = formData.get("file") as File

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        const csvText = await file.text()
        const parseResult = Papa.parse<CsvProductRow>(csvText, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim() // Trim header whitespace
        })

        if (parseResult.errors.length > 0) {
            return NextResponse.json({
                error: "Invalid CSV format",
                details: parseResult.errors[0].message
            }, { status: 400 })
        }

        const rows = parseResult.data
        if (rows.length === 0) {
            return NextResponse.json({ error: "Empty CSV" }, { status: 400 })
        }

        // 3. Group by Handle
        const groups = new Map<string, CsvProductRow[]>()
        rows.forEach(row => {
            if (!row.Handle) return // Skip rows without handle
            const handle = row.Handle.trim()
            if (!groups.has(handle)) groups.set(handle, [])
            groups.get(handle)!.push(row)
        })

        const stats: ImportStats = {
            productsCreated: 0,
            productsUpdated: 0,
            variantsCreated: 0,
            variantsUpdated: 0,
            categoriesFoundOrCreated: 0,
            collectionsFoundOrCreated: 0,
            errors: []
        }

        // 4. Process Groups
        // Use Array.from to fix TS iteration error on Map
        for (const [handle, groupRows] of Array.from(groups)) {
            try {
                // Determine Product Data (use first row as master)
                const master = groupRows[0]

                // === A. Upsert Product ===

                // Check if exists
                const existingProductCheck = await supabase
                    .from("products")
                    .select("id")
                    .eq("handle", handle)
                    .single()

                const isUpdate = !!existingProductCheck.data
                let productId = existingProductCheck.data?.id

                // Prepare Data
                const productData = {
                    handle: handle,
                    name: master.Title || handle,
                    description: master.Description || "",
                    short_description: master["Short Description"] || "",
                    subtitle: master.Subtitle || "",
                    status: (master.Status?.toLowerCase() === "active" ? "active" :
                        master.Status?.toLowerCase() === "archived" ? "archived" : "draft"),
                    thumbnail: master["Thumbnail URL"] || null,
                    images: master["Image URLs"] ? master["Image URLs"].split(";").map((s: string) => s.trim()).filter(Boolean) : null,
                    video_url: master["Video URL"] || null,
                    currency_code: master.Currency?.toLowerCase() || "inr",
                    // We calculate base price/stock later from variants or use master row default
                    price: master.Price ? Number(master.Price) : 0,
                    stock_count: master.Stock ? Number(master.Stock) : 0,
                    image_url: master["Thumbnail URL"] || (master["Image URLs"] ? master["Image URLs"].split(";")[0] : null)
                }

                if (isUpdate && productId) {
                    await supabase.from("products").update(productData).eq("id", productId)
                    stats.productsUpdated++
                } else {
                    const { data: newProd, error: insertError } = await supabase
                        .from("products")
                        .insert(productData)
                        .select("id")
                        .single()

                    if (insertError) throw new Error(`Product insert failed: ${insertError.message}`)
                    productId = newProd.id
                    stats.productsCreated++
                }

                // === B. Relations (Categories/Collections) ===

                // Categories
                if (master["Category Handles"]) {
                    const catHandles = master["Category Handles"].split(";").map((s: string) => s.trim()).filter(Boolean)
                    for (const catHandle of catHandles) {
                        // Find category ID
                        const { data: cat } = await supabase.from("categories").select("id").eq("handle", catHandle).single()
                        if (cat) {
                            // Link
                            await supabase.from("product_categories").upsert(
                                { product_id: productId, category_id: cat.id },
                                { onConflict: "product_id, category_id" }
                            )
                            stats.categoriesFoundOrCreated++ // Just counting links here really
                        }
                    }
                }

                // Collections
                if (master["Collection Handles"]) {
                    const colHandles = master["Collection Handles"].split(";").map((s: string) => s.trim()).filter(Boolean)
                    for (const colHandle of colHandles) {
                        // Find collection ID
                        const { data: col } = await supabase.from("collections").select("id").eq("handle", colHandle).single()
                        if (col) {
                            // Link
                            await supabase.from("product_collections").upsert(
                                { product_id: productId, collection_id: col.id },
                                { onConflict: "product_id, collection_id" }
                            )
                            stats.collectionsFoundOrCreated++
                        }
                    }
                }

                // === C. Variants ===
                const isSingle = master["Product Type"]?.toLowerCase() === "single" || (!master["Product Type"] && groupRows.length === 1)

                if (isSingle) {
                    // For single products, we ensure NO variants exist in the DB
                    await supabase.from("product_variants").delete().eq("product_id", productId)

                    // Price and Stock are already set on the product record in step A
                } else {
                    // For variable products, process variants from rows
                    for (const row of groupRows) {
                        const sku = row.SKU || `${handle}-${Math.random().toString(36).substring(7)}` // Fallback SKU

                        const options = []
                        if (row["Option 1 Name"]) options.push({ name: row["Option 1 Name"], value: row["Option 1 Value"] })
                        if (row["Option 2 Name"]) options.push({ name: row["Option 2 Name"], value: row["Option 2 Value"] })
                        if (row["Option 3 Name"]) options.push({ name: row["Option 3 Name"], value: row["Option 3 Value"] })

                        const variantData = {
                            product_id: productId,
                            sku: sku,
                            title: options.length > 0 ? options.map(o => o.value).join(" / ") : (row.Title || "Default"),
                            price: Number(row.Price) || 0,
                            compare_at_price: row["Compare At Price"] ? Number(row["Compare At Price"]) : null,
                            inventory_quantity: Number(row.Stock) || 0,
                            barcode: row.Barcode || null,
                            options: options, // JSONB
                            manage_inventory: true
                        }

                        // Try to find variant by SKU or Title
                        let variantId = null
                        if (row.SKU) {
                            const existingVar = await supabase.from("product_variants").select("id").eq("sku", row.SKU).single()
                            variantId = existingVar.data?.id
                        }

                        if (!variantId) {
                            // Fallback: match by title within this product
                            const titleToMatch = options.length > 0 ? options.map(o => o.value).join(" / ") : (row.Title || "Default")
                            const { data: matchedVar } = await supabase
                                .from("product_variants")
                                .select("id")
                                .eq("product_id", productId)
                                .eq("title", titleToMatch)
                                .maybeSingle()
                            variantId = matchedVar?.id
                        }

                        if (variantId) {
                            await supabase.from("product_variants").update(variantData).eq("id", variantId)
                            stats.variantsUpdated++
                        } else {
                            await supabase.from("product_variants").insert(variantData)
                            stats.variantsCreated++
                        }
                    }

                    // Update total stock count and min price on product (for variable products)
                    const { data: allVars } = await supabase.from("product_variants")
                        .select("inventory_quantity, price")
                        .eq("product_id", productId)

                    if (allVars && allVars.length > 0) {
                        const totalStock = allVars.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0)
                        const minPrice = Math.min(...allVars.map(v => v.price))

                        await supabase.from("products").update({
                            stock_count: totalStock,
                            price: minPrice
                        }).eq("id", productId)
                    }
                }

            } catch (err: any) {
                console.error(`Error processing handle ${handle}:`, err)
                stats.errors.push(`Handle ${handle}: ${err.message}`)
            }
        }

        revalidatePath("/admin/products")
        revalidatePath("/")

        return NextResponse.json({
            success: true,
            ...stats
        })

    } catch (error: any) {
        console.error("Global import error:", error)
        return NextResponse.json({ error: "Server error", details: error.message }, { status: 500 })
    }
}
