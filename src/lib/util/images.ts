import { Product } from "@/lib/supabase/types/index"

export const CDN_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || `https://${process.env.NEXT_PUBLIC_R2_MEDIA_HOSTNAME || "cdn.toycker.in"}`

export const fixUrl = (url: string | null | undefined) => {
    if (!url) return null
    let trimmed = url.trim()

    // If it's a legacy toycker.in absolute URL, strip the domain so we can prepend CDN_URL
    if (trimmed.includes("toycker.in/uploads/")) {
        const parts = trimmed.split("toycker.in/")
        if (parts.length > 1) {
            trimmed = parts[1]
        }
    }

    if (trimmed.startsWith("http")) return trimmed

    // Remove all leading slashes to prevent relative path bugs (/uploads/... -> cdn.com/uploads/...)
    let cleanPath = trimmed
    while (cleanPath.startsWith('/')) {
        cleanPath = cleanPath.substring(1)
    }

    if (!cleanPath) return null

    // Safely join baseUrl and cleanPath without double slashes
    const baseUrl = CDN_URL.endsWith('/') ? CDN_URL.slice(0, -1) : CDN_URL
    return `${baseUrl}/${cleanPath}`
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
