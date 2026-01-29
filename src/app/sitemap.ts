import { MetadataRoute } from 'next'
import { getBaseURL } from '@/lib/util/env'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = getBaseURL()
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Fetch all active products for the sitemap
    const { data: products } = await supabase
        .from('products')
        .select('handle, updated_at')
        .eq('status', 'active')

    const productEntries: MetadataRoute.Sitemap = (products || []).map((product) => ({
        url: `${baseUrl}/products/${product.handle}`,
        lastModified: new Date(product.updated_at),
        changeFrequency: 'daily',
        priority: 0.7,
    }))

    const staticEntries: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${baseUrl}/store`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        {
            url: `${baseUrl}/account`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
    ]

    return [...staticEntries, ...productEntries]
}
