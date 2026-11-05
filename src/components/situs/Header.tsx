'use client'
/* eslint-disable @next/next/no-img-element */
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { tautanWa } from '@/lib/situs'
import { Ikon } from './Ikon'
import { bukaCari, Spotlight } from './Spotlight'

const MENU = [
  { href: '/', id: 'Beranda', en: 'Home', ikon: 'rumah' },
  { href: '/panduan', id: 'Panduan', en: 'Guides', ikon: 'buku' },
  { href: '/blog', id: 'Blog', en: 'Blog', ikon: 'pena' },
  { href: '/changelog', id: 'Changelog', en: 'Changelog', ikon: 'jam' },
]

export function Header() {
  const path = usePathname()
  const sp = useSearchParams()
  const router = useRouter()
  const en = sp.get('lang') === 'en'
  const q = (href: string) => (en ? `${href}?lang=en` : href)
  const [tema, setTema] = useState<'terang' | 'gelap'>('terang')
  const [menu, setMenu] = useState(false)

  useEffect(
    () => setTema(document.documentElement.dataset.theme === 'gelap' ? 'gelap' : 'terang'),
    [],
  )
  useEffect(() => setMenu(false), [path, sp])
  useEffect(() => {
    if (!menu) return
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false)
    document.documentElement.classList.add('kunci-gulir')
    window.addEventListener('keydown', esc)
    return () => {
      document.documentElement.classList.remove('kunci-gulir')
      window.removeEventListener('keydown', esc)
    }
  }, [menu])

  const gantiTema = (t: 'terang' | 'gelap') => {
    setTema(t)
    document.documentElement.dataset.theme = t
    try {
      localStorage.setItem('tema', t)
    } catch {}
  }
  const gantiBahasa = (l: 'id' | 'en') => {
    const p = new URLSearchParams(sp.toString())
    if (l === 'en') p.set('lang', 'en')
    else p.delete('lang')
    router.push(`${path}${p.size ? `?${p}` : ''}`)
  }
  const aktif = (href: string) => (href === '/' ? path === '/' : path.startsWith(href))

  const bahasa = (
    <div className="alat" role="group" aria-label={en ? 'Language' : 'Bahasa'}>
      <button
        type="button"
        aria-pressed={!en}
        onClick={() => gantiBahasa('id')}
        className="pil-bahasa"
      >
        ID
      </button>
      <button
        type="button"
        aria-pressed={en}
        onClick={() => gantiBahasa('en')}
        className="pil-bahasa"
      >
        EN
      </button>
    </div>
  )
  const temaTombol = (
    <div className="alat" role="group" aria-label={en ? 'Theme' : 'Tema'}>
      <button
        type="button"
        className="bulat"
        aria-pressed={tema === 'terang'}
        aria-label={en ? 'Light theme' : 'Tema terang'}
        onClick={() => gantiTema('terang')}
      >
        <Ikon nama="matahari" ukuran={19} />
      </button>
      <button
        type="button"
        className="bulat"
        aria-pressed={tema === 'gelap'}
        aria-label={en ? 'Dark theme' : 'Tema gelap'}
        onClick={() => gantiTema('gelap')}
      >
        <Ikon nama="bulan" ukuran={18} />
      </button>
    </div>
  )

  // lembar menu dan Spotlight di luar <header>: backdrop-filter header membuat position: fixed terkurung di dalamnya
  return (
    <>
      <header className="kepala">
        <Link href={q('/')} className="merek">
          <img src="/logo.png" alt="" width={38} height={28} />
          <span>
            PerwiraMedia <b>Docs</b>
          </span>
        </Link>
        <nav aria-label={en ? 'Main navigation' : 'Navigasi utama'} className="menu">
          {MENU.map((m) => (
            <Link key={m.href} href={q(m.href)} aria-current={aktif(m.href) ? 'page' : undefined}>
              {en ? m.en : m.id}
            </Link>
          ))}
        </nav>
        <span className="isi-kosong" />
        <TombolCari en={en} />
        <div className="kepala-lebar">
          {bahasa}
          {temaTombol}
        </div>
        <button
          type="button"
          className="bulat tombol-menu"
          aria-label={en ? 'Open menu' : 'Buka menu'}
          aria-expanded={menu}
          onClick={() => setMenu(true)}
        >
          <Ikon nama="menu" ukuran={22} />
        </button>
      </header>

      {menu && (
        <div
          className="lembar-latar"
          onMouseDown={(e) => e.target === e.currentTarget && setMenu(false)}
        >
          <div className="lembar" role="dialog" aria-modal="true" aria-label={en ? 'Menu' : 'Menu'}>
            <div className="lembar-kepala">
              <b>Menu</b>
              <button type="button" className="tombol-garis" onClick={() => setMenu(false)}>
                {en ? 'Close' : 'Tutup'}
              </button>
            </div>
            <button
              type="button"
              className="cari-besar-tombol"
              onClick={() => {
                setMenu(false)
                bukaCari()
              }}
            >
              <Ikon nama="cari" ukuran={18} />{' '}
              {en ? 'Search guides, codes, commands…' : 'Cari panduan, kode, perintah…'}
            </button>
            <nav className="lembar-menu" aria-label={en ? 'Main navigation' : 'Navigasi utama'}>
              {MENU.map((m) => (
                <Link
                  key={m.href}
                  href={q(m.href)}
                  aria-current={aktif(m.href) ? 'page' : undefined}
                >
                  <Ikon nama={m.ikon} /> {en ? m.en : m.id}
                </Link>
              ))}
            </nav>
            <div className="lembar-alat">
              {bahasa}
              {temaTombol}
            </div>
            <a
              className="tombol-wa"
              href={tautanWa(
                en ? 'Hi PerwiraMedia, I need help.' : 'Halo PerwiraMedia, saya butuh bantuan.',
              )}
              target="_blank"
              rel="noopener"
            >
              {en ? 'Ask our team on WhatsApp' : 'Tanya tim lewat WhatsApp'}
            </a>
          </div>
        </div>
      )}
      <Spotlight />
    </>
  )
}

/** Tombol yang membuka Spotlight. Versi besar dipakai di hero beranda. */
export function TombolCari({ en, besar }: { en: boolean; besar?: boolean }) {
  return (
    <button
      type="button"
      className={besar ? 'cari cari-besar' : 'cari'}
      onClick={bukaCari}
      aria-label={en ? 'Search the docs (Ctrl+Space)' : 'Cari dokumentasi (Ctrl+Space)'}
    >
      <Ikon nama="cari" ukuran={besar ? 19 : 17} />
      <span className="cari-teks">
        {besar
          ? en
            ? 'Search guides, codes, commands or fixes…'
            : 'Cari panduan, kode, perintah, atau solusi…'
          : en
            ? 'Search anything…'
            : 'Cari apa saja…'}
      </span>
      <kbd>Ctrl + Space</kbd>
    </button>
  )
}
