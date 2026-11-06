// Versi panduan ala GitHub: tiap versi adalah dokumen docs tersendiri.
// Satu "grup versi" = dokumen induk (versi pertama) + semua anak yang menunjuk ke sana lewat `induk`.
// Versi terbaru = nomor `versi` tertinggi dalam grup. Versi lama tetap bisa dibuka.

type Id = number | string
type DocVersi = { id: Id; versi?: string | null; induk?: Id | { id: Id } | null }

/** Id grup versi: induk kalau ini versi turunan, kalau tidak dirinya sendiri (versi pertama). */
export const grupVersi = (d: DocVersi): Id =>
  (d.induk ? (typeof d.induk === 'object' ? d.induk.id : d.induk) : null) ?? d.id

/** true kalau versi a lebih baru dari b. 'numeric' membuat 2.10 > 2.9 (bukan perbandingan string biasa). */
export const lebihBaru = (a?: string | null, b?: string | null) =>
  (a || '0').localeCompare(b || '0', undefined, { numeric: true }) > 0

/** Dari daftar docs, sisakan satu per grup: yang versinya paling baru. */
export function hanyaTerbaru<T extends DocVersi>(docs: T[]): T[] {
  const per = new Map<Id, T>()
  for (const d of docs) {
    const g = grupVersi(d)
    const ada = per.get(g)
    if (!ada || lebihBaru(d.versi, ada.versi)) per.set(g, d)
  }
  return docs.filter((d) => per.get(grupVersi(d)) === d)
}
