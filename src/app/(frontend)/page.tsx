import Link from 'next/link'
import { TombolCari } from '@/components/situs/Header'
import { Ikon, IkonYoutube } from '@/components/situs/Ikon'
import { Ilustrasi } from '@/components/situs/Ilustrasi'
import { Sidebar } from '@/components/situs/Sidebar'
import { ambilProduk, getPayload, publik } from '@/lib/payload'
import { bahasa, pilih, relatif, tautan } from '@/lib/situs'
import { hanyaTerbaru } from '@/lib/versi'

export default async function Beranda({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang = bahasa(await searchParams)
  const en = lang === 'en'
  const payload = await getPayload()
  const [semuaDocs, updates, produk] = await Promise.all([
    payload.find({ collection: 'docs', locale: lang, limit: 500, sort: '-updatedAt', depth: 0, select: { judul: true, slug: true, kode: true, produk: true, video: true, versi: true, induk: true }, ...publik }),
    payload.find({ collection: 'updates', locale: lang, limit: 3, sort: '-tanggal', depth: 0, ...publik }),
    ambilProduk(lang),
  ])
  const nadaDari = (id: unknown) => produk.find((p) => p.id === id)?.nada ?? 'biru'
  // panduan terbaru: versi lama tidak ikut tampil
  const populer = { docs: hanyaTerbaru(semuaDocs.docs).slice(0, 5) }

  return (
    <div className="dua-kolom">
      <Sidebar lang={lang} />

      <main className="tengah">
        <section className="hero" aria-labelledby="judul">
          <div className="hero-teks">
            <span className="lencana">{pilih(lang, 'Dokumentasi Resmi PerwiraMedia', 'Official PerwiraMedia documentation')}</span>
            <h1 id="judul">
              {pilih(lang, 'Panduan lengkap', 'Complete guides for')}
              <br />
              {pilih(lang, 'produk dan layanan PerwiraMedia', 'PerwiraMedia products and services')}
            </h1>
            <p className="hero-sub">
              {pilih(
                lang,
                'Temukan panduan instalasi, konfigurasi, penggunaan, hingga troubleshooting untuk seluruh produk PerwiraMedia.',
                'Installation, configuration, usage and troubleshooting guides for every PerwiraMedia product.',
              )}
            </p>
            <TombolCari en={en} besar />
          </div>
          <Ilustrasi />
        </section>

        <section id="produk" aria-labelledby="h-produk" className="bagian">
          <h2 id="h-produk">{pilih(lang, 'Jelajahi Dokumentasi Produk', 'Explore product documentation')}</h2>
          <p className="redup">{pilih(lang, 'Pilih produk di bawah ini untuk melihat panduan lengkapnya.', 'Pick a product to see its full guides.')}</p>
          <div className="grid-produk">
            {produk.map((p) => (
              <Link key={p.id} href={tautan(lang, `/panduan#${p.slug}`)} className="kartu kartu-produk">
                <span className={`ubin ${p.nada}`}>
                  <Ikon nama={p.ikon} ukuran={28} />
                </span>
                <span className="isi">
                  <b>{p.nama}</b>
                  <span className="redup">{p.ket}</span>
                </span>
                <Ikon nama="panah" ukuran={20} className="panah" />
              </Link>
            ))}
          </div>
        </section>

        <section id="populer" aria-labelledby="h-populer" className="bagian">
          <h2 id="h-populer">{pilih(lang, 'Panduan Terbaru', 'Latest guides')}</h2>
          <p className="redup">{pilih(lang, 'Baru ditambah atau diperbarui.', 'Recently added or updated.')}</p>
          <div className="kartu daftar">
            {populer.docs.map((d) => (
              <Link key={d.id} href={tautan(lang, `/panduan/${d.slug}`)}>
                <span className={`pil ${nadaDari(d.produk)}`}>{d.kode}</span>
                <span className="daftar-judul">{d.judul}</span>
                {d.video && (
                  <span className="redup kecil baris">
                    <IkonYoutube ukuran={15} /> {pilih(lang, 'Ada video', 'Has video')}
                  </span>
                )}
              </Link>
            ))}
            {populer.docs.length === 0 && <p className="kosong">{pilih(lang, 'Belum ada panduan yang terbit.', 'No guides published yet.')}</p>}
          </div>
        </section>

        <section id="mulai" aria-labelledby="h-mulai" className="bagian">
          <h2 id="h-mulai">{pilih(lang, 'Mulai di Sini', 'Start here')}</h2>
          <p className="redup">{pilih(lang, 'Tiga langkah pertama untuk pelanggan baru.', 'The first three steps for new customers.')}</p>
          <div className="grid-tiga">
            {[
              [pilih(lang, 'Buat akun dan pilih layanan', 'Create an account'), pilih(lang, 'Daftar di area klien, lalu aktifkan layanan yang kamu butuhkan.', 'Sign up in the client area and activate the service you need.'), 'biru'],
              [pilih(lang, 'Hubungkan router MikroTik', 'Connect your MikroTik'), pilih(lang, 'Sambungkan router lewat VPN Remote atau IP Publik Statik.', 'Connect the router over VPN Remote or a static public IP.'), 'oranye'],
              [pilih(lang, 'Ikuti panduan produkmu', 'Follow your product guide'), pilih(lang, 'Setting hotspot, billing, atau VPS sesuai layanan yang aktif.', 'Set up hotspot, billing or VPS for your active service.'), 'biru'],
            ].map(([judul, isi, nada], i) => (
              <div key={judul} className="kartu kartu-mulai">
                <span className={`ubin kecil ${nada}`}>{i + 1}</span>
                <b>{judul}</b>
                <p className="redup">{isi}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="update" aria-labelledby="h-update" className="bagian">
          <div className="baris-antara">
            <div>
              <h2 id="h-update">{pilih(lang, 'Update Terbaru', 'Latest updates')}</h2>
              <p className="redup">{pilih(lang, 'Perubahan dokumentasi dan layanan.', 'Changes to the docs and services.')}</p>
            </div>
            <Link href={tautan(lang, '/changelog')} className="tautan-panah">
              {pilih(lang, 'Lihat semua', 'See all')} <Ikon nama="panah" ukuran={14} />
            </Link>
          </div>
          <ul className="grid-update">
            {updates.docs.map((u) => (
              <li key={u.id} className="kartu">
                <span className="versi">{u.versi}</span>
                <b>{u.judul}</b>
                <small className="redup">{relatif(u.tanggal, lang)}</small>
              </li>
            ))}
          </ul>
        </section>
      </main>

    </div>
  )
}
