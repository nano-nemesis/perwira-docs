import { draftMode, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { sesiTerverifikasi } from '@/lib/duafa'

/**
 * Masuk mode pratinjau draf. Dipanggil dari tombol "Preview" di admin (admin.preview per koleksi).
 * Hanya sesi admin yang sudah lolos 2FA yang boleh menyalakannya, jadi draf tidak bocor ke publik.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const koleksi = searchParams.get('collection')
  const slug = searchParams.get('slug')
  const en = searchParams.get('lang') === 'en'

  if (!sesiTerverifikasi((await headers()).get('cookie'))) {
    return new Response('Tidak diizinkan. Masuk dulu ke /tuan, lalu buka Preview dari halaman edit.', { status: 401 })
  }
  if (!slug || (koleksi !== 'docs' && koleksi !== 'posts')) {
    return new Response('Parameter kurang.', { status: 400 })
  }

  ;(await draftMode()).enable()
  const dasar = koleksi === 'docs' ? '/panduan/' : '/blog/'
  redirect(`${dasar}${slug}${en ? '?lang=en' : ''}`)
}
