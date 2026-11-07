import { Pratinjau } from '@/components/situs/Pratinjau'
import { Prosa } from '@/components/situs/Prosa'
import type { Metadata } from 'next'
import Link from 'next/link'
import { draftMode } from 'next/headers'
import { cache } from 'react'
import { DaftarLangkah, KotakVideo, Masukan } from '@/components/situs/Interaktif'
import { Ikon } from '@/components/situs/Ikon'
import { Sidebar } from '@/components/situs/Sidebar'
import { alihkanAtau404 } from '@/lib/pengalih'
import { getPayload, publik } from '@/lib/payload'
import { grupVersi, hanyaTerbaru, lebihBaru } from '@/lib/versi'
import { SITUS, bahasa, idYoutube, pilih, tanggal, tautan, tautanWa, type Lang } from '@/lib/situs'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ lang?: string }> }

const ambil = cache(async (slug: string, lang: Lang) => {
  // mode pratinjau (admin lewat tombol Preview) menampilkan draf; publik tetap hanya yang terbit
  const draf = (await draftMode()).isEnabled
  const payload = await getPayload()
  const { docs } = await payload.find({ collection: 'docs', locale: lang, where: { slug: { equals: slug } }, limit: 1, depth: 1, ...(draf ? { draft: true, overrideAccess: true } : publik) })
  return docs[0]
})

// semua versi satu panduan (grup = induk atau dirinya sendiri), diurut terbaru dulu
const ambilVersi = cache(async (grup: number | string, lang: Lang, draf: boolean) => {
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'docs',
    locale: lang,
    where: { or: [{ id: { equals: grup } }, { induk: { equals: grup } }] },
    limit: 50,
    depth: 0,
    select: { judul: true, slug: true, versi: true, induk: true },
    ...(draf ? { draft: true, overrideAccess: true } : publik),
  })
  const urut = [...docs].sort((a, b) => (lebihBaru(a.versi, b.versi) ? -1 : 1))
  return { daftar: urut, terbaru: urut[0] ?? null }
})

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [{ slug }, sp] = await Promise.all([params, searchParams])
  const doc = await ambil(slug, bahasa(sp))
  if (!doc) return {}
  const url = `/panduan/${slug}`
  // versi lama: canonical diarahkan ke versi terbaru supaya tidak dianggap konten duplikat oleh Google
  const { terbaru } = await ambilVersi(grupVersi(doc), bahasa(sp), (await draftMode()).isEnabled)
  const kanon = terbaru && terbaru.id !== doc.id ? `/panduan/${terbaru.slug}` : url
  return {
    title: doc.meta?.title || doc.judul,
    description: doc.meta?.description || doc.ringkasan || undefined,
    alternates: { canonical: bahasa(sp) === 'en' ? `${kanon}?lang=en` : kanon, languages: { id: url, en: `${url}?lang=en` } },
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
  const grup = grupVersi(doc)
  const { daftar: versiLain, terbaru } = await ambilVersi(grup, lang, (await draftMode()).isEnabled)
  const versiLama = terbaru != null && terbaru.id !== doc.id
  // panduan lain di produk yang sama: hanya versi terbaru, dan bukan versi lain dari panduan ini
  const lain = produk
    ? hanyaTerbaru(
        (await (await getPayload()).find({ collection: 'docs', locale: lang, where: { produk: { equals: produk.id } }, sort: 'urutan', limit: 20, depth: 0, select: { judul: true, slug: true, kode: true, versi: true, induk: true }, ...publik })).docs,
      )
        .filter((d) => grupVersi(d) !== grup)
        .slice(0, 5)
    : []
  // schema.org HowTo dan VideoObject untuk hasil pencarian Google
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: doc.judul,
    description: doc.ringkasan,
    inLanguage: lang,
    url: `${SITUS}/panduan/${doc.slug}`,
    step: langkah.map((l, i) => ({ '@type': 'HowToStep', position: i + 1, name: l.judul, text: l.isi || l.judul, ...(typeof l.gambar === 'object' && l.gambar?.url && { image: `${SITUS}${l.gambar.url}` }) })),
    ...(vid && { video: { '@type': 'VideoObject', name: doc.judul, embedUrl: `https://www.youtube.com/embed/${vid}`, thumbnailUrl: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`, uploadDate: doc.updatedAt } }),
  }

  return (
    <div className="dua-kolom">
      <Sidebar lang={lang} aktif={doc.slug} />
      <main className="tengah">
        {(await draftMode()).isEnabled && <Pratinjau kembali={`/tuan/collections/docs/${doc.id}`} />}
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
        {versiLain.length > 1 && (
          <div className="versi-bar" role="group" aria-label={pilih(lang, 'Versi panduan', 'Guide versions')}>
            <Ikon nama="jam" ukuran={16} />
            <span className="redup">{pilih(lang, 'Versi:', 'Version:')}</span>
            {versiLain.map((v) => (
              <Link key={v.id} href={tautan(lang, `/panduan/${v.slug}`)} className={`pil-versi${v.id === doc.id ? ' aktif' : ''}`} aria-current={v.id === doc.id ? 'true' : undefined}>
                v{v.versi || '1.0'}{terbaru && v.id === terbaru.id ? ` · ${pilih(lang, 'Terbaru', 'Latest')}` : ''}
              </Link>
            ))}
          </div>
        )}
        {versiLama && terbaru && (
          <div className="versi-lama" role="note">
            <Ikon nama="info" ukuran={18} />
            <span>
              {pilih(lang, `Kamu melihat versi lama (v${doc.versi || '1.0'}). `, `You're viewing an old version (v${doc.versi || '1.0'}). `)}
              <Link href={tautan(lang, `/panduan/${terbaru.slug}`)}>{pilih(lang, `Buka versi terbaru (v${terbaru.versi})`, `Open the latest version (v${terbaru.versi})`)}</Link>
            </span>
          </div>
        )}
        {/* "Di halaman ini" dulu di kolom kanan; sekarang deretan chip yang tidak mengganggu bacaan */}
        <nav className="lompat-ke" aria-label={pilih(lang, 'Di halaman ini', 'On this page')}>
          <span className="redup">{pilih(lang, 'Di halaman ini:', 'On this page:')}</span>
          {doc.konten && <a href="#penjelasan">{pilih(lang, 'Penjelasan', 'Details')}</a>}
          {langkah.length > 0 && <a href="#langkah">{pilih(lang, `Langkah (${langkah.length})`, `Steps (${langkah.length})`)}</a>}
          <a href="#bantuan">{pilih(lang, 'Masih belum berhasil?', 'Still stuck?')}</a>
        </nav>

        {vid && <KotakVideo id={vid} judul={doc.judul} en={en} />}
        {/* penjelasan dulu, baru langkah-langkah */}
        {doc.konten && (
          <section id="penjelasan">
            <Prosa data={doc.konten} en={en} />
          </section>
        )}
        {langkah.length > 0 && <DaftarLangkah kode={doc.kode} langkah={langkah} en={en} />}

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
