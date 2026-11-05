import type { Metadata } from 'next'
import Link from 'next/link'
import { ambilProduk, getPayload, publik } from '@/lib/payload'
import { bahasa, pilih, tanggal, tautan } from '@/lib/situs'

export const metadata: Metadata = { title: 'Changelog' }

export default async function Changelog({ searchParams }: { searchParams: Promise<{ lang?: string; produk?: string }> }) {
  const sp = await searchParams
  const lang = bahasa(sp)
  const payload = await getPayload()
  const [{ docs }, produk] = await Promise.all([
    payload.find({ collection: 'updates', locale: lang, limit: 100, sort: '-tanggal', depth: 0, ...publik }),
    ambilProduk(lang),
  ])
  const filter = produk.find((p) => p.slug === sp.produk) ?? null
  const rilis = docs
    .map((r) => ({ ...r, item: (r.item ?? []).filter((i) => !filter || i.produk === filter.id) }))
    .filter((r) => r.item.length > 0)

  const href = (p: string | null) => tautan(lang, p ? `/changelog?produk=${p}` : '/changelog')

  return (
    <main className="lebar changelog">
      <div>
        <span className="lencana">{pilih(lang, 'Riwayat perubahan', 'Change history')}</span>
        <h1 className="judul-halaman">{pilih(lang, 'Changelog dokumentasi', 'Documentation changelog')}</h1>
        <p className="hero-sub">{pilih(lang, 'Panduan yang baru ditambah, diperbarui, atau diperbaiki.', 'Guides that were added, updated or fixed.')}</p>
        <ol className="linimasa">
          {rilis.map((r) => (
            <li key={r.id}>
              <div className="linimasa-tanggal">
                <span className="versi">{r.versi}</span>
                <small className="redup">{tanggal(r.tanggal, lang)}</small>
              </div>
              <div className="kartu">
                <h2>{r.judul}</h2>
                <ul>
                  {r.item.map((i) => (
                    <li key={i.id}>
                      <span className={`jenis ${i.jenis}`}>{i.jenis}</span>
                      <span>
                        {i.produk && <b>{produk.find((p) => p.id === i.produk)?.nama} </b>}
                        {i.teks}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ol>
        {rilis.length === 0 && <p className="kosong">{pilih(lang, 'Belum ada perubahan untuk produk ini.', 'No changes for this product yet.')}</p>}
      </div>
      <aside>
        <div className="kartu">
          <b>{pilih(lang, 'Filter produk', 'Filter by product')}</b>
          <div className="filter">
            <Link href={href(null)} aria-current={!filter ? 'true' : undefined}>
              {pilih(lang, 'Semua', 'All')}
            </Link>
            {produk.map((p) => (
              <Link key={p.id} href={href(p.slug)} aria-current={filter?.id === p.id ? 'true' : undefined}>
                {p.nama}
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </main>
  )
}
