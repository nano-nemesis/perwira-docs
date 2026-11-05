import type { MetadataRoute } from 'next'
import { SITUS } from '@/lib/situs'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api'] },
    sitemap: `${SITUS}/sitemap.xml`,
  }
}
