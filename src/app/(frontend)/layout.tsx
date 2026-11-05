import type { Metadata } from 'next'
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google'
import { Suspense } from 'react'
import { Header } from '@/components/situs/Header'
import { Latar } from '@/components/situs/Latar'
import { TombolWa } from '@/components/situs/TombolWa'
import { SITUS } from '@/lib/situs'
import './styles.css'

const inter = Inter({ subsets: ['latin'], variable: '--f-isi' })
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['600', '700', '800'], variable: '--f-judul' })
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['500'], variable: '--f-kode' })

export const metadata: Metadata = {
  metadataBase: new URL(SITUS),
  title: { default: 'PerwiraMedia Docs', template: '%s | PerwiraMedia Docs' },
  description: 'Panduan instalasi, konfigurasi, dan troubleshooting produk PerwiraMedia dan PerwiraCloud.',
}

// pasang tema sebelum halaman tampil, supaya tidak berkedip
const temaAwal = `try{var t=localStorage.getItem('tema');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'gelap':'terang';document.documentElement.dataset.theme=t}catch(e){}`

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${jakarta.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: temaAwal }} />
      </head>
      <body>
        <a href="#isi" className="lompat">
          Lompat ke isi
        </a>
        <Latar />
        <Suspense>
          <Header />
        </Suspense>
        <div id="isi">{children}</div>
        <Suspense>
          <TombolWa />
        </Suspense>
      </body>
    </html>
  )
}
