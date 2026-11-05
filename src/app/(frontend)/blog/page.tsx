import type { Metadata } from 'next'
import Link from 'next/link'
import { getPayload, publik } from '@/lib/payload'
import { bahasa, pilih, tanggal, tautan } from '@/lib/situs'

export const metadata: Metadata = { title: 'Blog', alternates: { canonical: '/blog', languages: { id: '/blog', en: '/blog?lang=en' } } }

export default async function Blog({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = bahasa(await searchParams)
  const payload = await getPayload()
  const { docs } = await payload.find({ collection: 'posts', locale: lang, limit: 60, sort: '-terbitPada', depth: 1, ...publik })

  return (
    <main className="lebar">
      <span className="lencana">Blog</span>
      <h1 className="judul-halaman">{pilih(lang, 'Catatan teknis dari tim Perwira', 'Technical notes from the Perwira team')}</h1>
      <div className="grid-blog">
        {docs.map((p) => {
          const sampul = typeof p.sampul === 'object' ? p.sampul : null
          return (
            <Link key={p.id} href={tautan(lang, `/blog/${p.slug}`)} className="kartu kartu-blog">
              {sampul?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sampul.url} alt={sampul.alt || ''} loading="lazy" />
              ) : (
                <span className="sampul-kosong" />
              )}
              <span className="isi">
                <small className="redup">
                  {p.kategori ? `${p.kategori}, ` : ''}
                  {tanggal(p.terbitPada, lang)}
                </small>
                <b>{p.judul}</b>
                {p.ringkasan && <span className="redup">{p.ringkasan}</span>}
              </span>
            </Link>
          )
        })}
      </div>
      {docs.length === 0 && <p className="kosong">{pilih(lang, 'Belum ada tulisan.', 'No posts yet.')}</p>}
    </main>
  )
}
