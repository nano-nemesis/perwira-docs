import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

/** 2FA TOTP (RFC 6238) dengan modul crypto bawaan Node. Cocok dengan Google Authenticator dan Authy. */

const ABJAD = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export const COOKIE_2FA = 'pm-2fa'
export const COOKIE_SESI = 'payload-token'

export function buatRahasia() {
  const b = randomBytes(20)
  let bit = '',
    hasil = ''
  for (const x of b) bit += x.toString(2).padStart(8, '0')
  for (let i = 0; i + 5 <= bit.length; i += 5) hasil += ABJAD[parseInt(bit.slice(i, i + 5), 2)]
  return hasil
}

function dariBase32(s: string) {
  let bit = ''
  for (const c of s.replace(/=+$/, '').toUpperCase()) bit += ABJAD.indexOf(c).toString(2).padStart(5, '0')
  const out = []
  for (let i = 0; i + 8 <= bit.length; i += 8) out.push(parseInt(bit.slice(i, i + 8), 2))
  return Buffer.from(out)
}

export function kodeTotp(rahasia: string, langkah = Math.floor(Date.now() / 30_000)) {
  const pesan = Buffer.alloc(8)
  pesan.writeBigUInt64BE(BigInt(langkah))
  const h = createHmac('sha1', dariBase32(rahasia)).update(pesan).digest()
  const o = h[h.length - 1] & 15
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).padStart(6, '0')
}

/** Terima kode saat ini dan satu langkah sebelum/sesudahnya (toleransi jam HP meleset 30 detik). */
export function cocokTotp(rahasia: string, kode: string) {
  const k = kode.replace(/\D/g, '')
  if (k.length !== 6) return false
  const now = Math.floor(Date.now() / 30_000)
  return [-1, 0, 1].some((d) => sama(kodeTotp(rahasia, now + d), k))
}

export const uriOtpauth = (rahasia: string, email: string) =>
  `otpauth://totp/${encodeURIComponent(`PerwiraMedia Docs:${email}`)}?secret=${rahasia}&issuer=${encodeURIComponent('PerwiraMedia Docs')}&digits=6&period=30`

/** Delapan kode cadangan sekali pakai. Yang disimpan hanya hash-nya. */
export function buatKodeCadangan() {
  const kode = Array.from({ length: 8 }, () => randomBytes(4).toString('hex').toUpperCase())
  return { kode, hash: kode.map(hashKode) }
}
export const hashKode = (k: string) => createHash('sha256').update(k.replace(/[^0-9a-f]/gi, '').toUpperCase()).digest('hex')

/** Nilai cookie pm-2fa: HMAC dari token sesi Payload, jadi ikut mati saat logout. */
export const tandaSesi = (token: string) => createHmac('sha256', process.env.PAYLOAD_SECRET || '').update(token).digest('hex')

export function sesiTerverifikasi(cookie: string | null | undefined) {
  if (!cookie) return false
  const ambil = (n: string) => cookie.match(new RegExp(`(?:^|;\\s*)${n}=([^;]+)`))?.[1]
  const token = ambil(COOKIE_SESI)
  const tanda = ambil(COOKIE_2FA)
  return !!token && !!tanda && sama(tandaSesi(decodeURIComponent(token)), tanda)
}

function sama(a: string, b: string) {
  const x = Buffer.from(a),
    y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}
