import { z } from "zod"

// =============================================
// Validation Schema
// =============================================
export const BannerSchema = z.object({
    title: z.string().min(1, "Title is required").max(255, "Title must be less than 255 characters"),
    image_url: z.string().url("Invalid image URL"),
    alt_text: z.string().optional(),
    link_url: z.string().url("Invalid link URL").optional().or(z.literal("")),
    sort_order: z.number().int().min(0, "Sort order must be non-negative"),
    is_active: z.boolean(),
    starts_at: z.string().datetime().optional().nullable(),
    ends_at: z.string().datetime().optional().nullable(),
})

export type BannerFormData = z.infer<typeof BannerSchema>

export type HomeBanner = {
    id: string
    title: string
    image_url: string
    alt_text: string | null
    link_url: string | null
    sort_order: number
    is_active: boolean
    starts_at: string | null
    ends_at: string | null
    created_at: string
    updated_at: string
    created_by: string | null
    updated_by: string | null
}
