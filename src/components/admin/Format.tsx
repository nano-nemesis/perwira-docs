'use client'
import { useDocumentInfo, useLocale } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { Ikon } from '@/components/situs/Ikon'

const TERIMA = '.md,.markdown,.txt,.html,.htm,.json'
type Hasil = { nama: string; ok: boolean; pesan: string; id?: number | string }

/** Di atas daftar docs/blog: impor berkas atau tempel Markdown. Hasilnya selalu draf. */
export function Impor({ koleksi }: { koleksi: 'docs' | 'posts' }) {
  const router = useRouter()
  const berkas = useRef<HTMLInputElement>(null)
  const [hasil, setHasil] = useState<Hasil[]>([])
  const [sibuk, setSibuk] = useState(false)
  const [tempel, setTempel] = useState(false)
  const [teks, setTeks] = useState('')

  async function kirim(daftar: { nama: string; isi: string }[]) {
    setSibuk(true)
    const out: Hasil[] = []
    for (const b of daftar) {
      try {
        const r = await fetch(`/api/${koleksi}/impor`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) })
        const j = await r.json()
        out.push(r.ok ? { nama: b.nama, ok: true, id: j.id, pesan: `“${j.judul}” ${j.aksi} sebagai draf` } : { nama: b.nama, ok: false, pesan: j.galat || `Gagal (${r.status})` })
      } catch {
        out.push({ nama: b.nama, ok: false, pesan: 'Koneksi putus, coba lagi.' })
      }
    }
    setHasil(out)
    setSibuk(false)
    if (out.every((o) => o.ok)) {
      setTeks('')
      setTempel(false)
    }
    router.refresh()
  }

  return (
    <div className="pm-impor">
      <div className="pm-impor-baris">
        <button type="button" className="pm-tombol-kecil pm-utama" onClick={() => berkas.current?.click()} disabled={sibuk}>
          <Ikon nama="unggah" ukuran={16} /> {sibuk ? 'Mengimpor…' : 'Impor berkas'}
        </button>
        <input
          ref={berkas}
          type="file"
          accept={TERIMA}
          multiple
          hidden
          onChange={async (e) => {
            const f = [...(e.target.files ?? [])]
            e.target.value = ''
            if (f.length) kirim(await Promise.all(f.map(async (x) => ({ nama: x.name, isi: await x.text() }))))
          }}
        />
        <button type="button" className="pm-tombol-kecil" onClick={() => setTempel(!tempel)} aria-expanded={tempel}>
          <Ikon nama="pena" ukuran={16} /> Tulis / tempel Markdown
        </button>
        <span className="pm-ket">.md, .txt, .html, atau .json. Slug yang sudah ada diperbarui sebagai draf; versi lamanya tetap di riwayat.</span>
      </div>
      {tempel && (
        <div className="pm-tempel">
          <textarea
            value={teks}
            onChange={(e) => setTeks(e.target.value)}
            aria-label="Isi Markdown"
            placeholder={`---\njudul: Setting PPPoE di MikroTik\n${koleksi === 'docs' ? 'kode: NET-020\nproduk: perwiranet\n' : 'kategori: Tutorial\n'}ringkasan: Satu kalimat untuk Google\n---\n\n${koleksi === 'docs' ? '## Langkah\n\n### 1. Buat profil\nPenjelasan singkat.\n\n```routeros\n/ppp profile add name=10M rate-limit=10M/10M\n```\n\n' : ''}## Penjelasan\n\nIsi dalam **Markdown**: judul, daftar, tautan, blok kode.`}
          />
          <div className="pm-impor-baris">
            <button type="button" className="pm-tombol-kecil pm-utama" onClick={() => kirim([{ nama: 'tempel.md', isi: teks }])} disabled={sibuk || !teks.trim()}>
              Simpan sebagai draf
            </button>
            <button type="button" className="pm-tombol-kecil" onClick={() => setTempel(false)}>
              Tutup
            </button>
          </div>
        </div>
      )}
      {hasil.length > 0 && (
        <ul className="pm-hasil" role="status">
          {hasil.map((h, i) => (
            <li key={i} className={h.ok ? 'oke' : 'gagal'}>
              <b>{h.nama}</b> {h.ok ? <a href={`/tuan/collections/${koleksi}/${h.id}`}>{h.pesan}</a> : h.pesan}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Di bar simpan halaman edit: unduh versi tersimpan sebagai .md, .html, .json, atau brief video short untuk AI agent. */
export function Ekspor() {
  const { id, collectionSlug } = useDocumentInfo()
  const locale = useLocale()
  const menu = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    // tutup lewat Esc atau klik di luar menu
    const tutup = (e: Event) => {
      const d = menu.current
      if (d?.open && (e instanceof KeyboardEvent ? e.key === 'Escape' : !d.contains(e.target as Node))) d.open = false
    }
    document.addEventListener('click', tutup)
    document.addEventListener('keydown', tutup)
    return () => {
      document.removeEventListener('click', tutup)
      document.removeEventListener('keydown', tutup)
    }
  }, [])

  if (!id) return null
  const url = (format: string) => `/api/${collectionSlug}/${id}/ekspor?format=${format}&locale=${locale?.code ?? 'id'}`
  return (
    <details ref={menu} className="pm-ekspor">
      <summary className="pm-tombol-kecil">
        <Ikon nama="unduh" ukuran={16} /> Ekspor
      </summary>
      <div className="pm-ekspor-menu">
        <a href={url('md')} download>
          <b>Markdown (.md)</b>
          <span>Bisa diedit lalu diimpor lagi</span>
        </a>
        <a href={url('html')} download>
          <b>HTML (.html)</b>
          <span>Untuk ditempel ke situs lain</span>
        </a>
        <a href={url('json')} download>
          <b>JSON (.json)</b>
          <span>Cadangan lengkap, impor balik tanpa kehilangan format</span>
        </a>
        <a href={url('video')} download className="pm-ekspor-video">
          <b>
            <Ikon nama="video" ukuran={16} /> Brief video short (.md)
          </b>
          <span>Serahkan ke AI agent untuk dibuatkan naskah video 9:16</span>
        </a>
        <small>Isi diambil dari versi yang terakhir tersimpan.</small>
      </div>
    </details>
  )
}
