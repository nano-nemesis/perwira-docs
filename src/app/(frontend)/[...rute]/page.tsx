import { alihkanAtau404 } from '@/lib/pengalih'

/** URL yang tidak dikenali: cek redirect URL lama, kalau tidak ada tampilkan 404. */
export default async function Pengalih({ params }: { params: Promise<{ rute: string[] }> }) {
  const { rute } = await params
  return alihkanAtau404(`/${rute.join('/')}`)
}
