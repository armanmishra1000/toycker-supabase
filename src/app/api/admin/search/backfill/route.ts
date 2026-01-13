import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateEmbedding } from "@/lib/data/image-search"

export const maxDuration = 300 // 5 minutes (Vercel Pro/Enterprise or local)

/**
 * Admin utility to backfill missing image embeddings.
 * This is necessary for image search to work for existing products.
 */
export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient()

        // 1. Fetch products missing embeddings
        // We only fetch a small batch to prevent timeout
        const batchSize = 10
        const { data: products, error: fetchError } = await supabase
            .from("products")
            .select("id, image_url")
            .is("embedding", null)
            .not("image_url", "is", null)
            .limit(batchSize)

        if (fetchError) throw fetchError

        if (!products || products.length === 0) {
            return NextResponse.json({
                message: "No products missing embeddings found.",
                count: 0
            })
        }

        const results = []

        for (const product of products) {
            try {
                console.log(`[Backfill] Generating embedding for product: ${product.id}`)

                // Fetch image from URL
                const imageResponse = await fetch(product.image_url!)
                if (!imageResponse.ok) {
                    results.push({ id: product.id, status: "failed", error: "Image fetch failed" })
                    continue
                }

                const buffer = Buffer.from(await imageResponse.arrayBuffer())
                const embedding = await generateEmbedding(buffer)

                // Update product
                const { error: updateError } = await supabase
                    .from("products")
                    .update({ embedding: embedding })
                    .eq("id", product.id)

                if (updateError) {
                    results.push({ id: product.id, status: "failed", error: updateError.message })
                } else {
                    results.push({ id: product.id, status: "success" })
                }
            } catch (innerError: any) {
                results.push({ id: product.id, status: "failed", error: innerError.message })
            }
        }

        const successCount = results.filter(r => r.status === "success").length

        return NextResponse.json({
            message: `Processed ${products.length} products.`,
            successCount,
            results
        })

    } catch (error: any) {
        console.error("Backfill failed:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
