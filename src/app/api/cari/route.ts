import { ipKlien, lolosBatas, terlaluBanyak } from '@/lib/batas'
import { cari, teksLexical, type Entri } from '@/lib/cari'
import { ambilProduk, getPayload, publik } from '@/lib/payload'
import type { Lang } from '@/lib/situs'

// ponytail: indeks di memori per bahasa, disegarkan tiap 60 detik; ganti ke FTS SQLite kalau konten sudah ribuan halaman
const SEGAR = 60_000
const simpanan = new Map<Lang, { waktu: number; data: Promise<{ indeks: Entri[]; saran: unknown }> }>()

async function bangun(lang: Lang) {
  const payload = await getPayload()
  const akhiran = lang === 'en' ? '?lang=en' : ''
  const [docs, posts, updates, produk] = await Promise.all([
    payload.find({ collection: 'docs', locale: lang, limit: 1000, depth: 0, sort: 'urutan', ...publik }),
    payload.find({ collection: 'posts', locale: lang, limit: 1000, depth: 0, sort: '-terbitPada', ...publik }),
    payload.find({ collection: 'updates', locale: lang, limit: 200, depth: 0, sort: '-tanggal', ...publik }),
    ambilProduk(lang),
  ])
  const p = (id: unknown) => produk.find((x) => x.id === id)

  const indeks: Entri[] = [
    ...docs.docs.map((d) => ({
      jenis: 'panduan' as const,
      judul: d.judul,
      ket: `${p(d.produk)?.nama ?? 'Panduan'}, ${d.kode}`,
      href: `/panduan/${d.slug}${akhiran}`,
      nada: p(d.produk)?.nada ?? 'biru',
      ikon: p(d.produk)?.ikon ?? 'buku',
      bidang: [
        [d.judul, 10],
        [d.kode, 12],
        [d.ringkasan ?? '', 4],
        [(d.langkah ?? []).map((l) => `${l.judul}. ${l.isi ?? ''}`).join(' '), 3],
        [(d.langkah ?? []).map((l) => l.perintah ?? '').join(' '), 2],
        [teksLexical(d.konten), 1],
        [p(d.produk)?.nama ?? '', 2],
      ] as [string, number][],
    })),
    ...posts.docs.map((b) => ({
      jenis: 'blog' as const,
      judul: b.judul,
      ket: `Blog${b.kategori ? `, ${b.kategori}` : ''}`,
      href: `/blog/${b.slug}${akhiran}`,
      nada: 'oranye' as const,
      ikon: 'pena',
      bidang: [[b.judul, 9], [b.ringkasan ?? '', 4], [b.kategori ?? '', 3], [teksLexical(b.konten), 1]] as [string, number][],
    })),
    ...updates.docs.map((u) => ({
      jenis: 'changelog' as const,
      judul: `${u.versi}: ${u.judul}`,
      ket: 'Changelog',
      href: `/changelog${akhiran}`,
      nada: 'biru' as const,
      ikon: 'jam',
      bidang: [[`${u.versi} ${u.judul}`, 6], [(u.item ?? []).map((i) => i.teks).join('. '), 2]] as [string, number][],
    })),
    ...produk.map((x) => ({
      jenis: 'produk' as const,
      judul: x.nama,
      ket: lang === 'en' ? 'Product' : 'Produk',
      href: `/panduan${akhiran}#${x.slug}`,
      nada: x.nada,
      ikon: x.ikon,
      bidang: [[x.nama, 10], [x.ket, 3]] as [string, number][],
    })),
  ]

  // saat kotak masih kosong: semua panduan per produk (sekaligus jadi navigasi di HP) dan tulisan blog terbaru
  const saran = {
    produk: produk
      .map((x) => ({ ...x, panduan: indeks.filter((e) => e.jenis === 'panduan' && docs.docs.some((d) => d.produk === x.id && e.href.startsWith(`/panduan/${d.slug}`))).map(({ bidang: _, ...e }) => e) }))
      .filter((x) => x.panduan.length),
    blog: indeks.filter((e) => e.jenis === 'blog').slice(0, 3).map(({ bidang: _, ...e }) => e),
  }
  return { indeks, saran }
}

const ambil = (lang: Lang) => {
  const ada = simpanan.get(lang)
  if (ada && Date.now() - ada.waktu < SEGAR) return ada.data
  const data = bangun(lang)
  simpanan.set(lang, { waktu: Date.now(), data })
  data.catch(() => simpanan.delete(lang))
  return data
}

/** Spotlight: tanpa q kembalikan saran, dengan q kembalikan hasil. Kata tanpa hasil (3+ huruf) dicatat untuk tim penulis. */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = (url.searchParams.get('q') || '').trim().slice(0, 80)
  const lang: Lang = url.searchParams.get('lang') === 'en' ? 'en' : 'id'
  const { indeks, saran } = await ambil(lang)
  if (q.length < 2) return Response.json({ saran })

  // pencarian tanpa hasil mencatat kata ke DB; batasi laju supaya tidak bisa dibanjiri tanpa login
  if (!lolosBatas(`cari:${ipKlien(req)}`, 30, 60_000)) return terlaluBanyak()

  const hasil = cari(indeks, q)
  if (hasil.length === 0 && q.length >= 3) {
    const payload = await getPayload()
    const kata = q.toLowerCase()
    const ada = await payload.find({ collection: 'pencarian-gagal', where: { q: { equals: kata } }, limit: 1, depth: 0 })
    if (ada.docs[0]) await payload.update({ collection: 'pencarian-gagal', id: ada.docs[0].id, data: { jumlah: (ada.docs[0].jumlah ?? 0) + 1 } })
    else await payload.create({ collection: 'pencarian-gagal', data: { q: kata, jumlah: 1 } })
  }
  return Response.json({ hasil })
}
