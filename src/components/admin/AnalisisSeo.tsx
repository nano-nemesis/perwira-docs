'use client'
import { useForm, useLocale } from '@payloadcms/ui'
import { useState } from 'react'

type Nilai = { rating: 'baik' | 'cukup' | 'buruk'; teks: string }
type Hasil = { skor: number; warna: 'baik' | 'cukup' | 'buruk'; hasil: Nilai[]; skorBaca: number; baca: Nilai[] }

const LABEL = { baik: 'Baik', cukup: 'Perlu diperbaiki', buruk: 'Masalah' }

/**
 * Panel analisis SEO memakai mesin Yoast (paket yoastseo). Mengambil isi form saat ini
 * (kata kunci, judul/deskripsi SEO, slug, langkah, konten), mengirim ke /api/seo-analisis,
 * lalu menampilkan skor dan daftar penilaian. Analisisnya di server, library-nya tidak ikut ke browser.
 */
export function AnalisisSeo({ jenis }: { jenis: 'docs' | 'posts' }) {
  const { getData } = useForm()
  const locale = useLocale()
  const [hasil, setHasil] = useState<Hasil | null>(null)
  const [sibuk, setSibuk] = useState(false)
  const [galat, setGalat] = useState('')

  async function analisis() {
    setSibuk(true)
    setGalat('')
    try {
      const d = getData() as Record<string, unknown>
      const meta = (d.meta as { title?: string; description?: string }) ?? {}
      const body = {
        jenis,
        fokusKeyphrase: d.fokusKeyphrase,
        slug: d.slug,
        ringkasan: d.ringkasan,
        konten: d.konten,
        langkah: d.langkah,
        title: meta.title || d.judul,
        description: meta.description || d.ringkasan,
        locale: locale?.code,
      }
      const r = await fetch('/api/seo-analisis', { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
      if (!r.ok) throw new Error(`Gagal (${r.status})`)
      setHasil(await r.json())
    } catch (e) {
      setGalat((e as Error).message)
    } finally {
      setSibuk(false)
    }
  }

  const kosong = !((getData() as Record<string, unknown>)?.fokusKeyphrase)

  return (
    <div className="pm-seo">
      <div className="pm-seo-atas">
        <div>
          <h4>Analisis SEO</h4>
          <p className="pm-seo-ket">Mesin Yoast. Isi kata kunci fokus di atas, lalu jalankan analisis.</p>
        </div>
        <button type="button" className="pm-tombol-kecil pm-utama" onClick={analisis} disabled={sibuk || kosong}>
          {sibuk ? 'Menganalisis…' : 'Analisis SEO'}
        </button>
      </div>

      {galat && <p className="pm-seo-galat">{galat}</p>}

      {hasil && (
        <div className="pm-seo-isi">
          <div className="pm-seo-skor">
            <span className={`pm-seo-angka ${hasil.warna}`}>{hasil.skor}</span>
            <span className="pm-seo-skor-ket">
              Skor SEO<small>Keterbacaan: {hasil.skorBaca}/100</small>
            </span>
          </div>
          <Daftar judul="SEO" item={hasil.hasil} />
          {hasil.baca.length > 0 && <Daftar judul="Keterbacaan" item={hasil.baca} />}
        </div>
      )}
    </div>
  )
}

function Daftar({ judul, item }: { judul: string; item: Nilai[] }) {
  const urut = { buruk: 0, cukup: 1, baik: 2 }
  return (
    <div className="pm-seo-grup">
      <h5>{judul}</h5>
      <ul>
        {[...item].sort((a, b) => urut[a.rating] - urut[b.rating]).map((n, i) => (
          <li key={i} className={n.rating}>
            <span className="pm-seo-titik" title={LABEL[n.rating]} />
            {n.teks}
          </li>
        ))}
      </ul>
    </div>
  )
}
