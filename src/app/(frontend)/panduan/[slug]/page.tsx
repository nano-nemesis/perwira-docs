import { Prosa } from '@/components/situs/Prosa'
import type { Metadata } from 'next'
import Link from 'next/link'
import { cache } from 'react'
import { DaftarLangkah, KotakVideo, Masukan } from '@/components/situs/Interaktif'
import { Ikon } from '@/components/situs/Ikon'
import { Sidebar } from '@/components/situs/Sidebar'
import { alihkanAtau404 } from '@/lib/pengalih'
import { getPayload, publik } from '@/lib/payload'
import { SITUS, bahasa, idYoutube, pilih, tanggal, tautan, tautanWa, type Lang } from '@/lib/situs'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }

const ambil = cache(async (slug: string, lang: Lang) => {
  const payload = await getPayload()
  const { docs } = await payload.find({ collection: 'docs', locale: lang, where: { slug: { equals: slug } }, limit: 1, depth: 1, ...publik })
  return docs[0]
})

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams])
  const doc = await ambil(slug, bahasa(sp))
  if (!doc) return {}
  const url = `/panduan/${slug}`
  return {
    title: doc.meta?.title || doc.judul,
    description: doc.meta?.description || doc.ringkasan || undefined,
    alternates: { canonical: bahasa(sp) === 'en' ? `${url}?lang=en` : url, languages: { id: url, en: `${url}?lang=en` } },
    openGraph: { type: 'article', title: doc.judul, description: doc.ringkasan || undefined },
  }
}

export default async function HalamanDocs({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams])
  const lang = bahasa(sp)
  const en = lang === 'en'
  const doc = await ambil(slug, lang)
  if (!doc) return alihkanAtau404(`/panduan/${slug}`)

  const produk = typeof doc.produk === 'object' ? doc.produk : null
  const vid = idYoutube(doc.video)
  const langkah = doc.langkah ?? []
  const lain = produk
    ? (await (await getPayload()).find({ collection: 'docs', locale: lang, where: { produk: { equals: produk.id }, slug: { not_equals: doc.slug } }, sort: 'urutan', limit: 5, depth: 0, select: { judul: true, slug: true, kode: true }, ...publik })).docs
    : []
  // schema.org HowTo dan VideoObject untuk hasil pencarian Google
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: doc.judul,
    description: doc.ringkasan,
    inLanguage: lang,
    url: `${SITUS}/panduan/${doc.slug}`,
    step: langkah.map((l, i) => ({ '@type': 'HowToStep', position: i + 1, name: l.judul, text: l.isi || l.judul })),
    ...(vid && { video: { '@type': 'VideoObject', name: doc.judul, embedUrl: `https://www.youtube.com/embed/${vid}`, thumbnailUrl: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`, uploadDate: doc.updatedAt } }),
  }

  return (
    <div className="dua-kolom">
      <Sidebar lang={lang} aktif={doc.slug} />
      <main className="tengah">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
        <nav aria-label="Breadcrumb" className="remah">
          <Link href={tautan(lang, '/')}>{pilih(lang, 'Beranda', 'Home')}</Link>
          <span aria-hidden="true">/</span>
          <Link href={tautan(lang, `/panduan#${produk?.slug ?? ''}`)}>{produk?.nama}</Link>
          <span aria-hidden="true">/</span>
          <span>{doc.judul}</span>
        </nav>
        <h1 className="judul-halaman">{doc.judul}</h1>
        {doc.ringkasan && <p className="hero-sub">{doc.ringkasan}</p>}
        <div className="baris pil-baris">
          <span className={`pil ${produk?.warna ?? 'biru'}`}>{pilih(lang, 'Kode', 'Code')} {doc.kode}</span>
          <span className="pil abu">{pilih(lang, 'Diperbarui', 'Updated')} {tanggal(doc.updatedAt, lang)}</span>
        </div>
        {/* "Di halaman ini" dulu di kolom kanan; sekarang deretan chip yang tidak mengganggu bacaan */}
        <nav className="lompat-ke" aria-label={pilih(lang, 'Di halaman ini', 'On this page')}>
          <span className="redup">{pilih(lang, 'Di halaman ini:', 'On this page:')}</span>
          {langkah.length > 0 && <a href="#langkah">{pilih(lang, `Langkah (${langkah.length})`, `Steps (${langkah.length})`)}</a>}
          {doc.konten && <a href="#penjelasan">{pilih(lang, 'Penjelasan', 'Details')}</a>}
          <a href="#bantuan">{pilih(lang, 'Masih belum berhasil?', 'Still stuck?')}</a>
        </nav>

        {vid && <KotakVideo id={vid} judul={doc.judul} en={en} />}
        {langkah.length > 0 && <DaftarLangkah kode={doc.kode} langkah={langkah} en={en} />}
        {doc.konten && (
          <section id="penjelasan">
            <Prosa data={doc.konten} en={en} />
          </section>
        )}

        <Masukan docId={doc.id} kode={doc.kode} judul={doc.judul} en={en} />

        <div className="kaki-panduan">
          <section id="bantuan" className="bantuan">
            <b>{pilih(lang, 'Masih belum berhasil?', 'Still stuck?')}</b>
            <p>{pilih(lang, `Chat tim kami di WhatsApp. Pesanmu otomatis menyebut kode ${doc.kode}, jadi tidak perlu jelaskan dari awal.`, `Chat with our team on WhatsApp. Your message already mentions code ${doc.kode}.`)}</p>
            <a
              href={tautanWa(pilih(lang, `Halo PerwiraMedia, saya sudah ikuti panduan ${doc.kode} (${doc.judul}) tapi masih belum berhasil. Kendala saya: `, `Hi PerwiraMedia, I followed guide ${doc.kode} (${doc.judul}) but it still doesn't work. My issue: `))}
              className="tombol-wa"
              target="_blank"
              rel="noopener"
            >
              {pilih(lang, 'Tanya via WhatsApp', 'Ask on WhatsApp')}
            </a>
          </section>
          {lain.length > 0 && (
            <section aria-labelledby="h-lain">
              <h2 id="h-lain" className="rel-judul">{pilih(lang, `Panduan lain di ${produk?.nama}`, `More ${produk?.nama} guides`)}</h2>
              <div className="kartu daftar">
                {lain.map((d) => (
                  <Link key={d.id} href={tautan(lang, `/panduan/${d.slug}`)}>
                    <span className={`pil ${produk?.warna ?? 'biru'}`}>{d.kode}</span>
                    <span className="daftar-judul">{d.judul}</span>
                    <Ikon nama="panah" ukuran={18} className="panah" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
