import { MetadataRoute } from 'next'
import { getBaseURL } from '@/lib/util/env'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = getBaseURL()

    // Potential dynamic routes would be fetched here
    // e.g. const products = await getProducts()

    return [
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
}
