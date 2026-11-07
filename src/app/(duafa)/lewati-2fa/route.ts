import { NextResponse, type NextRequest } from 'next/server'
import { COOKIE_2FA, COOKIE_SESI, bolehTanpa2fa, tandaSesi } from '@/lib/duafa'
import { getPayload } from '@/lib/payload'

/**
 * Akun yang dibebaskan admin dari 2FA mendapat cookie pm-2fa tanpa kode,
 * supaya gerbang di proxy.ts dan aturan akses tetap satu jalur. Selain itu dikembalikan ke verifikasi.
 */
export async function GET(req: NextRequest) {
  const lanjut = req.nextUrl.searchParams.get('lanjut') || '/tuan'
  const aman = lanjut.startsWith('/tuan') ? lanjut : '/tuan'
  const payload = await getPayload()
  const { user } = await payload.auth({ headers: req.headers })
  if (!user) return NextResponse.redirect(new URL('/tuan/login', req.url))
  const token = req.cookies.get(COOKIE_SESI)?.value
  if (!bolehTanpa2fa(user) || !token) return NextResponse.redirect(new URL(`/verifikasi-2fa?lanjut=${encodeURIComponent(aman)}`, req.url))

  const res = NextResponse.redirect(new URL(aman, req.url))
  res.cookies.set(COOKIE_2FA, tandaSesi(token), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' })
  return res
}
