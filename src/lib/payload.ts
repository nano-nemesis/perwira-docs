import config from '@payload-config'
import { getPayload as ambilPayload } from 'payload'
import { cache } from 'react'
import type { Lang, Merek, Nada } from './situs'

export const getPayload = () => ambilPayload({ config })

/**
 * Opsi wajib untuk query halaman publik. Local API Payload default-nya mode admin (overrideAccess: true),
 * jadi tanpa ini draf yang belum terbit ikut tampil (contoh: tautan /blog/null). Dengan ini aturan baca
 * koleksi berlaku: pengunjung hanya melihat yang sudah terbit.
 */
export const publik = { overrideAccess: false } as const

export type InfoProduk = { id: number; slug: string; nama: string; nada: Nada; ikon: string; ket: string; merek: Merek }

/** Kategori produk dari admin, urut sesuai kolom "urutan". Di-cache per request. */
export const ambilProduk = cache(async (lang: Lang): Promise<InfoProduk[]> => {
  const payload = await getPayload()
  const { docs } = await payload.find({ collection: 'produk', locale: lang, limit: 100, depth: 0, sort: 'urutan', ...publik })
  return docs.map((p) => ({ id: p.id, slug: p.slug, nama: p.nama, nada: p.warna, ikon: p.ikon, ket: p.deskripsi ?? '', merek: p.merek }))
})
