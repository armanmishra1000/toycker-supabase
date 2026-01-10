import { z } from "zod"

// =============================================
// Validation Schema
// =============================================
export const ExclusiveCollectionSchema = z.object({
    product_id: z.string().min(1, "Product ID is required"),
    video_url: z.string().url("Invalid video URL"),
    poster_url: z.string().url("Invalid poster URL").optional().or(z.literal("")),
    video_duration: z.number().int().positive("Duration must be positive").optional().nullable(),
    sort_order: z.number().int().min(0, "Sort order must be non-negative"),
    is_active: z.boolean(),
})

export type ExclusiveCollectionFormData = z.infer<typeof ExclusiveCollectionSchema>

export type HomeExclusiveCollection = {
    id: string
    product_id: string
    video_url: string
    poster_url: string | null
    video_duration: number | null
    sort_order: number
    is_active: boolean
    created_at: string
    updated_at: string
    created_by: string | null
    updated_by: string | null
    product?: {
        id: string
        name: string
        handle: string
        image_url: string | null
        images: string[] | null
        price: number
    } | null
}
