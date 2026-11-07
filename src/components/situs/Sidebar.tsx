import Link from 'next/link'
import { ambilProduk, getPayload, publik } from '@/lib/payload'
import { MEREK, pilih, tautan, tautanWa, type Lang } from '@/lib/situs'
import { hanyaTerbaru } from '@/lib/versi'
import { Ikon } from './Ikon'

export async function Sidebar({ lang, aktif }: { lang: Lang; aktif?: string }) {
  const payload = await getPayload()
  const produk = await ambilProduk(lang)
  const { docs: semua } = await payload.find({
    collection: 'docs',
    locale: lang,
    limit: 200,
    depth: 0,
    sort: 'urutan',
    select: { judul: true, slug: true, produk: true, versi: true, induk: true },
    ...publik,
  })
  // di menu hanya tampilkan versi terbaru tiap panduan; versi lama dibuka dari halaman panduannya
  const docs = hanyaTerbaru(semua)
  const daftar = (isi: typeof docs) => (
    <div className="samping-anak">
      {isi.map((d) => (
        <Link key={d.slug} href={tautan(lang, `/panduan/${d.slug}`)} aria-current={d.slug === aktif ? 'page' : undefined}>
          {d.judul}
        </Link>
      ))}
    </div>
  )

  return (
    <aside className="samping" aria-label={pilih(lang, 'Navigasi dokumentasi', 'Documentation navigation')}>
      <nav className="samping-menu">
        <Link href={tautan(lang, '/')} className="samping-item">
          <Ikon nama="rumah" /> {pilih(lang, 'Beranda', 'Home')}
        </Link>
        <Link href={tautan(lang, '/panduan')} className="samping-item">
          <Ikon nama="roket" /> {pilih(lang, 'Semua panduan', 'All guides')}
        </Link>
        {/* pohon merek > produk > panduan: tertutup semua, kecuali cabang panduan yang sedang dibuka */}
        {MEREK.map((m) => {
          const cabang = produk
            .filter((p) => p.merek === m.nilai)
            .map((p) => ({ p, isi: docs.filter((d) => d.produk === p.id) }))
            .filter((c) => c.isi.length)
          if (!cabang.length) return null
          const memuat = (isi: typeof docs) => isi.some((d) => d.slug === aktif)
          return (
            <details key={m.nilai} className="pohon" open={cabang.some((c) => memuat(c.isi))}>
              <summary className="samping-item">
                <span className="pohon-panah" aria-hidden="true" />
                <span className={`merek-tanda ${m.nada}`}>{m.singkat}</span>
                <span className="pohon-nama">{m.nama}</span>
                <span className="pohon-jumlah">{cabang.reduce((n, c) => n + c.isi.length, 0)}</span>
              </summary>
              <div className="pohon-anak">
                {/* merek dengan satu produk: langsung daftar panduan, tanpa tingkat produk */}
                {cabang.length === 1
                  ? daftar(cabang[0].isi)
                  : cabang.map(({ p, isi }) => (
                      <details key={p.id} className="pohon" open={memuat(isi)}>
                        <summary className="samping-item kecil">
                          <span className="pohon-panah" aria-hidden="true" />
                          <span className={`ikon-${p.nada}`}>
                            <Ikon nama={p.ikon} ukuran={16} />
                          </span>
                          <span className="pohon-nama">{p.nama}</span>
                          <span className="pohon-jumlah">{isi.length}</span>
                        </summary>
                        {daftar(isi)}
                      </details>
                    ))}
              </div>
            </details>
          )
        })}
        <Link href={tautan(lang, '/changelog')} className="samping-item">
          <Ikon nama="jam" /> Changelog
        </Link>
      </nav>
      <div className="bantuan">
        <div className="baris">
          <Ikon nama="headset" ukuran={24} />
          <div>
            <b>{pilih(lang, 'Panduan tidak ditemukan?', "Can't find a guide?")}</b>
            <p>{pilih(lang, 'Ceritakan kendalamu, tim PerwiraMedia bantu langsung lewat WhatsApp.', 'Tell us what you need, our team replies on WhatsApp.')}</p>
          </div>
        </div>
        <a
          href={tautanWa(pilih(lang, 'Halo PerwiraMedia, saya tidak menemukan panduan untuk: ', "Hi PerwiraMedia, I can't find a guide for: "))}
          className="tombol-wa"
          target="_blank"
          rel="noopener"
        >
          {pilih(lang, 'Tanya via WhatsApp', 'Ask on WhatsApp')}
        </a>
      </div>
    </aside>
  )
}
