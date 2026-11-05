import { Inter, Plus_Jakarta_Sans } from 'next/font/google'
import './duafa.css'

const inter = Inter({ subsets: ['latin'], variable: '--f-isi' })
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['700', '800'], variable: '--f-judul' })

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${jakarta.variable}`}>
      <body>{children}</body>
    </html>
  )
}
