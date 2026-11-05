import { NextResponse, type NextRequest } from 'next/server'
import { COOKIE_SESI, sesiTerverifikasi } from './lib/duafa'

/** Halaman admin yang boleh dibuka sebelum lolos 2FA (login, lupa password, admin pertama). */
const BEBAS = ['/tuan/login', '/tuan/logout', '/tuan/forgot', '/tuan/reset', '/tuan/create-first-user']

/**
 * Gerbang 2FA: sesi admin yang sudah login tapi belum memasukkan kode 2FA diarahkan ke
 * /verifikasi-2fa (aktivasi untuk akun baru, verifikasi untuk akun yang sudah aktif).
 */
export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl
  if (BEBAS.some((p) => pathname.startsWith(p))) return NextResponse.next()
  if (!req.cookies.get(COOKIE_SESI)) return NextResponse.next() // belum login: Payload yang mengarahkan ke /tuan/login
  if (sesiTerverifikasi(req.headers.get('cookie'))) return NextResponse.next()
  const tujuan = new URL('/verifikasi-2fa', req.url)
  tujuan.searchParams.set('lanjut', pathname + search)
  return NextResponse.redirect(tujuan)
}

export const config = { matcher: ['/tuan/:path*'] }
