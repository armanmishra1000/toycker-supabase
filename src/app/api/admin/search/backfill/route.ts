import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { generateImageEmbedding } from "@/lib/ml/embeddings"

interface Product {
    id: string
    name: string
    image_url: string | null
}

export async function GET(_request: Request) {
    return POST(_request)
}

export async function POST(_request: Request) {
    try {
        const supabase = await createAdminClient()

        // Get products without embeddings
        const { data: products, error: fetchError } = await supabase
            .from("products")
            .select("id, image_url, name")
            .is("image_embedding", null)
            .limit(5) // Small batch size to prevent timeout

        if (fetchError) {
            throw new Error(`Failed to fetch products: ${fetchError.message}`)
        }

        if (!products || products.length === 0) {
            return NextResponse.json({
                message: "All products processed",
                count: 0,
                remaining: false,
            })
        }

        const results: Array<{ id: string; status: string; error?: string }> = []

        for (const product of products as Product[]) {
            try {
                if (!product.image_url) {
                    console.log(`Skipping product ${product.id} - no image_url`)
                    results.push({ id: product.id, status: "skipped" })
                    continue
                }

                console.log(`Processing: ${product.name} (${product.id})`)

                // Generate L2-normalized embedding
                const embedding = await generateImageEmbedding(product.image_url)

                // Store in database
                const { error: updateError } = await supabase
                    .from("products")
                    .update({ image_embedding: embedding })
                    .eq("id", product.id)

                if (updateError) {
                    throw new Error(updateError.message)
                }

                results.push({ id: product.id, status: "success" })
                console.log(`✓ Successfully processed ${product.name}`)
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err)
                console.error(`✗ Failed to process ${product.id}:`, errorMessage)
                results.push({
                    id: product.id,
                    status: "failed",
                    error: errorMessage,
                })
            }
        }

        const successCount = results.filter((r) => r.status === "success").length
        const failedCount = results.filter((r) => r.status === "failed").length

        return NextResponse.json({
            processed: results.length,
            success: successCount,
            failed: failedCount,
            details: results,
            remaining: products.length >= 5,
        })
    } catch (error) {
        console.error("Backfill error:", error)
        return NextResponse.json(
            {
                error: "Backfill failed",
                message: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        )
    }
}
