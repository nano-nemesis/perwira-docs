import { ipKlien, lolosBatas, terlaluBanyak } from '@/lib/batas'
import { getPayload } from '@/lib/payload'

/** Menyimpan jawaban "Apakah panduan ini membantu?". Publik, jadi dibatasi lajunya dan docId wajib benar-benar ada. */
export async function POST(req: Request) {
  if (!lolosBatas(`masukan:${ipKlien(req)}`, 10, 60_000)) return terlaluBanyak()

  const body = await req.json().catch(() => null)
  const docId = Number(body?.docId)
  if (!Number.isInteger(docId) || docId <= 0) return Response.json({ ok: false }, { status: 400 })

  const payload = await getPayload()
  // docId harus menunjuk panduan yang ada; tanpa cek ini, docId asal membuat error 500 dan relasi gantung
  const doc = await payload.findByID({ collection: 'docs', id: docId, depth: 0 }).catch(() => null)
  if (!doc) return Response.json({ ok: false }, { status: 400 })

  await payload.create({
    collection: 'masukan',
    data: { doc: docId, membantu: body?.membantu === true, catatan: String(body?.catatan ?? '').slice(0, 1000) },
  })
  return Response.json({ ok: true })
}
