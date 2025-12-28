/**
 * API Route: POST /api/admin/products/import
 * Handles CSV file upload and imports products into Supabase
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { parseCsvText, transformCsvToProducts } from "@/lib/csv/csv-parser"
import { revalidatePath } from "next/cache"

export async function POST(request: NextRequest) {
    try {
        // Check admin auth
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Check if user is admin (same logic as admin.ts)
        const ADMIN_EMAILS = ["admin@toycker.com", "tutanymo@fxzig.com"]
        const isHardcodedAdmin = ADMIN_EMAILS.includes(user.email || "")

        if (!isHardcodedAdmin) {
            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", user.id)
                .single()

            if (profile?.role !== "admin") {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 })
            }
        }

        // Parse the multipart form data
        const formData = await request.formData()
        const file = formData.get("file") as File | null

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 })
        }

        // Read file content
        const csvText = await file.text()

        if (!csvText.trim()) {
            return NextResponse.json({ error: "Empty file" }, { status: 400 })
        }

        // Parse CSV
        const rows = parseCsvText(csvText)

        if (rows.length === 0) {
            return NextResponse.json({ error: "No valid rows found in CSV" }, { status: 400 })
        }

        // Transform to Supabase format
        const { products } = transformCsvToProducts(rows)

        // Clear cart_items first (references products)
        const { error: cartItemsError } = await supabase
            .from("cart_items")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000")

        if (cartItemsError) {
            console.error("Error clearing cart items:", cartItemsError)
            // Continue anyway - cart_items may not exist or be empty
        }

        // Clear product_variants (references products)
        const { error: variantsDeleteError } = await supabase
            .from("product_variants")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000")

        if (variantsDeleteError) {
            console.error("Error clearing variants:", variantsDeleteError)
            // Continue anyway
        }

        // Delete all existing products
        const { error: deleteError } = await supabase
            .from("products")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000")

        if (deleteError) {
            console.error("Error deleting existing products:", deleteError)
            return NextResponse.json({
                error: "Failed to clear existing products",
                details: deleteError.message
            }, { status: 500 })
        }

        // Insert new products
        const productsToInsert = products.map(p => ({
            handle: p.handle,
            name: p.name,
            description: p.description,
            status: p.status,
            thumbnail: p.thumbnail,
            image_url: p.image_url,
            images: p.images,
            price: p.price,
            stock_count: p.stock_count,
            currency_code: p.currency_code,
            metadata: p.metadata,
        }))

        const { data: insertedProducts, error: insertError } = await supabase
            .from("products")
            .insert(productsToInsert)
            .select("id, handle")

        if (insertError) {
            console.error("Error inserting products:", insertError)
            return NextResponse.json({
                error: "Failed to insert products",
                details: insertError.message
            }, { status: 500 })
        }

        // Create a map of handle -> product ID
        const productIdMap = new Map<string, string>()
        for (const prod of insertedProducts || []) {
            productIdMap.set(prod.handle, prod.id)
        }

        // Insert one default variant for each product
        let variantsInserted = 0

        for (const product of products) {
            const productId = productIdMap.get(product.handle)
            if (!productId) continue

            // Create a default variant for each product
            const variantToInsert = {
                product_id: productId,
                title: "Default",
                sku: null,
                barcode: null,
                price: product.price,
                inventory_quantity: product.stock_count,
                manage_inventory: true,
                allow_backorder: false,
                options: [],
                metadata: {},
            }

            const { error: variantError } = await supabase
                .from("product_variants")
                .insert([variantToInsert])

            if (!variantError) {
                variantsInserted += 1
            } else {
                console.error("Error inserting variant for", product.handle, variantError)
            }
        }

        // Revalidate the admin products page
        revalidatePath("/admin/products")
        revalidatePath("/store")

        return NextResponse.json({
            success: true,
            productsImported: insertedProducts?.length || 0,
            variantsImported: variantsInserted,
            message: `Successfully imported ${insertedProducts?.length || 0} products`
        })

    } catch (error) {
        console.error("Import error:", error)
        return NextResponse.json({
            error: "Import failed",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 })
    }
}
