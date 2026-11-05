/**
 * Rate limit sederhana per IP untuk endpoint publik yang menulis ke database
 * (pencarian yang mencatat kata tanpa hasil, dan masukan pembaca). Tanpa ini, siapa pun
 * tanpa login bisa membanjiri tabel dan mengotori dasbor admin.
 *
 * ponytail: penghitung di memori proses. Cukup untuk satu instance (deploy saat ini satu VPS).
 * Kalau nanti berjalan multi-instance atau di belakang beberapa worker, pindah ke Redis.
 */

type Jendela = { sampai: number; sisa: number }
const peta = new Map<string, Jendela>()

/** Ambil IP klien dari header proxy; untuk lokal/tanpa proxy pakai satu ember bersama. */
export function ipKlien(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip')?.trim() || 'lokal'
}

/** true kalau permintaan masih di bawah batas. maks permintaan per jendela (ms). */
export function lolosBatas(kunci: string, maks: number, jendelaMs: number): boolean {
  const now = Date.now()
  const j = peta.get(kunci)
  if (!j || now > j.sampai) {
    peta.set(kunci, { sampai: now + jendelaMs, sisa: maks - 1 })
    // bersihkan entri kedaluwarsa sesekali supaya peta tidak tumbuh tanpa batas
    if (peta.size > 5000) for (const [k, v] of peta) if (now > v.sampai) peta.delete(k)
    return true
  }
  if (j.sisa <= 0) return false
  j.sisa--
  return true
}

/** Jawaban 429 standar. */
export const terlaluBanyak = () => Response.json({ galat: 'Terlalu banyak permintaan. Coba lagi sebentar.' }, { status: 429, headers: { 'retry-after': '60' } })
