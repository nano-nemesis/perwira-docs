/**
 * Pencarian spotlight: cocokkan kata pembaca ke judul, kode, ringkasan, langkah, perintah, dan isi.
 * Murni (tanpa Payload) supaya bisa dites. Datanya kecil (puluhan sampai ratusan halaman), jadi cukup dipindai di memori.
 */

export type Jenis = 'panduan' | 'blog' | 'changelog' | 'produk'
export type Entri = {
  jenis: Jenis
  judul: string
  ket: string
  href: string
  nada: 'biru' | 'oranye'
  ikon: string
  /** teks yang dicari beserta bobotnya; yang pertama paling penting */
  bidang: [teks: string, bobot: number][]
}
export type Hasil = Omit<Entri, 'bidang'> & { cuplikan?: string }

/** Huruf kecil, tanpa aksen, tanda baca jadi spasi. "CLD-014" dan "cld 014" jadi sama. */
export const normal = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9./]+/g, ' ')
    .trim()

/** Teks polos dari state Lexical (paragraf, judul, daftar, blok kode). */
export function teksLexical(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as { text?: string; children?: unknown[]; root?: unknown; fields?: { code?: string } }
  if (n.root) return teksLexical(n.root)
  if (typeof n.text === 'string') return n.text
  if (n.fields?.code) return n.fields.code
  return (n.children ?? []).map(teksLexical).join(' ')
}

/** Skor satu entri; 0 kalau ada kata yang tidak ketemu di mana pun (semua kata wajib ada). */
export function skor(e: Entri, kata: string[], frasa: string) {
  let total = 0
  const isi = e.bidang.map(([t, b]) => [normal(t), b] as const)
  for (const k of kata) {
    let terbaik = 0
    for (const [t, b] of isi) {
      const i = t.indexOf(k)
      if (i < 0) continue
      const awalKata = i === 0 || t[i - 1] === ' '
      terbaik = Math.max(terbaik, b * (awalKata ? 1.5 : 1))
    }
    if (!terbaik) return 0
    total += terbaik
  }
  // bonus kalau seluruh kalimat muncul utuh di judul
  if (kata.length > 1 && normal(e.judul).includes(frasa)) total += 10
  return total
}

/** Potongan kalimat di sekitar kata pertama yang ditemukan, di luar judul. */
export function cuplikan(e: Entri, kata: string[], lebar = 70) {
  for (const [teks] of e.bidang.slice(1)) {
    const kecil = teks.toLowerCase()
    for (const k of kata) {
      const i = kecil.indexOf(k)
      if (i < 0) continue
      const a = Math.max(0, i - lebar / 2)
      const b = Math.min(teks.length, i + k.length + lebar)
      return `${a > 0 ? '…' : ''}${teks.slice(a, b).replace(/\s+/g, ' ').trim()}${b < teks.length ? '…' : ''}`
    }
  }
}

export function cari(indeks: Entri[], q: string, batas = 12): Hasil[] {
  const frasa = normal(q)
  const kata = [...new Set(frasa.split(' ').filter((k) => k.length >= 2 || /\d/.test(k)))]
  if (!kata.length) return []
  return indeks
    .map((e) => ({ e, s: skor(e, kata, frasa) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, batas)
    .map(({ e: { bidang: _, ...sisa }, e }) => ({ ...sisa, cuplikan: cuplikan(e, kata) }))
}
