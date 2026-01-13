import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { generateImageEmbedding } from "@/lib/ml/embeddings"

export async function GET(_request: Request) {
    return POST(_request)
}

export async function POST(_request: Request) {
    try {
        const supabase = await createAdminClient()

        // 1. Get products that don't have embeddings yet
        const { data: products, error: fetchError } = await supabase
            .from("products")
            .select("id, image_url, name")
            .is("image_embedding", null)
            .limit(5) // Reduced batch size for safety

        if (fetchError) throw fetchError

        if (!products || products.length === 0) {
            return NextResponse.json({ message: "All products processed", count: 0 })
        }

        const results = []
        for (const product of products) {
            try {
                if (!product.image_url) {
                    console.log(`Skipping product ${product.id} - no image_url`)
                    continue
                }

                console.log(`Processing product ${product.name} (${product.id})`)
                const embedding = await generateImageEmbedding(product.image_url)

                const { error: updateError } = await supabase
                    .from("products")
                    .update({ image_embedding: embedding })
                    .eq("id", product.id)

                if (updateError) throw updateError
                results.push({ id: product.id, status: "success" })
            } catch (err) {
                console.error(`Failed to process product ${product.id}:`, err)
                results.push({ id: product.id, status: "failed", error: String(err) })
            }
        }

        return NextResponse.json({
            processed: results.length,
            details: results,
            remaining: products.length >= 10 // Flag if more work is needed
        })
    } catch (error) {
        console.error("Backfill error:", error)
        return NextResponse.json({ error: String(error) }, { status: 500 })
    }
}
