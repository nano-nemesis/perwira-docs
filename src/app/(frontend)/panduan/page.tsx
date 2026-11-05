import type { Metadata } from 'next'
import Link from 'next/link'
import { Ikon } from '@/components/situs/Ikon'
import { Sidebar } from '@/components/situs/Sidebar'
import { ambilProduk, getPayload, publik } from '@/lib/payload'
import { bahasa, pilih, tautan } from '@/lib/situs'

export const metadata: Metadata = { title: 'Panduan', alternates: { canonical: '/panduan', languages: { id: '/panduan', en: '/panduan?lang=en' } } }

export default async function SemuaPanduan({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = bahasa(await searchParams)
  const payload = await getPayload()
  const [{ docs }, produk] = await Promise.all([
    payload.find({ collection: 'docs', locale: lang, limit: 500, depth: 0, sort: 'urutan', ...publik }),
    ambilProduk(lang),
  ])

  return (
    <div className="dua-kolom">
      <Sidebar lang={lang} />
      <main className="tengah">
        <span className="lencana">{pilih(lang, 'Semua panduan', 'All guides')}</span>
        <h1 className="judul-halaman">{pilih(lang, 'Panduan per produk', 'Guides by product')}</h1>
        {produk.map((p) => {
          const isi = docs.filter((d) => d.produk === p.id)
          return (
            <section key={p.id} id={p.slug} className="bagian" aria-labelledby={`h-${p.slug}`}>
              <h2 id={`h-${p.slug}`} className="baris">
                <span className={`ubin kecil ${p.nada}`}>
                  <Ikon nama={p.ikon} />
                </span>
                {p.nama}
              </h2>
              <p className="redup">{p.ket}</p>
              <div className="kartu daftar">
                {isi.map((d) => (
                  <Link key={d.id} href={tautan(lang, `/panduan/${d.slug}`)}>
                    <span className={`pil ${p.nada}`}>{d.kode}</span>
                    <span className="daftar-judul">{d.judul}</span>
                    <Ikon nama="panah" ukuran={18} className="panah" />
                  </Link>
                ))}
                {isi.length === 0 && <p className="kosong">{pilih(lang, 'Panduan untuk produk ini sedang ditulis.', 'Guides for this product are being written.')}</p>}
              </div>
            </section>
          )
        })}
      </main>
    </div>
  )
}
