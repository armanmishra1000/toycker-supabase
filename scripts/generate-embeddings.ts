import { pipeline, RawImage } from "@xenova/transformers"
import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"
import fetch from "node-fetch"
import sharp from "sharp"

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Needs service role for updates

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables. Ensure SUPABASE_SERVICE_ROLE_KEY is set in .env")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function syncEmbeddings() {
    console.log("🚀 Starting Embedding Sync...")

    try {
        const pipe = await pipeline("image-feature-extraction", "Xenova/clip-vit-base-patch32")

        // 1. Fetch products with missing embeddings
        const { data: products, error } = await supabase
            .from("products")
            .select("id, name, image_url, thumbnail")
        // .is("embedding", null) // Uncomment to only sync missing ones

        if (error) throw error
        if (!products) return

        console.log(`📦 Found ${products.length} products to sync.`)

        for (const product of products) {
            const imageUrl = product.image_url || product.thumbnail
            if (!imageUrl) {
                console.log(`⚠️ Skipping ${product.name} (No image)`)
                continue
            }

            try {
                console.log(`🔍 Processing: ${product.name}...`)

                // Fetch image bytes
                const response = await fetch(imageUrl)
                const buffer = await response.buffer()

                // Extract raw pixel data using sharp (much more robust)
                const { data, info } = await sharp(buffer)
                    .raw()
                    .toBuffer({ resolveWithObject: true })

                const image = new RawImage(new Uint8Array(data), info.width, info.height, info.channels)

                // Generate embedding
                const output = await pipe(image, { pooling: "mean", normalize: true })
                const embedding = Array.from(output.data)

                // Update database
                const { error: updateError } = await supabase
                    .from("products")
                    .update({ embedding })
                    .eq("id", product.id)

                if (updateError) {
                    console.error(`❌ Error updating ${product.name}:`, updateError.message)
                } else {
                    console.log(`✅ Updated ${product.name}`)
                }
            } catch (e) {
                console.error(`❌ Failed to process ${product.name}:`, e)
            }
        }

        console.log("✨ Sync Completed!")
    } catch (err) {
        console.error("💥 Fatal Error:", err)
    }
}

syncEmbeddings()
