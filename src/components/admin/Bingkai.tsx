'use client'
import { useLocale, useTheme } from '@payloadcms/ui'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { Awan } from '@/components/situs/Awan'
import { Ikon } from '@/components/situs/Ikon'
import { Ilustrasi } from '@/components/situs/Ilustrasi'

/**
 * Latar panel admin (slot header): gradien biru merek, cahaya yang berkelana, dan awan yang naik, satu tema dengan situs publik.
 * Sekalian memutar animasi masuk isi halaman setiap kali pindah menu.
 */
export function Latar() {
  const jalur = usePathname()
  const locale = useLocale()

  // nama bahasa untuk lencana label field (custom.scss .field-label .localized); teks bawaan Payload memakai em dash
  useEffect(() => {
    const nama = typeof locale?.label === 'string' ? locale.label : locale?.code
    if (nama) document.documentElement.style.setProperty('--pm-bahasa', JSON.stringify(nama))
  }, [locale])

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    document.querySelectorAll('.template-default__wrap > :not(.app-header)').forEach((el) =>
      el.animate(
        [
          { opacity: 0, transform: 'translateY(16px) scale(0.99)', filter: 'blur(6px)' },
          { opacity: 1, transform: 'none', filter: 'none' },
        ],
        { duration: 520, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
      ),
    )
  }, [jalur])

  return (
    <div className="pm-latar" aria-hidden="true">
      <Awan />
    </div>
  )
}

/** Tombol terang/gelap di kepala admin. Pilihannya disimpan Payload di cookie, sama seperti menu Akun. */
export function TombolTema() {
  const { theme, setTheme } = useTheme()
  const gelap = theme === 'dark'
  const label = gelap ? 'Pakai tema terang' : 'Pakai tema gelap'
  return (
    <button type="button" className="pm-tema" onClick={() => setTheme(gelap ? 'light' : 'dark')} aria-label={label} title={label}>
      <Ikon nama={gelap ? 'matahari' : 'bulan'} ukuran={18} />
    </button>
  )
}

/** Tautan Dasbor paling atas di menu samping; Payload sendiri tidak menyediakannya. */
export function TautanDasbor() {
  const aktif = usePathname() === '/tuan'
  return (
    <Link href="/tuan" id="nav-dasbor" className={aktif ? 'nav__link active' : 'nav__link'} aria-current={aktif ? 'page' : undefined}>
      <span className="nav__link-label">Dasbor</span>
    </Link>
  )
}

/** Kartu di dasar menu samping: buka situs publik di tab baru. */
export function KeSitus() {
  return (
    <a className="pm-ke-situs" href="/" target="_blank" rel="noopener">
      <span className="pm-ke-situs-gambar" aria-hidden="true">
        <Ilustrasi />
      </span>
      <b>
        Lihat situs publik <Ikon nama="luar" ukuran={14} />
      </b>
      <span>Cek tulisan seperti yang dibaca pelanggan.</span>
    </a>
  )
}
