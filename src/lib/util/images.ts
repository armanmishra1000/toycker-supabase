import { Product } from "@/lib/supabase/types/index"

export const CDN_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || `https://${process.env.NEXT_PUBLIC_R2_MEDIA_HOSTNAME || "cdn.toycker.in"}`

export const fixUrl = (url: string | null | undefined) => {
    if (!url) return null
    if (url.startsWith("http") || url.startsWith("/")) return url
    return `${CDN_URL}/${url.startsWith('/') ? '' : '/'}${url}`
}

export const normalizeProductImage = (product: Product): Product => {
    const rawImages: string[] = []
    if (Array.isArray(product.images)) {
        product.images.forEach((img: string | { url: string }) => {
            if (typeof img === 'string') rawImages.push(img)
            else if (typeof img === 'object' && img?.url) rawImages.push(img.url)
        })
    }

    if (product.image_url && !rawImages.includes(product.image_url)) {
        rawImages.unshift(product.image_url)
    }

    const cleanedImages = rawImages
        .map((url) => fixUrl(url))
        .filter((url): url is string => !!url)

    const uniqueImages = Array.from(new Set(cleanedImages))
    const mainImage = fixUrl(product.image_url) || uniqueImages[0] || null

    return {
        ...product,
        title: product.name, // Ensure UI can use .title or .name
        image_url: mainImage,
        thumbnail: fixUrl(product.thumbnail) || mainImage,
        images: uniqueImages,
    }
}
