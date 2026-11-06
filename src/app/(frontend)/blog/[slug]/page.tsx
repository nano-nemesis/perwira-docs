import { Pratinjau } from '@/components/situs/Pratinjau'
import { Prosa } from '@/components/situs/Prosa'
import type { Metadata } from 'next'
import Link from 'next/link'
import { draftMode } from 'next/headers'
import { cache } from 'react'
import { KotakVideo } from '@/components/situs/Interaktif'
import { alihkanAtau404 } from '@/lib/pengalih'
import { getPayload, publik } from '@/lib/payload'
import { SITUS, bahasa, idYoutube, pilih, tanggal, tautan, type Lang } from '@/lib/situs'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }

const ambil = cache(async (slug: string, lang: Lang) => {
  const draf = (await draftMode()).isEnabled
  const payload = await getPayload()
  const p = (await payload.find({ collection: 'posts', locale: lang, where: { slug: { equals: slug } }, limit: 1, depth: 1, ...(draf ? { draft: true, overrideAccess: true } : publik) })).docs[0]
  if (!p) return undefined
  // byline penulis memang publik, tapi koleksi Users tertutup untuk pengunjung (publik), jadi ambil namanya saja
  const idPenulis = typeof p.penulis === 'object' ? p.penulis?.id : p.penulis
  const penulis = idPenulis ? await payload.findByID({ collection: 'users', id: idPenulis, select: { name: true }, depth: 0 }).catch(() => null) : null
  return { ...p, penulis }
})

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams])
  const p = await ambil(slug, bahasa(sp))
  if (!p) return {}
  const url = `/blog/${slug}`
  const sampul = typeof p.sampul === 'object' ? p.sampul : null
  return {
    title: p.meta?.title || p.judul,
    description: p.meta?.description || p.ringkasan || undefined,
    alternates: { canonical: url, languages: { id: url, en: `${url}?lang=en` } },
    openGraph: { type: 'article', title: p.judul, publishedTime: p.terbitPada || undefined, images: sampul?.url ? [sampul.url] : undefined },
  }
}

export default async function Artikel({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams])
  const lang = bahasa(sp)
  const p = await ambil(slug, lang)
  if (!p) return alihkanAtau404(`/blog/${slug}`)

  const sampul = typeof p.sampul === 'object' ? p.sampul : null
  const penulis = typeof p.penulis === 'object' ? p.penulis : null
  const vid = idYoutube(p.video)
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: p.judul,
    datePublished: p.terbitPada,
    dateModified: p.updatedAt,
    author: penulis?.name ? { '@type': 'Person', name: penulis.name } : undefined,
    url: `${SITUS}/blog/${p.slug}`,
    inLanguage: lang,
  }

  return (
    <main className="lebar artikel">
      {(await draftMode()).isEnabled && <Pratinjau kembali={`/tuan/collections/posts/${p.id}`} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
      <nav aria-label="Breadcrumb" className="remah">
        <Link href={tautan(lang, '/')}>{pilih(lang, 'Beranda', 'Home')}</Link>
        <span aria-hidden="true">/</span>
        <Link href={tautan(lang, '/blog')}>Blog</Link>
      </nav>
      {p.kategori && <span className="lencana">{p.kategori}</span>}
      <h1 className="judul-halaman">{p.judul}</h1>
      <div className="penulis">
        <span className="avatar">{(penulis?.name || 'P').slice(0, 2).toUpperCase()}</span>
        <span>
          <b>{penulis?.name || 'Tim Perwira'}</b>
          <small className="redup">{tanggal(p.terbitPada, lang)}</small>
        </span>
      </div>
      {sampul?.url && (
        <figure className="sampul">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sampul.url} alt={sampul.alt || ''} />
          {sampul.kredit && <figcaption className="redup kecil">{sampul.kredit}</figcaption>}
        </figure>
      )}
      {vid && <KotakVideo id={vid} judul={p.judul} en={lang === 'en'} />}
      {p.konten && <Prosa data={p.konten} en={lang === 'en'} />}
    </main>
  )
}
