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

if (typeof window === "undefined") {
    env.allowLocalModels = false
    env.cacheDir = "/tmp/.cache"
}

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

    private constructor() { }

    static getInstance(): ModelContainer {
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
            this.visionModel = await CLIPVisionModelWithProjection.from_pretrained(MODEL_ID, { quantized: true })
        }
        return this.visionModel
    }

    async getTextModel() {
        if (!this.textModel) {
            this.textModel = await CLIPTextModelWithProjection.from_pretrained(MODEL_ID, { quantized: true })
        }
        return this.textModel
    }
}

export async function generateImageEmbedding(input: string | Buffer | Uint8Array): Promise<number[]> {
    try {
        const container = ModelContainer.getInstance()
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
