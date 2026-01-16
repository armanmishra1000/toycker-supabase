/* eslint-disable */
import {
    env,
    AutoProcessor,
    AutoTokenizer,
    CLIPVisionModelWithProjection,
    CLIPTextModelWithProjection,
    RawImage,
    Tensor,
} from "@xenova/transformers"
import path from "path"
import fs from "fs"

// Configure cache directory based on environment
// Production (Vercel) is read-only except for /tmp
// Local dev can use project root for persistence
const IS_PRODUCTION = process.env.NODE_ENV === "production"
let CACHE_DIR: string

if (IS_PRODUCTION) {
    // Vercel / Production: Use /tmp (non-persistent but writable)
    CACHE_DIR = "/tmp/.cache/huggingface"
} else {
    // Local Development: Use persistent project folder
    CACHE_DIR = path.resolve(process.cwd(), ".cache", "huggingface")
}

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
    try {
        fs.mkdirSync(CACHE_DIR, { recursive: true })
    } catch (error) {
        // Fallback to /tmp if local creation fails for any reason
        console.warn(`Failed to create cache at ${CACHE_DIR}, falling back to /tmp`)
        CACHE_DIR = "/tmp/.cache/huggingface"
        fs.mkdirSync(CACHE_DIR, { recursive: true })
    }
}

env.allowLocalModels = false
env.useBrowserCache = false
env.cacheDir = CACHE_DIR

const MODEL_ID = "Xenova/clip-vit-base-patch32"

function normalizeEmbedding(embedding: number[]): number[] {
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    if (magnitude === 0) return embedding
    return embedding.map((val) => val / magnitude)
}

class ModelContainer {
    private static instance: ModelContainer
    private processor: unknown = null
    private tokenizer: unknown = null
    private visionModel: unknown = null
    private textModel: unknown = null
    private loading: Promise<void> | null = null
    private isReady = false

    private constructor() {
        // Don't block main thread immediately on import
        // Wait a brief moment to allow server to start handling requests
        setTimeout(() => this.warmup(), 1000)
    }

    static getInstance(): ModelContainer {
        if (!ModelContainer.instance) {
            ModelContainer.instance = new ModelContainer()
        }
        return ModelContainer.instance
    }

    /**
     * Preload all models to avoid first-request delay
     */
    private async warmup() {
        if (this.loading || this.isReady) return

        this.loading = (async () => {
            try {
                console.log(`🔥 Warming up CLIP models (Cache: ${CACHE_DIR})...`)
                const start = Date.now()

                // Load models sequentially to avoid blocking the event loop too much
                await this.getProcessor()
                await this.getTokenizer()
                await this.getVisionModel()
                // Text model is optional/lazy loaded since we mostly do image search
                // await this.getTextModel()

                this.isReady = true
                const duration = Date.now() - start
                console.log(`✅ CLIP models ready in ${duration}ms`)
            } catch (error) {
                console.error("Failed to warm up models:", error)
            }
        })()

        return this.loading
    }

    /**
     * Ensure models are loaded before use
     */
    async ensureReady() {
        if (!this.isReady && this.loading) {
            await this.loading
        }
    }

    async getProcessor() {
        if (!this.processor) {
            console.log("Loading processor...")
            this.processor = await AutoProcessor.from_pretrained(MODEL_ID)
        }
        return this.processor
    }

    async getTokenizer() {
        if (!this.tokenizer) {
            console.log("Loading tokenizer...")
            this.tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID)
        }
        return this.tokenizer
    }

    async getVisionModel() {
        if (!this.visionModel) {
            console.log("Loading vision model...")
            this.visionModel = await CLIPVisionModelWithProjection.from_pretrained(MODEL_ID, {
                quantized: true,
                progress_callback: (progress: any) => {
                    if (progress.status === 'progress') {
                        console.log(`Downloading: ${progress.file} - ${Math.round(progress.progress)}%`)
                    }
                }
            })
        }
        return this.visionModel
    }

    async getTextModel() {
        if (!this.textModel) {
            console.log("Loading text model...")
            this.textModel = await CLIPTextModelWithProjection.from_pretrained(MODEL_ID, {
                quantized: true
            })
        }
        return this.textModel
    }

    isModelsReady(): boolean {
        return this.isReady
    }
}

// Initialize singleton immediately when module loads
const modelContainer = ModelContainer.getInstance()

export async function generateImageEmbedding(input: string | Buffer | Uint8Array): Promise<number[]> {
    try {
        const container = ModelContainer.getInstance()

        // Ensure models are loaded (will be instant if already warmed up)
        await container.ensureReady()

        const processor = await container.getProcessor()
        const visionModel = await container.getVisionModel()

        let image: RawImage
        if (typeof input === "string") {
            image = await RawImage.read(input)
        } else {
            const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input)
            const blob = new Blob([buffer as any])
            image = await RawImage.fromBlob(blob as any)
        }

        const imageInputs = await (processor as any)(image)
        const output = await (visionModel as any)(imageInputs)
        const imageEmbeds = output.image_embeds as Tensor
        const embeddingArray = Array.from(imageEmbeds.data as Float32Array)
        return normalizeEmbedding(embeddingArray)
    } catch (error) {
        console.error("Error generating image embedding:", error)
        const message = error instanceof Error ? error.message : String(error)
        throw new Error("Failed to generate image embedding: " + message)
    }
}

export async function generateTextEmbedding(text: string): Promise<number[]> {
    try {
        const container = ModelContainer.getInstance()
        await container.ensureReady()

        const tokenizer = await container.getTokenizer()
        const textModel = await container.getTextModel()
        const textInputs = await (tokenizer as any)([text], { padding: true, truncation: true })
        const output = await (textModel as any)(textInputs)
        const textEmbeds = output.text_embeds as Tensor
        const embeddingArray = Array.from(textEmbeds.data as Float32Array)
        return normalizeEmbedding(embeddingArray)
    } catch (error) {
        console.error("Error generating text embedding:", error)
        const message = error instanceof Error ? error.message : String(error)
        throw new Error("Failed to generate text embedding: " + message)
    }
}

/**
 * Check if models are ready (useful for health checks)
 */
export function areModelsReady(): boolean {
    return ModelContainer.getInstance().isModelsReady()
}

/**
 * Manually trigger model warmup (useful for initialization)
 */
export async function warmupModels(): Promise<void> {
    const container = ModelContainer.getInstance()
    await container.ensureReady()
}
