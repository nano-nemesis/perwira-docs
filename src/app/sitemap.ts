import type { MetadataRoute } from 'next'
import { getPayload, publik } from '@/lib/payload'
import { SITUS } from '@/lib/situs'

export const dynamic = 'force-dynamic'

/** Sitemap ID dan EN (hreflang lewat alternates.languages), dibuat ulang tiap permintaan. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload()
  const [docs, posts] = await Promise.all([
    payload.find({ collection: 'docs', limit: 1000, depth: 0, select: { slug: true, updatedAt: true }, ...publik }),
    payload.find({ collection: 'posts', limit: 1000, depth: 0, select: { slug: true, updatedAt: true }, ...publik }),
  ])
  const entri = (path: string, updated?: string) => ({
    url: `${SITUS}${path}`,
    lastModified: updated,
    alternates: { languages: { id: `${SITUS}${path}`, en: `${SITUS}${path}?lang=en` } },
  })
  return [
    entri('/'),
    entri('/panduan'),
    entri('/blog'),
    entri('/changelog'),
    ...docs.docs.map((d) => entri(`/panduan/${d.slug}`, d.updatedAt)),
    ...posts.docs.map((p) => entri(`/blog/${p.slug}`, p.updatedAt)),
  ]
}
