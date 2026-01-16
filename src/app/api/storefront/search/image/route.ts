import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateImageEmbedding } from "@/lib/ml/embeddings"
import sharp from "sharp"

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

        // Validate file size (max 10MB)
        if (imageFile.size > 10 * 1024 * 1024) {
            return NextResponse.json(
                { error: "Image too large. Maximum size is 10MB." },
                { status: 400 }
            )
        }

        // Validate file type
        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
        if (!validTypes.includes(imageFile.type)) {
            return NextResponse.json(
                { error: "Invalid image type. Supported: JPEG, PNG, WebP" },
                { status: 400 }
            )
        }

        console.log(`Processing image: ${imageFile.name} (${imageFile.size} bytes, ${imageFile.type})`)

        // Read and clean image using sharp to avoid corruption issues
        const arrayBuffer = await imageFile.arrayBuffer()
        const inputBuffer = Buffer.from(arrayBuffer)

        // Clean and standardize the image
        // This removes corrupt metadata and ensures consistent format
        const cleanedBuffer = await sharp(inputBuffer)
            .resize(512, 512, {
                fit: "inside", // Maintain aspect ratio
                withoutEnlargement: true
            })
            .jpeg({
                quality: 90,
                mozjpeg: true // Better compression, removes corrupt data
            })
            .toBuffer()

        console.log(`Cleaned image: ${cleanedBuffer.length} bytes`)

        // Generate embedding from cleaned buffer
        const embedding = await generateImageEmbedding(cleanedBuffer)
        console.log(`Generated embedding with ${embedding.length} dimensions`)

        // Search database
        const supabase = await createClient()
        const { data, error } = await supabase.rpc("search_products_multimodal", {
            search_embedding: embedding,
            match_threshold: 0.65, // Slightly lower for different angles/lighting
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
                threshold: 0.65,
                embedding_dimensions: embedding.length,
            },
        })
    } catch (error) {
        console.error("Image search error:", error)

        // Provide user-friendly error messages
        let userMessage = "Image search failed"
        if (error instanceof Error) {
            if (error.message.includes("VipsJpeg") || error.message.includes("Corrupt")) {
                userMessage = "The uploaded image appears to be corrupted. Please try a different image."
            } else if (error.message.includes("unsupported")) {
                userMessage = "Unsupported image format. Please use JPEG, PNG, or WebP."
            }
        }

        return NextResponse.json(
            {
                error: userMessage,
                message: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        )
    }
}
