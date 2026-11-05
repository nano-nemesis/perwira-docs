export type Lang = 'id' | 'en'

export const bahasa = (sp?: { lang?: string | string[] }): Lang => (sp?.lang === 'en' ? 'en' : 'id')
export const pilih = (lang: Lang, id: string, en: string) => (lang === 'en' ? en : id)
/** Tambah ?lang=en ke tautan internal kalau sedang berbahasa Inggris. */
export const tautan = (lang: Lang, href: string) => (lang === 'en' ? `${href}${href.includes('?') ? '&' : '?'}lang=en` : href)

export type Nada = 'biru' | 'oranye'

/** WhatsApp support PerwiraMedia (0851 7345 2805). */
export const WA = '6285173452805'
export const tautanWa = (pesan: string) => `https://wa.me/${WA}?text=${encodeURIComponent(pesan)}`

/** Ambil ID video dari tautan YouTube biasa, youtu.be, atau shorts. */
export const idYoutube = (url?: string | null) =>
  url?.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/)?.[1] ?? null

export const tanggal = (iso: string | null | undefined, lang: Lang) =>
  iso ? new Date(iso).toLocaleDateString(lang === 'en' ? 'en-GB' : 'id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

/** "2 hari lalu", tanpa pustaka tambahan. */
export const relatif = (iso: string, lang: Lang) => {
  const hari = Math.round((Date.now() - new Date(iso).getTime()) / 86_400_000)
  return new Intl.RelativeTimeFormat(lang === 'en' ? 'en' : 'id', { numeric: 'auto' }).format(-hari, 'day')
}

export const SITUS = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
