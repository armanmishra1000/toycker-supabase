import { ProductImage } from "@/lib/supabase/types"

export const getImageUrl = (image: string | ProductImage | null | undefined): string | null => {
    if (!image) return null
    return typeof image === 'string' ? image : image.url
}
