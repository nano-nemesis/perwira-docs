/* eslint-disable @next/next/no-img-element */
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import QRCode from 'qrcode'
import { buatRahasia, uriOtpauth } from '@/lib/duafa'
import { getPayload } from '@/lib/payload'
import { Formulir } from './Formulir'

export const metadata = { title: 'Verifikasi 2FA | PerwiraMedia Docs', robots: { index: false } }

export default async function Verifikasi2FA({ searchParams }: { searchParams: Promise<{ lanjut?: string }> }) {
  const { lanjut = '/tuan' } = await searchParams
  const payload = await getPayload()
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/tuan/login')

  const aktif = !!user.twoFactorEnabled
  // akun baru: buat rahasia di sini, baru disimpan setelah kode pertama benar
  const rahasia = aktif ? undefined : buatRahasia()
  const qr = rahasia ? await QRCode.toDataURL(uriOtpauth(rahasia, user.email), { margin: 1, width: 220 }) : null

  return (
    <main className="kartu">
      <div className="merek">
        <img src="/logo.png" alt="" width={58} height={44} />
        <span>
          PerwiraMedia <b>Docs</b>
        </span>
      </div>
      <div className="garis-langkah" aria-hidden="true">
        <span className="aktif" />
        <span className="aktif oranye" />
      </div>
      <h1>{aktif ? 'Verifikasi dua langkah' : 'Aktifkan verifikasi dua langkah'}</h1>
      <p className="redup">
        {aktif
          ? `Masukkan kode untuk ${user.email}.`
          : 'Wajib untuk semua akun admin. Pindai QR ini dengan Google Authenticator atau Authy, lalu ketik kode yang muncul.'}
      </p>
      {qr && (
        <div className="qr">
          <img src={qr} alt="Kode QR untuk aplikasi authenticator" width={220} height={220} />
          <p className="redup kecil">
            Tidak bisa memindai? Ketik kunci ini: <code>{rahasia}</code>
          </p>
        </div>
      )}
      <Formulir rahasia={rahasia} lanjut={lanjut} aktif={aktif} />
      <a className="keluar" href="/tuan/logout">
        Bukan akunmu? Keluar
      </a>
    </main>
  )
}
