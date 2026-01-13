import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { RawImage, pipeline } from "@xenova/transformers"
import { generateImageEmbedding } from "@/lib/ml/embeddings"

export async function POST(request: Request) {
    try {
        const formData = await request.formData()
        const imageFile = formData.get("image") as File

        if (!imageFile) {
            return NextResponse.json({ message: "No image provided" }, { status: 400 })
        }

        // 1. Read file buffer
        const arrayBuffer = await imageFile.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // 2. Write to a temporary file for reliability
        const os = await import('os')
        const fs = await import('fs/promises')
        const path = await import('path')
        const tmpFile = path.join(os.tmpdir(), `search_${Date.now()}_${imageFile.name}`)
        await fs.writeFile(tmpFile, buffer as any)


        // 3. Generate embedding from the file path
        const embedding = await generateImageEmbedding(tmpFile)

        // 4. Clean up the temp file
        await fs.unlink(tmpFile)

        const supabase = await createClient()






        // 3. Search using the new multimodal RPC
        const { data, error } = await supabase.rpc("search_products_multimodal", {
            search_embedding: embedding,
            match_threshold: 0.1, // Adjust based on precision needs
            match_count: 12
        })

        if (error) throw error

        // 4. Transform results (consistent with text search)
        const products = (data || []).map((p: any) => ({
            id: p.id,
            title: p.name,
            handle: p.handle,
            thumbnail: p.image_url || p.thumbnail,
            price: {
                amount: p.price,
                currencyCode: p.currency_code || "INR",
                formatted: `₹${p.price}`,
            },
            relevance_score: p.relevance_score
        }))

        return NextResponse.json({ products })
    } catch (error) {
        console.error("Image search error:", error)
        return NextResponse.json({ message: String(error) }, { status: 500 })
    }
}
