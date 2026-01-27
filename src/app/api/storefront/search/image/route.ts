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

/**
 * Process and clean image with multiple fallback strategies
 * Handles corrupt JPEGs, malformed images, etc.
 */
async function processImage(inputBuffer: Buffer): Promise<Buffer> {
    // Strategy 1: Try standard Sharp processing with JPEG output
    try {
        console.log("Strategy 1: Standard JPEG cleaning...")
        const cleaned = await sharp(inputBuffer, { failOnError: false })
            .resize(512, 512, {
                fit: "inside",
                withoutEnlargement: true
            })
            .jpeg({
                quality: 90,
                mozjpeg: true,
                force: true // Force JPEG even if input is corrupt
            })
            .toBuffer()

        console.log("✓ Strategy 1 succeeded")
        return cleaned
    } catch (error) {
        console.log("✗ Strategy 1 failed:", error instanceof Error ? error.message : String(error))
    }

    // Strategy 2: Convert to PNG first (more forgiving), then to JPEG
    try {
        console.log("Strategy 2: PNG intermediate conversion...")
        const pngBuffer = await sharp(inputBuffer, { failOnError: false })
            .png({ compressionLevel: 6, force: true })
            .toBuffer()

        const cleaned = await sharp(pngBuffer)
            .resize(512, 512, { fit: "inside" })
            .jpeg({ quality: 90, mozjpeg: true })
            .toBuffer()

        console.log("✓ Strategy 2 succeeded")
        return cleaned
    } catch (error) {
        console.log("✗ Strategy 2 failed:", error instanceof Error ? error.message : String(error))
    }

    // Strategy 3: Use raw buffer processing (most forgiving)
    try {
        console.log("Strategy 3: Raw buffer processing...")
        const cleaned = await sharp(inputBuffer, {
            failOnError: false,
            unlimited: true // Allow processing of large/unusual images
        })
            .withMetadata({ orientation: undefined }) // Strip all metadata
            .rotate() // Auto-rotate based on EXIF (if any)
            .resize(512, 512, {
                fit: "inside",
                kernel: sharp.kernel.nearest // Faster, less error-prone
            })
            .removeAlpha() // Remove alpha channel
            .toColorspace('srgb') // Standard color space
            .jpeg({
                quality: 85,
                chromaSubsampling: '4:4:4', // Better quality, less corruption
                force: true
            })
            .toBuffer()

        console.log("✓ Strategy 3 succeeded")
        return cleaned
    } catch (error) {
        console.log("✗ Strategy 3 failed:", error instanceof Error ? error.message : String(error))
    }

    // Strategy 4: Minimal processing - just resize, no format conversion
    try {
        console.log("Strategy 4: Minimal processing...")
        const cleaned = await sharp(inputBuffer, {
            failOnError: false,
            unlimited: true,
            sequentialRead: true // More memory efficient for corrupt files
        })
            .resize(512, 512, { fit: "inside" })
            .toBuffer()

        console.log("✓ Strategy 4 succeeded")
        return cleaned
    } catch (error) {
        console.log("✗ Strategy 4 failed:", error instanceof Error ? error.message : String(error))
    }

    // All strategies failed
    throw new Error("Unable to process image. The file may be severely corrupted or in an unsupported format.")
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
        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]
        if (!validTypes.includes(imageFile.type)) {
            return NextResponse.json(
                { error: "Invalid image type. Supported: JPEG, PNG, WebP, GIF" },
                { status: 400 }
            )
        }

        console.log(`Processing image: ${imageFile.name} (${imageFile.size} bytes, ${imageFile.type})`)

        // Read image buffer
        const arrayBuffer = await imageFile.arrayBuffer()
        const inputBuffer = Buffer.from(arrayBuffer)

        // Handle cropping if coordinates are provided
        const x = formData.get("x") ? Math.round(Number(formData.get("x"))) : null
        const y = formData.get("y") ? Math.round(Number(formData.get("y"))) : null
        const width = formData.get("width") ? Math.round(Number(formData.get("width"))) : null
        const height = formData.get("height") ? Math.round(Number(formData.get("height"))) : null

        let processedBuffer = inputBuffer

        if (x !== null && y !== null && width !== null && height !== null && width > 0 && height > 0) {
            try {
                const metadata = await sharp(inputBuffer).metadata()
                const imgW = metadata.width || 0
                const imgH = metadata.height || 0

                // Clamp coordinates to image boundaries
                const realX = Math.max(0, Math.min(x, imgW - 1))
                const realY = Math.max(0, Math.min(y, imgH - 1))
                const realW = Math.max(1, Math.min(width, imgW - realX))
                const realH = Math.max(1, Math.min(height, imgH - realY))

                console.log(`Cropping image: x=${realX}, y=${realY}, w=${realW}, h=${realH} (Original: ${imgW}x${imgH})`)

                processedBuffer = await sharp(inputBuffer)
                    .extract({ left: realX, top: realY, width: realW, height: realH })
                    .toBuffer()
            } catch (cropError) {
                console.warn("Cropping failed, falling back to full image:", cropError)
            }
        }

        // Process image with fallback strategies
        const cleanedBuffer = await processImage(processedBuffer)
        console.log(`Final cleaned image: ${cleanedBuffer.length} bytes`)

        // Generate embedding from cleaned buffer
        const embedding = await generateImageEmbedding(cleanedBuffer)
        console.log(`Generated embedding with ${embedding.length} dimensions`)

        // Search database
        const supabase = await createClient()
        const { data, error } = await supabase.rpc("search_products_multimodal", {
            search_query: null, // Explicitly pass null for text query
            search_embedding: embedding,
            match_threshold: 0.65,
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
        let userMessage = "Unable to process this image"
        if (error instanceof Error) {
            if (error.message.includes("Unable to process image")) {
                userMessage = "This image cannot be processed. Please try a different photo."
            } else if (error.message.includes("VipsJpeg") || error.message.includes("Corrupt")) {
                userMessage = "Image file is corrupted. Please try taking a new photo."
            } else if (error.message.includes("unsupported")) {
                userMessage = "Unsupported image format. Please use JPEG, PNG, or WebP."
            } else if (error.message.includes("Database search failed")) {
                userMessage = "Search temporarily unavailable. Please try again."
            }
        }

        return NextResponse.json(
            {
                error: userMessage,
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        )
    }
}
