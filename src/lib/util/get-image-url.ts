import { ProductImage } from "@/lib/supabase/types/index"
import { fixUrl } from "./images"

export const getImageUrl = (image: string | ProductImage | null | undefined): string | null => {
    if (!image) return null
    const url = typeof image === 'string' ? image : (image as ProductImage).url
    return fixUrl(url)
}
