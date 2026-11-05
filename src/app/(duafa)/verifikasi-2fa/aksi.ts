'use server'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { COOKIE_2FA, COOKIE_SESI, buatKodeCadangan, cocokTotp, hashKode, tandaSesi } from '@/lib/duafa'
import { getPayload } from '@/lib/payload'

export type Hasil = { galat?: string; cadangan?: string[]; lanjut?: string }

const BATAS_GAGAL = 5
const KUNCI_MENIT = 15

/** Satu aksi untuk aktivasi pertama dan verifikasi tiap login. */
export async function verifikasi(_: Hasil, form: FormData): Promise<Hasil> {
  const payload = await getPayload()
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) redirect('/tuan/login')

  // baca field tersembunyi lewat Local API (overrideAccess)
  const u = await payload.findByID({ collection: 'users', id: user.id, overrideAccess: true, showHiddenFields: true })
  if (u.kunci2faSampai && new Date(u.kunci2faSampai) > new Date()) {
    return { galat: `Terlalu banyak kode salah. Coba lagi setelah ${new Date(u.kunci2faSampai).toLocaleTimeString('id-ID')}.` }
  }

  const kode = String(form.get('kode') || '').trim()
  const lanjut = String(form.get('lanjut') || '/tuan')
  const aman = lanjut.startsWith('/tuan') ? lanjut : '/tuan'
  const rahasia = u.twoFactorEnabled ? u.totpSecret : String(form.get('rahasia') || '')
  const daftarCadangan = (u.kodeCadangan as string[] | null) ?? []

  let lolos = !!rahasia && cocokTotp(rahasia, kode)
  let sisaCadangan = daftarCadangan
  if (!lolos && u.twoFactorEnabled && daftarCadangan.includes(hashKode(kode))) {
    lolos = true
    sisaCadangan = daftarCadangan.filter((h) => h !== hashKode(kode))
  }

  if (!lolos) {
    const gagal = (u.gagal2fa ?? 0) + 1
    await payload.update({
      collection: 'users',
      id: u.id,
      overrideAccess: true,
      data: gagal >= BATAS_GAGAL ? { gagal2fa: 0, kunci2faSampai: new Date(Date.now() + KUNCI_MENIT * 60_000).toISOString() } : { gagal2fa: gagal },
    })
    return { galat: 'Kode salah atau sudah kedaluwarsa.' }
  }

  const cadanganBaru = u.twoFactorEnabled ? null : buatKodeCadangan()
  await payload.update({
    collection: 'users',
    id: u.id,
    overrideAccess: true,
    data: {
      gagal2fa: 0,
      kunci2faSampai: null,
      ...(cadanganBaru ? { twoFactorEnabled: true, totpSecret: rahasia, kodeCadangan: cadanganBaru.hash } : { kodeCadangan: sisaCadangan }),
    },
  })

  const jar = await cookies()
  const token = jar.get(COOKIE_SESI)?.value
  if (token) {
    jar.set(COOKIE_2FA, tandaSesi(token), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' })
  }

  // aktivasi pertama: tampilkan kode cadangan sekali, baru lanjut
  if (cadanganBaru) return { cadangan: cadanganBaru.kode, lanjut: aman }
  redirect(aman)
}
