import { MetadataRoute } from 'next'
import { getBaseURL } from '@/lib/util/env'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin/', '/api/', '/account/'],
        },
        sitemap: `${getBaseURL()}/sitemap.xml`,
    }
}
