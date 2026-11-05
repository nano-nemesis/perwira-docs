'use client'
import { usePathname, useSearchParams } from 'next/navigation'
import { tautanWa } from '@/lib/situs'

/** Tombol WhatsApp mengambang. Pesan otomatis menyebut halaman yang sedang dibaca, jadi CS langsung tahu konteksnya. */
export function TombolWa() {
  usePathname() // render ulang saat pindah halaman supaya judul ikut berganti
  const en = useSearchParams().get('lang') === 'en'
  const pesan = () => {
    const judul = document.title.replace(/ \| PerwiraMedia Docs$/, '')
    return en
      ? `Hi PerwiraMedia, I need help. I'm reading: ${judul} (${location.href})`
      : `Halo PerwiraMedia, saya butuh bantuan. Saya sedang membaca: ${judul} (${location.href})`
  }
  return (
    <a
      className="wa-ambang"
      href={tautanWa(en ? 'Hi PerwiraMedia, I need help.' : 'Halo PerwiraMedia, saya butuh bantuan.')}
      onClick={(e) => (e.currentTarget.href = tautanWa(pesan()))}
      target="_blank"
      rel="noopener"
      aria-label={en ? 'Chat with PerwiraMedia on WhatsApp' : 'Chat PerwiraMedia lewat WhatsApp'}
    >
      <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.05 21.5h-.01a9.46 9.46 0 0 1-4.82-1.32l-.35-.21-3.58.94.96-3.49-.23-.36a9.43 9.43 0 0 1-1.45-5.03c0-5.22 4.25-9.47 9.48-9.47 2.53 0 4.91.99 6.7 2.78a9.4 9.4 0 0 1 2.77 6.7c0 5.23-4.25 9.46-9.47 9.46zm8.06-17.53A11.33 11.33 0 0 0 12.05.63C5.77.63.66 5.74.66 12.02c0 2.01.52 3.97 1.52 5.69L.57 23.6l6.03-1.58a11.36 11.36 0 0 0 5.44 1.39h.01c6.28 0 11.39-5.11 11.39-11.39 0-3.04-1.18-5.9-3.33-8.05z" />
      </svg>
      <span className="wa-label">{en ? 'Need help?' : 'Butuh bantuan?'}</span>
    </a>
  )
}
