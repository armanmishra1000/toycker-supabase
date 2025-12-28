/**
 * API Route: GET /api/admin/products/export
 * Exports all products as CSV file
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateProductCsv } from "@/lib/csv/csv-parser"

export async function GET(request: NextRequest) {
    try {
        // Check admin auth
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Check if user is admin
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

        // Fetch all products with their variants
        const { data: products, error } = await supabase
            .from("products")
            .select(`
        id,
        handle,
        name,
        description,
        status,
        image_url,
        thumbnail,
        images,
        price,
        stock_count,
        currency_code,
        variants:product_variants(
          id,
          title,
          sku,
          price,
          inventory_quantity
        )
      `)
            .order("created_at", { ascending: false })

        if (error) {
            console.error("Error fetching products for export:", error)
            return NextResponse.json({
                error: "Failed to fetch products",
                details: error.message
            }, { status: 500 })
        }

        if (!products || products.length === 0) {
            return NextResponse.json({ error: "No products to export" }, { status: 404 })
        }

        // Transform products to the expected format
        const productsForExport = products.map(p => ({
            id: p.id,
            handle: p.handle,
            name: p.name,
            description: p.description,
            status: p.status || "draft",
            image_url: p.image_url,
            thumbnail: p.thumbnail,
            images: Array.isArray(p.images) ? p.images as string[] : null,
            price: p.price,
            stock_count: p.stock_count,
            currency_code: p.currency_code,
            variants: p.variants || [],
        }))

        // Generate CSV
        const csvContent = generateProductCsv(productsForExport)

        // Create filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
        const filename = `toycker-products-export-${timestamp}.csv`

        // Return as downloadable CSV file
        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        })

    } catch (error) {
        console.error("Export error:", error)
        return NextResponse.json({
            error: "Export failed",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 })
    }
}
