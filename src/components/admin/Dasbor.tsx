import type { Payload } from 'payload'
import { Ikon } from '@/components/situs/Ikon'

type Props = { payload: Payload; user?: { name?: string | null; email?: string } | null }

const sapaan = () => {
  const jam = Number(new Intl.DateTimeFormat('id-ID', { hour: 'numeric', hour12: false, timeZone: 'Asia/Jakarta' }).format(new Date()))
  return jam < 11 ? 'Selamat pagi' : jam < 15 ? 'Selamat siang' : jam < 18 ? 'Selamat sore' : 'Selamat malam'
}

/** Dasbor admin: apa yang dicari pelanggan tapi belum ada, apa yang menunggu review, dan kesehatan konten. */
export async function Dasbor({ payload, user }: Props) {
  const r = payload.config.routes.admin
  const [docsReview, postsReview, gagal, membantu, totalMasukan, keluhan, tanpaDeskripsi, docsTerbit, postsTerbit, produk] = await Promise.all([
    payload.find({ collection: 'docs', where: { perluReview: { equals: true } }, draft: true, limit: 6, depth: 0 }),
    payload.find({ collection: 'posts', where: { perluReview: { equals: true } }, draft: true, limit: 6, depth: 0 }),
    payload.find({ collection: 'pencarian-gagal', sort: '-jumlah', limit: 6 }),
    payload.count({ collection: 'masukan', where: { membantu: { equals: true } } }),
    payload.count({ collection: 'masukan' }),
    payload.find({ collection: 'masukan', where: { membantu: { equals: false } }, sort: '-createdAt', limit: 4, depth: 1 }),
    payload.count({ collection: 'docs', where: { 'meta.description': { exists: false } } }),
    payload.count({ collection: 'docs', where: { _status: { equals: 'published' } } }),
    payload.count({ collection: 'posts', where: { _status: { equals: 'published' } } }),
    payload.find({ collection: 'produk', limit: 100, depth: 0, sort: 'urutan' }),
  ])
  const perProduk = await Promise.all(
    produk.docs.map(async (p) => ({ ...p, jumlah: (await payload.count({ collection: 'docs', where: { produk: { equals: p.id } } })).totalDocs })),
  )
  const review = [
    ...docsReview.docs.map((d) => ({ id: d.id, judul: d.judul, jenis: 'docs', label: d.kode })),
    ...postsReview.docs.map((p) => ({ id: p.id, judul: p.judul, jenis: 'posts', label: 'Blog' })),
  ]
  const persen = totalMasukan.totalDocs ? Math.round((membantu.totalDocs / totalMasukan.totalDocs) * 100) : null
  const puncakCari = Math.max(1, ...gagal.docs.map((g) => g.jumlah ?? 0))
  const puncakProduk = Math.max(1, ...perProduk.map((p) => p.jumlah))
  const teratas = gagal.docs[0]

  const angka = [
    { label: 'Panduan terbit', nilai: docsTerbit.totalDocs, href: `${r}/collections/docs`, ikon: 'buku', warna: 'biru', ket: 'tampil di situs' },
    { label: 'Tulisan blog', nilai: postsTerbit.totalDocs, href: `${r}/collections/posts`, ikon: 'pena', warna: 'oranye', ket: 'tampil di situs' },
    { label: 'Menunggu review', nilai: review.length, href: '#pm-review', ikon: 'jam', warna: 'oranye', ket: review.length ? 'perlu dicek editor' : 'antrean kosong', sorot: review.length > 0 },
    { label: 'Pembaca terbantu', nilai: persen === null ? 'Belum ada' : `${persen}%`, ikon: 'centang', warna: 'biru', ket: `${totalMasukan.totalDocs} jawaban` },
  ]
  const aksi = [
    { label: 'Tulis panduan', href: `${r}/collections/docs/create`, ikon: 'pena' },
    { label: 'Tulis blog', href: `${r}/collections/posts/create` },
    { label: 'Catat changelog', href: `${r}/collections/updates/create` },
    { label: 'Tambah kategori', href: `${r}/collections/produk/create` },
  ]

  return (
    <div className="pm-dasbor">
      <section className="pm-sapa">
        <div>
          <p className="pm-kecil">
            {sapaan()}, {user?.name || user?.email}
          </p>
          <h2>Dasbor</h2>
          <p className="pm-sapa-sub">
            {teratas
              ? <>Pelanggan mencari <b>“{teratas.q}”</b> {teratas.jumlah} kali dan belum menemukan panduannya.</>
              : 'Semua pencarian pelanggan sejauh ini menemukan hasil.'}
          </p>
        </div>
        <div className="pm-aksi">
          {aksi.map((a, i) => (
            <a key={a.href} href={a.href} className={i === 0 ? 'pm-tombol pm-utama' : 'pm-tombol'}>
              {a.ikon && <Ikon nama={a.ikon} ukuran={16} />}
              {a.label}
            </a>
          ))}
        </div>
      </section>

      <div className="pm-angka">
        {angka.map((a) => {
          const isi = (
            <>
              <span className={`pm-ubin ${a.warna}`}>
                <Ikon nama={a.ikon} ukuran={22} />
              </span>
              <span className={typeof a.nilai === 'number' || String(a.nilai).endsWith('%') ? 'pm-nilai' : 'pm-nilai pm-nilai-teks'}>{a.nilai}</span>
              <span className="pm-label">{a.label}</span>
              <span className="pm-ket">{a.ket}</span>
            </>
          )
          return a.href ? (
            <a key={a.label} href={a.href} className={a.sorot ? 'pm-kartu pm-sorot' : 'pm-kartu'}>
              {isi}
            </a>
          ) : (
            <div key={a.label} className="pm-kartu">
              {isi}
            </div>
          )
        })}
      </div>

      <div className="pm-grid">
        <section className="pm-kartu pm-lebar">
          <header>
            <h3>Dicari pelanggan, belum ada panduannya</h3>
            <span className="pm-ket">dari kotak pencarian situs</span>
          </header>
          {gagal.docs.length === 0 && <p className="pm-kosong">Belum ada pencarian tanpa hasil.</p>}
          <ul className="pm-batang">
            {gagal.docs.map((g) => (
              <li key={g.id}>
                <span className="pm-ubin kecil oranye">
                  <Ikon nama="cari" ukuran={16} />
                </span>
                <span className="pm-batang-teks">{g.q}</span>
                <span className="pm-batang-jalur">
                  <span style={{ width: `${((g.jumlah ?? 0) / puncakCari) * 100}%` }} />
                </span>
                <b>{g.jumlah}×</b>
                <a href={`${r}/collections/docs/create`} className="pm-mini">Tulis</a>
              </li>
            ))}
          </ul>
        </section>

        <section className="pm-kartu" id="pm-review">
          <header>
            <h3>Menunggu review</h3>
            <span className="pm-ket">{review.length} naskah</span>
          </header>
          {review.length === 0 && <p className="pm-kosong">Antrean kosong.</p>}
          <ul className="pm-daftar">
            {review.map((x) => (
              <li key={`${x.jenis}-${x.id}`}>
                <a href={`${r}/collections/${x.jenis}/${x.id}`}>
                  <span className={`pm-ubin kecil ${x.jenis === 'docs' ? 'biru' : 'oranye'}`}>
                    <Ikon nama={x.jenis === 'docs' ? 'buku' : 'pena'} ukuran={16} />
                  </span>
                  <span>
                    {x.judul}
                    <small className="pm-pil">{x.label}</small>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="pm-kartu">
          <header>
            <h3>Kata pembaca: belum membantu</h3>
            <a href={`${r}/collections/masukan`} className="pm-ket">semua</a>
          </header>
          {keluhan.docs.length === 0 && <p className="pm-kosong">Belum ada keluhan.</p>}
          <ul className="pm-daftar">
            {keluhan.docs.map((m) => {
              const doc = typeof m.doc === 'object' ? m.doc : null
              return (
                <li key={m.id} className="pm-baris">
                  <span className="pm-ubin kecil oranye">
                    <Ikon nama="pesan" ukuran={16} />
                  </span>
                  <span>
                    {doc && (
                      <a href={`${r}/collections/docs/${doc.id}`}>
                        {doc.judul}
                        <small className="pm-pil">{doc.kode}</small>
                      </a>
                    )}
                    <span className="pm-kutip">{m.catatan || 'Tanpa catatan.'}</span>
                  </span>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="pm-kartu">
          <header>
            <h3>Panduan per kategori</h3>
            <a href={`${r}/collections/produk`} className="pm-ket">kelola</a>
          </header>
          <ul className="pm-proses">
            {perProduk.map((p) => (
              <li key={p.id}>
                <span className={`pm-ubin ${p.warna}`}>
                  <Ikon nama={p.ikon || 'lapis'} ukuran={20} />
                </span>
                <span className="pm-proses-teks">
                  <b>{p.nama}</b>
                  <span className="pm-ket">{p.jumlah} panduan</span>
                </span>
                <span className={`pm-batang-jalur ${p.warna}`}>
                  <span style={{ width: `${(p.jumlah / puncakProduk) * 100}%` }} />
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="pm-kartu">
          <header>
            <h3>Kesehatan SEO</h3>
          </header>
          <ul className="pm-daftar">
            <li className="pm-baris">
              <span className={`pm-ubin kecil ${tanpaDeskripsi.totalDocs ? 'oranye' : 'hijau'}`}>
                <Ikon nama={tanpaDeskripsi.totalDocs ? 'awas' : 'centang'} ukuran={16} />
              </span>
              {tanpaDeskripsi.totalDocs ? `${tanpaDeskripsi.totalDocs} panduan belum punya deskripsi Google` : 'Semua panduan punya deskripsi Google'}
            </li>
            <li>
              <a href={`${r}/collections/redirects`}>
                <span className="pm-ubin kecil biru">
                  <Ikon nama="luar" ukuran={16} />
                </span>
                Kelola redirect URL lama (WordPress/Blogger)
              </a>
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}
