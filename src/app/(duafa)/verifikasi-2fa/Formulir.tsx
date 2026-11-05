'use client'
import { useActionState } from 'react'
import { verifikasi, type Hasil } from './aksi'

export function Formulir({ rahasia, lanjut, aktif }: { rahasia?: string; lanjut: string; aktif: boolean }) {
  const [hasil, kirim, menunggu] = useActionState<Hasil, FormData>(verifikasi, {})

  if (hasil.cadangan)
    return (
      <div className="isi">
        <h1>2FA aktif</h1>
        <p className="redup">Simpan kode cadangan ini di tempat aman. Kode ini hanya tampil sekali, dan tiap kode berlaku satu kali kalau HP kamu hilang.</p>
        <ul className="cadangan">
          {hasil.cadangan.map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
        <a className="tombol" href={hasil.lanjut || '/tuan'}>
          Saya sudah menyimpannya, buka dasbor
        </a>
      </div>
    )

  return (
    <form action={kirim} className="isi">
      <input type="hidden" name="lanjut" value={lanjut} />
      {rahasia && <input type="hidden" name="rahasia" value={rahasia} />}
      <label htmlFor="kode">{aktif ? 'Kode 6 digit dari authenticator, atau kode cadangan' : 'Kode 6 digit yang muncul di aplikasi'}</label>
      <input id="kode" name="kode" inputMode={aktif ? 'text' : 'numeric'} autoComplete="one-time-code" maxLength={aktif ? 12 : 6} required autoFocus />
      {hasil.galat && (
        <p role="alert" className="galat">
          {hasil.galat}
        </p>
      )}
      <button className="tombol" disabled={menunggu}>
        {menunggu ? 'Memeriksa...' : aktif ? 'Masuk' : 'Aktifkan 2FA'}
      </button>
    </form>
  )
}
