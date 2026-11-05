import { notFound, permanentRedirect, redirect } from 'next/navigation'
import { getPayload } from './payload'

/**
 * Dipanggil sebelum 404: cocokkan URL ke koleksi Redirect (permalink lama WordPress/Blogger).
 * Ada yang cocok: alihkan. Tidak ada: halaman 404.
 */
export async function alihkanAtau404(jalur: string): Promise<never> {
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'redirects',
    where: { or: [{ from: { equals: jalur } }, { from: { equals: `${jalur}/` } }] },
    limit: 1,
    depth: 1,
  })
  const r = docs[0]
  let tujuan = r?.to?.url ?? null
  const ref = r?.to?.reference
  if (r?.to?.type === 'reference' && ref && typeof ref.value === 'object') {
    tujuan = `/${ref.relationTo === 'docs' ? 'panduan' : 'blog'}/${ref.value.slug}`
  }
  if (!r || !tujuan) notFound()
  if (r.type === '302') redirect(tujuan)
  permanentRedirect(tujuan)
}
