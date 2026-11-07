'use client'
import { useEffect, useState } from 'react'
import { tautanWa } from '@/lib/situs'
import { Ikon, IkonYoutube } from './Ikon'

type Gambar = { url?: string | null; alt?: string | null; width?: number | null; height?: number | null }
type Langkah = { judul: string; isi?: string | null; perintah?: string | null; gambar?: number | Gambar | null }

/** Perintah RouterOS selalu diawali "/" atau ":". Selain itu (bash, cmd) cukup diberi label "Terminal". */
const labelPerintah = (kode: string) =>
  kode.split('\n').every((b) => !b.trim() || b.trim().startsWith('#') || /^[/:]/.test(b.trim())) ? undefined : 'Terminal'

/** Langkah yang bisa dicentang. Posisinya diingat per halaman, jadi aman ditinggal ke Winbox. */
export function DaftarLangkah({ kode, langkah, en }: { kode: string; langkah: Langkah[]; en: boolean }) {
  const kunci = `langkah-${kode}`
  const [selesai, setSelesai] = useState<boolean[]>(() => langkah.map(() => false))

  useEffect(() => {
    try {
      const simpan = JSON.parse(localStorage.getItem(kunci) || 'null')
      if (Array.isArray(simpan)) setSelesai(langkah.map((_, i) => !!simpan[i]))
    } catch {}
  }, [kunci, langkah])

  const ubah = (i: number) => {
    const baru = selesai.map((v, j) => (j === i ? !v : v))
    setSelesai(baru)
    try {
      localStorage.setItem(kunci, JSON.stringify(baru))
    } catch {}
  }
  const jumlah = selesai.filter(Boolean).length

  return (
    <>
      <div className="judul-bagian">
        <h2 id="langkah">{en ? 'Steps' : 'Langkah-langkah'}</h2>
        <span className="progres">
          <span className="trek">
            <span style={{ width: `${(jumlah / langkah.length) * 100}%` }} />
          </span>
          {en ? `${jumlah} of ${langkah.length} done` : `${jumlah} dari ${langkah.length} selesai`}
        </span>
      </div>
      <p className="langkah-petunjuk redup">
        <Ikon nama="centang" ukuran={15} />
        {en ? 'Tap the number on each step to check it off as you go. Your progress is saved on this device.' : 'Ketuk nomor di tiap langkah untuk menandainya selesai. Progresmu tersimpan di perangkat ini.'}
      </p>
      <ol className="langkah">
        {langkah.map((l, i) => (
          <li key={i} className="kartu">
            <button
              type="button"
              className={selesai[i] ? 'nomor beres' : 'nomor'}
              aria-pressed={selesai[i]}
              aria-label={`${en ? 'Mark step' : 'Tandai langkah'} ${i + 1}${selesai[i] ? (en ? ' (done)' : ' (selesai)') : ''}`}
              title={en ? 'Click to mark done' : 'Klik untuk tandai selesai'}
              onClick={() => ubah(i)}
            >
              <span className="nomor-angka">{i + 1}</span>
              <Ikon nama="centang" ukuran={16} />
            </button>
            <div>
              <p className="langkah-judul">{l.judul}</p>
              {l.isi && <p className="redup">{l.isi}</p>}
              {typeof l.gambar === 'object' && l.gambar?.url && (
                <a href={l.gambar.url} target="_blank" rel="noopener" className="langkah-gambar">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.gambar.url} alt={l.gambar.alt || l.judul} width={l.gambar.width ?? undefined} height={l.gambar.height ?? undefined} loading="lazy" />
                </a>
              )}
              {l.perintah && <Terminal kode={l.perintah} en={en} label={labelPerintah(l.perintah)} />}
            </div>
          </li>
        ))}
      </ol>
    </>
  )
}

export function Terminal({ kode, en, label = 'Terminal RouterOS' }: { kode: string; en: boolean; label?: string }) {
  const [tersalin, setTersalin] = useState(false)
  return (
    <div className="terminal">
      <div className="terminal-atas">
        <span className="lampu">
          <i />
          <i />
          <i />
          {label}
        </span>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(kode)
            setTersalin(true)
          }}
        >
          {tersalin ? (en ? 'Copied' : 'Tersalin') : en ? 'Copy' : 'Salin'}
        </button>
      </div>
      <pre>
        <code>{kode}</code>
      </pre>
    </div>
  )
}

/** Kotak video: iframe YouTube baru dimuat setelah diklik (lebih ringan, privasi lebih baik). */
export function KotakVideo({ id, judul, en }: { id: string; judul: string; en: boolean }) {
  const [putar, setPutar] = useState(false)
  if (putar)
    return (
      <div className="video kartu">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
          title={judul}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  return (
    <button type="button" className="video-tombol kartu" onClick={() => setPutar(true)}>
      <span className="video-gambar" style={{ backgroundImage: `url(https://i.ytimg.com/vi/${id}/hqdefault.jpg)` }}>
        <span className="putar">
          <Ikon nama="panah" ukuran={20} />
        </span>
      </span>
      <span>
        <span className="video-label">
          <IkonYoutube ukuran={16} /> {en ? 'Video tutorial available' : 'Tutorial video tersedia'}
        </span>
        <b>{judul}</b>
        <span className="redup">{en ? 'Watch it, or read the written steps below.' : 'Tonton langkahnya, atau baca versi tertulis di bawah.'}</span>
      </span>
    </button>
  )
}

export function Masukan({ docId, kode, judul, en }: { docId: number | string; kode: string; judul: string; en: boolean }) {
  const [tahap, setTahap] = useState<'tanya' | 'ya' | 'belum' | 'terkirim'>('tanya')
  const [catatan, setCatatan] = useState('')
  const kirim = (membantu: boolean, teks = '') =>
    fetch('/api/masukan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ docId, membantu, catatan: teks }) })

  return (
    <div className="kartu masukan" aria-live="polite">
      {tahap === 'tanya' && (
        <div className="baris-antara">
          <b>{en ? 'Was this guide helpful?' : 'Apakah panduan ini membantu?'}</b>
          <span className="baris">
            <button type="button" className="tombol-garis" onClick={() => (kirim(true), setTahap('ya'))}>
              {en ? 'Yes' : 'Ya, membantu'}
            </button>
            <button type="button" className="tombol-garis" onClick={() => setTahap('belum')}>
              {en ? 'Not yet' : 'Belum'}
            </button>
          </span>
        </div>
      )}
      {tahap === 'ya' && <p className="sukses">{en ? 'Thanks for the feedback.' : 'Terima kasih atas masukanmu.'}</p>}
      {tahap === 'terkirim' && (
        <div className="baris-antara">
          <p className="sukses">{en ? 'Thanks, our writers will improve this guide.' : 'Terima kasih, tim penulis akan melengkapi panduan ini.'}</p>
          <a
            className="tombol-wa"
            target="_blank"
            rel="noopener"
            href={tautanWa(
              en
                ? `Hi PerwiraMedia, guide ${kode} (${judul}) didn't answer my question.${catatan ? ` ${catatan}` : ''}`
                : `Halo PerwiraMedia, panduan ${kode} (${judul}) belum menjawab kendala saya.${catatan ? ` ${catatan}` : ''}`,
            )}
          >
            {en ? 'Need an answer now? WhatsApp us' : 'Butuh jawaban sekarang? Chat WhatsApp'}
          </a>
        </div>
      )}
      {tahap === 'belum' && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            kirim(false, catatan)
            setTahap('terkirim')
          }}
        >
          <label htmlFor="catatan">
            <b>{en ? 'What is missing?' : 'Apa yang belum terjawab?'}</b>
          </label>
          <textarea id="catatan" rows={3} maxLength={1000} value={catatan} onChange={(e) => setCatatan(e.target.value)} />
          <button type="submit" className="tombol">
            {en ? 'Send' : 'Kirim masukan'}
          </button>
        </form>
      )}
    </div>
  )
}
