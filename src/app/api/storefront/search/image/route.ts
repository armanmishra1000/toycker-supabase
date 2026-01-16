import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateImageEmbedding } from "@/lib/ml/embeddings"

interface SearchProduct {
    id: string
    name: string
    handle: string
    image_url: string | null
    thumbnail: string | null
    price: number
    currency_code: string
    relevance_score: number
}

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const imageFile = formData.get("image") as File | null

        if (!imageFile) {
            return NextResponse.json(
                { error: "No image provided" },
                { status: 400 }
            )
        }

        // Read file as buffer
        const arrayBuffer = await imageFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Generate embedding directly from buffer
        console.log(`Processing image: ${imageFile.name} (${buffer.length} bytes)`)
        const embedding = await generateImageEmbedding(buffer)
        console.log(`Generated embedding with ${embedding.length} dimensions`)

        // Search database
        const supabase = await createClient()
        const { data, error } = await supabase.rpc("search_products_multimodal", {
            search_embedding: embedding,
            match_threshold: 0.7, // Higher threshold for better accuracy
            match_count: 12,
        })

        if (error) {
            console.error("Database search error:", error)
            throw new Error(`Database search failed: ${error.message}`)
        }

        // Transform results
        const products = (data as SearchProduct[] || []).map((p) => ({
            id: p.id,
            title: p.name,
            handle: p.handle,
            thumbnail: p.image_url || p.thumbnail,
            price: {
                amount: p.price,
                currencyCode: p.currency_code || "INR",
                formatted: `₹${p.price}`,
            },
            relevance_score: p.relevance_score,
        }))

        console.log(`Found ${products.length} matching products`)

        return NextResponse.json({
            products,
            metadata: {
                total: products.length,
                threshold: 0.7,
                embedding_dimensions: embedding.length,
            },
        })
    } catch (error) {
        console.error("Image search error:", error)
        return NextResponse.json(
            {
                error: "Image search failed",
                message: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        )
    }
}
