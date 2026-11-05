/**
 * Teks untuk impor/ekspor docs dan blog: frontmatter sederhana, bagian "## Langkah", dan brief video short.
 * Murni string (tanpa Payload) supaya bisa dites dengan `node --test`.
 */

export type Langkah = { judul: string; isi?: string | null; perintah?: string | null }
export type Meta = Record<string, string>

const nilai = (v: string) => {
  if (v.startsWith('"')) {
    try {
      return String(JSON.parse(v))
    } catch {}
  }
  return v.replace(/^'(.*)'$/, '$1')
}

/** Pisahkan frontmatter `kunci: nilai` (satu baris per kunci, nilai boleh dikutip) dari isi. */
export function pisahFrontmatter(teks: string): { meta: Meta; isi: string } {
  const t = teks.replace(/^﻿/, '').replace(/\r\n?/g, '\n')
  const m = t.match(/^---\n([\s\S]*?)\n---(?:\n|$)/)
  if (!m) return { meta: {}, isi: t }
  const meta: Meta = {}
  for (const baris of m[1].split('\n')) {
    const i = baris.indexOf(':')
    if (i > 0) meta[baris.slice(0, i).trim()] = nilai(baris.slice(i + 1).trim())
  }
  return { meta, isi: t.slice(m[0].length) }
}

/** Nilai selalu dikutip JSON, jadi titik dua dan tanda kutip di judul aman. Nilai kosong dilewati. */
export const susunFrontmatter = (meta: Record<string, unknown>) =>
  `---\n${Object.entries(meta)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}: ${JSON.stringify(String(v))}`)
    .join('\n')}\n---\n`

/** Baris pertama "# Judul" jadi judul dan dibuang dari isi (supaya judul tidak dobel di konten). */
export function ambilJudul(isi: string): { judul?: string; sisa: string } {
  const m = isi.match(/^\s*#\s+(.+?)\s*#*\s*(?:\n|$)/)
  return m ? { judul: m[1], sisa: isi.slice(m[0].length) } : { sisa: isi }
}

const PAGAR = /^\s*(```|~~~)/

/** Ambil bagian "## Langkah" (### 1. Judul, teks, blok kode) dari isi markdown. Sisanya jadi konten. */
export function ambilLangkah(isi: string): { langkah: Langkah[]; sisa: string } {
  const baris = isi.split('\n')
  const awal = baris.findIndex((b) => /^##\s+(langkah(-langkah)?|steps)\s*$/i.test(b.trim()))
  if (awal < 0) return { langkah: [], sisa: isi }
  const mentah: { judul: string; teks: string[]; kode: string[] }[] = []
  let pagar = false
  let akhir = baris.length
  for (let i = awal + 1; i < baris.length; i++) {
    const b = baris[i]
    if (PAGAR.test(b)) {
      pagar = !pagar
      continue
    }
    if (!pagar && /^##\s/.test(b)) {
      akhir = i
      break
    }
    if (!pagar && /^###\s/.test(b)) {
      mentah.push({ judul: b.replace(/^###\s+(\d+[.)]\s*)?/, '').trim(), teks: [], kode: [] })
      continue
    }
    const kini = mentah.at(-1)
    if (kini) (pagar ? kini.kode : kini.teks).push(b)
  }
  return {
    langkah: mentah.map(({ judul, teks, kode }) => ({ judul, isi: teks.join('\n').trim() || null, perintah: kode.join('\n').trim() || null })),
    sisa: [...baris.slice(0, awal), ...baris.slice(akhir)].join('\n').trim(),
  }
}

export const susunLangkah = (langkah: Langkah[]) =>
  langkah.length
    ? `## Langkah\n\n${langkah
        .map((l, i) =>
          [`### ${i + 1}. ${l.judul}`, l.isi?.trim(), l.perintah?.trim() && '```routeros\n' + l.perintah.trim() + '\n```'].filter(Boolean).join('\n\n'),
        )
        .join('\n\n')}\n\n`
    : ''

/** Bahasa blok kode yang dikenal editor; alias umum dipetakan, sisanya jadi plaintext supaya simpan tidak gagal validasi. */
export const BAHASA_KODE: Record<string, string> = {
  routeros: 'RouterOS',
  shell: 'Shell',
  plaintext: 'Teks biasa',
  json: 'JSON',
  yaml: 'YAML',
  ini: 'INI',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  html: 'HTML',
  css: 'CSS',
  sql: 'SQL',
  python: 'Python',
  php: 'PHP',
}
const ALIAS: Record<string, string> = { sh: 'shell', bash: 'shell', console: 'shell', zsh: 'shell', mikrotik: 'routeros', rsc: 'routeros', js: 'javascript', ts: 'typescript', yml: 'yaml', text: 'plaintext', txt: 'plaintext', py: 'python', conf: 'ini' }

export const rapikanPagar = (md: string) =>
  md.replace(/^([ \t]*```)([\w+-]*)/gm, (_, pagar: string, bhs: string) => {
    if (!bhs) return pagar
    const b = ALIAS[bhs.toLowerCase()] ?? bhs.toLowerCase()
    return pagar + (b in BAHASA_KODE ? b : 'plaintext')
  })

export const jadiSlug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

type Brief = {
  jenis: 'docs' | 'posts'
  judul: string
  url: string
  kode?: string | null
  produk?: string | null
  ringkasan?: string | null
  video?: string | null
  langkah?: Langkah[] | null
  kontenMd: string
  bahasa: 'id' | 'en'
  wa: string
}

/** Brief .md untuk AI agent pembuat video short (naskah, adegan, teks layar). Isi sumber ditempel utuh di bagian bawah. */
export function briefVideo(b: Brief) {
  const langkah = b.langkah ?? []
  const en = b.bahasa === 'en'
  return `${susunFrontmatter({
    tipe: 'brief-video-short',
    sumber: b.url,
    judul: b.judul,
    kode: b.kode,
    produk: b.produk,
    bahasa: b.bahasa,
    durasi: '30-60 detik',
    rasio: '9:16 vertikal',
    platform: 'YouTube Shorts, Instagram Reels, TikTok',
    video_lengkap: b.video,
  })}
# Brief video short: ${b.judul}

## Tugas
Buat satu video short vertikal 9:16 berdurasi 30 sampai 60 detik dari ${b.jenis === 'docs' ? 'panduan' : 'tulisan blog'} PerwiraMedia di bawah.
Penonton: operator RT/RW Net dan pemilik ISP kecil yang sedang mencari solusi MikroTik. Narasi berbahasa ${en ? 'Inggris' : 'Indonesia santai'}, kalimat pendek.

## Aturan
- 3 detik pertama: hook dari masalah yang dialami penonton, bukan perkenalan.
- Perintah RouterOS ditampilkan persis seperti di sumber, satu perintah per layar, huruf mono yang besar.
- Jangan menambah fitur, harga, atau angka yang tidak ada di sumber.
- Teks layar maksimal 7 kata per adegan, selalu ada (banyak orang menonton tanpa suara).
- Penutup: ajak buka panduan lengkap di ${b.url}${b.kode ? ` (kode ${b.kode})` : ''} atau tanya WhatsApp support ${b.wa}.
- Gaya visual: biru #0948B3, aksen oranye #FF6B35, font Inter dan Poppins, logo PerwiraMedia di pojok.

## Yang harus dihasilkan
1. Tabel adegan: detik, visual, narasi, teks layar.
2. Tiga pilihan judul video (maksimal 60 karakter).
3. Caption pendek dan 3 sampai 5 hashtag.

## Bahan
${b.ringkasan ? `**Ringkasan:** ${b.ringkasan}\n\n` : ''}${
    langkah.length
      ? `**Poin utama (urutan langkah):**\n${langkah.map((l, i) => `${i + 1}. ${l.judul}${l.isi ? `: ${l.isi.replace(/\s+/g, ' ').trim()}` : ''}${l.perintah ? `\n   \`\`\`routeros\n   ${l.perintah.trim().replace(/\n/g, '\n   ')}\n   \`\`\`` : ''}`).join('\n')}\n\n`
      : ''
  }### Isi lengkap sumber

${susunLangkah(langkah)}${b.kontenMd}
`
}
