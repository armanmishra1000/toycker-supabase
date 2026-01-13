import {
    env,
    AutoProcessor,
    AutoTokenizer,
    CLIPVisionModelWithProjection,
    CLIPTextModelWithProjection,
    RawImage
} from "@xenova/transformers"

// Set environment variables for Transformers.js
if (typeof window === "undefined") {
    env.allowLocalModels = false
    env.cacheDir = "/tmp/.cache"
}

const MODEL_ID = "Xenova/clip-vit-base-patch32"

/**
 * Singleton class for managing AI models
 */
class ModelContainer {
    private static instance: ModelContainer
    private processor: any | null = null
    private tokenizer: any | null = null
    private visionModel: any | null = null
    private textModel: any | null = null

    private constructor() { }

    static getInstance() {
        if (!ModelContainer.instance) {
            ModelContainer.instance = new ModelContainer()
        }
        return ModelContainer.instance
    }

    async getProcessor() {
        if (!this.processor) this.processor = await AutoProcessor.from_pretrained(MODEL_ID)
        return this.processor
    }

    async getTokenizer() {
        if (!this.tokenizer) this.tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID)
        return this.tokenizer
    }

    async getVisionModel() {
        if (!this.visionModel) {
            this.visionModel = await CLIPVisionModelWithProjection.from_pretrained(MODEL_ID, {
                quantized: true,
            })
        }
        return this.visionModel
    }

    async getTextModel() {
        if (!this.textModel) {
            this.textModel = await CLIPTextModelWithProjection.from_pretrained(MODEL_ID, {
                quantized: true,
            })
        }
        return this.textModel
    }
}

/**
 * Generates a CLIP embedding for an image URL, Buffer, or RawImage
 */
export async function generateImageEmbedding(input: string | any): Promise<number[]> {
    try {
        const container = ModelContainer.getInstance()
        const processor = await container.getProcessor()
        const visionModel = await container.getVisionModel()

        // Read and process image
        const image = await RawImage.read(input)
        const image_inputs = await processor(image)

        // Generate features
        const { image_embeds } = await visionModel(image_inputs)

        // Convert to array
        return Array.from(image_embeds.data)
    } catch (error) {
        console.error("Error generating image embedding:", error)
        throw error
    }
}

/**
 * Generates a CLIP embedding for a text query
 */
export async function generateTextEmbedding(text: string): Promise<number[]> {
    try {
        const container = ModelContainer.getInstance()
        const tokenizer = await container.getTokenizer()
        const textModel = await container.getTextModel()

        // Tokenize text
        const text_inputs = await tokenizer([text], { padding: true, truncation: true })

        // Generate features
        const { text_embeds } = await textModel(text_inputs)

        // Convert to array
        return Array.from(text_embeds.data)
    } catch (error) {
        console.error("Error generating text embedding:", error)
        throw error
    }
}
