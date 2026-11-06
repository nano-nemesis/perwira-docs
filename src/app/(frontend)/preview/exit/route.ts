import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

/** Keluar dari mode pratinjau, lalu kembali ke tujuan (default: admin). */
export async function GET(request: Request) {
  ;(await draftMode()).disable()
  const ke = new URL(request.url).searchParams.get('ke') || '/tuan'
  redirect(ke.startsWith('/') ? ke : '/tuan')
}
