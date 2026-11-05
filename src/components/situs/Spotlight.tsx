'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Fragment, useCallback, useEffect, useId, useRef, useState } from 'react'
import type { Hasil, Jenis } from '@/lib/cari'
import { tautanWa } from '@/lib/situs'
import { Ikon } from './Ikon'

type Saran = { produk: { id: number; nama: string; nada: 'biru' | 'oranye'; ikon: string; panduan: Hasil[] }[]; blog: Hasil[] }
type Baris = { kunci: string; grup: string; judul: string; ket?: string; cuplikan?: string; href: string; nada: string; ikon: string; luar?: boolean }

export const BUKA_CARI = 'buka-cari'
/** Dipanggil tombol cari mana pun (kepala, beranda, menu HP). */
export const bukaCari = () => window.dispatchEvent(new Event(BUKA_CARI))

const GRUP: Record<Jenis, [string, string]> = { panduan: ['Panduan', 'Guides'], blog: ['Blog', 'Blog'], changelog: ['Changelog', 'Changelog'], produk: ['Produk', 'Products'] }

/** Tebalkan kata yang dicari tanpa dangerouslySetInnerHTML. */
function Sorot({ teks, kata }: { teks: string; kata: string[] }) {
  if (!kata.length) return <>{teks}</>
  const pola = new RegExp(`(${kata.map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi')
  return (
    <>
      {teks.split(pola).map((b, i) => (i % 2 ? <mark key={i}>{b}</mark> : <Fragment key={i}>{b}</Fragment>))}
    </>
  )
}

/**
 * Pencarian ala Spotlight macOS: Ctrl+Space (atau Ctrl/Cmd+K, atau "/") dari halaman mana pun.
 * Mencari judul, kode, ringkasan, langkah, perintah, isi panduan, blog, changelog, dan produk.
 * Tutup lewat Esc, ketuk di luar, atau tombol Tutup.
 */
export function Spotlight() {
  const router = useRouter()
  const en = useSearchParams().get('lang') === 'en'
  const [buka, setBuka] = useState(false)
  const [q, setQ] = useState('')
  const [hasil, setHasil] = useState<Hasil[] | null>(null)
  const [saran, setSaran] = useState<Saran | null>(null)
  const [aktif, setAktif] = useState(0)
  const [memuat, setMemuat] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const daftar = useRef<HTMLUListElement>(null)
  const idDaftar = useId()
  const t = (id: string, eng: string) => (en ? eng : id)

  const tutup = useCallback(() => {
    setBuka(false)
    setQ('')
    setHasil(null)
  }, [])

  // pintasan keyboard dan event dari tombol cari
  useEffect(() => {
    const tombol = (e: KeyboardEvent) => {
      const ketik = /^(input|textarea|select)$/i.test((e.target as HTMLElement)?.tagName ?? '') || (e.target as HTMLElement)?.isContentEditable
      if ((e.ctrlKey && e.code === 'Space') || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && !ketik)) {
        e.preventDefault()
        setBuka((b) => !b)
      }
    }
    const dariTombol = () => setBuka(true)
    window.addEventListener('keydown', tombol)
    window.addEventListener(BUKA_CARI, dariTombol)
    return () => {
      window.removeEventListener('keydown', tombol)
      window.removeEventListener(BUKA_CARI, dariTombol)
    }
  }, [])

  // saat terbuka: kunci gulir halaman, fokus ke kotak, muat saran sekali
  useEffect(() => {
    if (!buka) return
    document.documentElement.classList.add('kunci-gulir')
    requestAnimationFrame(() => input.current?.focus())
    if (!saran) fetch(`/api/cari${en ? '?lang=en' : ''}`).then((r) => r.json()).then((j) => setSaran(j.saran)).catch(() => {})
    return () => document.documentElement.classList.remove('kunci-gulir')
  }, [buka, saran, en])

  useEffect(() => {
    const kata = q.trim()
    setAktif(0)
    if (kata.length < 2) return setHasil(null)
    const henti = new AbortController()
    setMemuat(true)
    const id = setTimeout(() => {
      fetch(`/api/cari?q=${encodeURIComponent(kata)}${en ? '&lang=en' : ''}`, { signal: henti.signal })
        .then((r) => r.json())
        .then((j) => setHasil(j.hasil ?? []))
        .catch(() => {})
        .finally(() => setMemuat(false))
    }, 160)
    return () => {
      clearTimeout(id)
      henti.abort()
    }
  }, [q, en])

  const kata = q.trim().toLowerCase().split(/\s+/).filter((k) => k.length >= 2)
  const wa: Baris = {
    kunci: 'wa',
    grup: t('Tidak ketemu?', 'Nothing fits?'),
    judul: q.trim() ? t(`Tanya tim soal “${q.trim()}” di WhatsApp`, `Ask our team about “${q.trim()}” on WhatsApp`) : t('Tanya tim lewat WhatsApp', 'Ask our team on WhatsApp'),
    ket: t('Dibalas tim support PerwiraMedia', 'Answered by PerwiraMedia support'),
    href: tautanWa(q.trim() ? t(`Halo PerwiraMedia, saya cari "${q.trim()}" di docs tapi belum ketemu. Bisa dibantu?`, `Hi PerwiraMedia, I searched the docs for "${q.trim()}". Can you help?`) : t('Halo PerwiraMedia, saya butuh bantuan.', 'Hi PerwiraMedia, I need help.')),
    nada: 'hijau',
    ikon: 'pesan',
    luar: true,
  }
  // kelompokkan per jenis (urutan grup mengikuti hasil terbaiknya), urutan skor di dalam grup tetap
  const grupUrut = [...new Set((hasil ?? []).map((h) => h.jenis))]
  const baris: Baris[] = hasil
    ? [...[...hasil].sort((x, y) => grupUrut.indexOf(x.jenis) - grupUrut.indexOf(y.jenis)).map((h) => ({ kunci: h.href + h.judul, grup: GRUP[h.jenis][en ? 1 : 0], judul: h.judul, ket: h.ket, cuplikan: h.cuplikan, href: h.href, nada: h.nada, ikon: h.ikon })), wa]
    : [
        ...(saran?.produk ?? []).flatMap((p) => p.panduan.map((h) => ({ kunci: h.href, grup: p.nama, judul: h.judul, ket: h.ket, href: h.href, nada: p.nada, ikon: p.ikon }))),
        ...(saran?.blog ?? []).map((h) => ({ kunci: h.href, grup: t('Blog terbaru', 'Latest posts'), judul: h.judul, ket: h.ket, href: h.href, nada: h.nada, ikon: h.ikon })),
        wa,
      ]

  const pilih = (b: Baris) => {
    if (b.luar) window.open(b.href, '_blank', 'noopener')
    else router.push(b.href)
    tutup()
  }

  useEffect(() => {
    daftar.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [aktif])

  if (!buka) return null
  return (
    <div className="spot-latar" onMouseDown={(e) => e.target === e.currentTarget && tutup()}>
      <div className="spot" role="dialog" aria-modal="true" aria-label={t('Cari di PerwiraMedia Docs', 'Search PerwiraMedia Docs')}>
        <div className="spot-kepala">
          <Ikon nama="cari" ukuran={22} />
          <input
            ref={input}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') return tutup()
              if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault()
                setAktif((a) => (a + (e.key === 'ArrowDown' ? 1 : -1) + baris.length) % baris.length)
              }
              if (e.key === 'Enter' && baris[aktif]) {
                e.preventDefault()
                pilih(baris[aktif])
              }
            }}
            placeholder={t('Cari apa saja: PPPoE, CLD-014, voucher, /ip address…', 'Search anything: PPPoE, CLD-014, voucher, /ip address…')}
            aria-label={t('Kata yang dicari', 'Search terms')}
            role="combobox"
            aria-expanded="true"
            aria-controls={idDaftar}
            aria-activedescendant={baris[aktif] ? `${idDaftar}-${aktif}` : undefined}
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
          />
          {memuat && <span className="spot-putar" aria-hidden="true" />}
          <button type="button" className="spot-tutup" onClick={tutup}>
            <span className="spot-esc">Esc</span>
            <span className="spot-tutup-teks">{t('Tutup', 'Close')}</span>
          </button>
        </div>

        <ul className="spot-daftar" id={idDaftar} role="listbox" ref={daftar}>
          {hasil?.length === 0 && (
            <li className="spot-kosong" role="presentation">
              {t(`Belum ada yang cocok dengan “${q.trim()}”. Kata ini dicatat untuk tim penulis.`, `Nothing matches “${q.trim()}” yet. We logged it for the writers.`)}
            </li>
          )}
          {baris.map((b, i) => (
            <Fragment key={b.kunci}>
              {(i === 0 || baris[i - 1].grup !== b.grup) && (
                <li className="spot-grup" role="presentation">
                  {b.grup}
                </li>
              )}
              <li
                id={`${idDaftar}-${i}`}
                role="option"
                aria-selected={i === aktif}
                className="spot-baris"
                onMouseMove={() => i !== aktif && setAktif(i)}
                onClick={() => pilih(b)}
              >
                <span className={`spot-ubin ${b.nada}`}>
                  <Ikon nama={b.ikon} ukuran={18} />
                </span>
                <span className="spot-isi">
                  <b>
                    <Sorot teks={b.judul} kata={kata} />
                  </b>
                  {b.cuplikan ? (
                    <small>
                      <Sorot teks={b.cuplikan} kata={kata} />
                    </small>
                  ) : (
                    b.ket && <small>{b.ket}</small>
                  )}
                </span>
                {b.cuplikan && b.ket && <span className="spot-ket">{b.ket}</span>}
                <Ikon nama={b.luar ? 'luar' : 'panah'} ukuran={16} className="spot-panah" />
              </li>
            </Fragment>
          ))}
        </ul>

        <div className="spot-kaki" aria-hidden="true">
          <span><kbd>↑</kbd><kbd>↓</kbd> {t('pilih', 'move')}</span>
          <span><kbd>Enter</kbd> {t('buka', 'open')}</span>
          <span><kbd>Esc</kbd> {t('tutup', 'close')}</span>
          <span className="spot-kaki-kanan"><kbd>Ctrl</kbd>+<kbd>Space</kbd> {t('dari mana saja', 'from anywhere')}</span>
        </div>
      </div>
    </div>
  )
}
