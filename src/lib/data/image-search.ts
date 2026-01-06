import sharp from "sharp"
import { pipeline, env, RawImage } from "@xenova/transformers"
import { createClient } from "@/lib/supabase/server"
import { searchEntities, SearchResultsPayload } from "./search"

// Configuration for Transformers.js
// We use the 'onnx-community/clip-vit-base-patch32' model which provides 512-dim embeddings
// or 'Xenova/clip-vit-base-patch32'
const EMBEDDING_MODEL = "Xenova/clip-vit-base-patch32"

// Prevent model downloading during build/runtime if possible, or cache it
env.allowLocalModels = false
env.useBrowserCache = false

// Singleton for the pipeline
let imagePipeline: any = null

async function getPipeline() {
  if (!imagePipeline) {
    imagePipeline = await pipeline("image-feature-extraction", EMBEDDING_MODEL, {
      quantized: false, // Better accuracy for embeddings
    })
  }
  return imagePipeline
}

export const isImageSearchEnabled = true

type SearchByImageArgs = {
  fileBuffer: Buffer
  countryCode: string
  limit?: number
}

export async function searchByImage({
  fileBuffer,
  countryCode,
  limit = 6,
}: SearchByImageArgs): Promise<SearchResultsPayload> {
  try {
    const pipe = await getPipeline()

    // Extract raw pixel data using sharp.
    // This is more robust in Node/Windows environments.
    const { data, info } = await sharp(fileBuffer)
      .raw()
      .toBuffer({ resolveWithObject: true })

    const image = new RawImage(new Uint8Array(data), info.width, info.height, info.channels)

    // Generate Embedding
    const output = await pipe(image, { pooling: "mean", normalize: true })

    // output.data is the Float32Array
    const embedding = Array.from(output.data)

    // Query Supabase
    const supabase = await createClient()

    const { data: productIds, error } = await supabase.rpc("match_products", {
      query_embedding: embedding,
      match_threshold: 0.5, // Logic: > 0.5 similarity
      match_count: limit
    })

    if (error) {
      console.error("Vector search error:", error)
      throw new Error("Vector search failed")
    }

    if (!productIds || productIds.length === 0) {
      return { products: [], categories: [], collections: [], suggestions: [] }
    }

    const ids = productIds.map((p: any) => p.id)

    // Fetch full product details
    // We reuse searchEntities logic or fetch directly?
    // searchEntities is text based. Let's reuse basic listing but filtering by IDs.

    // Since we optimized searchEntities to be text based, we can't easily reuse it "as is" without refactoring.
    // Let's just fetch the products by IDs properly.

    const { data: products } = await supabase
      .from("products")
      .select("id, name, handle, image_url, price, currency_code, thumbnail")
      .in("id", ids)

    // Normalize
    const normalizedProducts = (products || []).map((p: any) => ({
      id: p.id,
      title: p.name,
      handle: p.handle,
      thumbnail: p.image_url || p.thumbnail,
      price: {
        amount: p.price,
        currencyCode: p.currency_code,
        formatted: `₹${p.price}`,
      },
    }))

    return {
      products: normalizedProducts,
      categories: [],
      collections: [],
      suggestions: [],
    }

  } catch (err) {
    console.error("Image search failed:", err)
    // Fallback or rethrow
    throw err
  }
}
