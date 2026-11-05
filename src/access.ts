import type { Access, CollectionBeforeChangeHook, FieldAccess, PayloadRequest } from 'payload'
import { APIError } from 'payload'
import { sesiTerverifikasi } from './lib/duafa'

type Pengguna = { id?: number | string; role?: string | null; twoFactorEnabled?: boolean | null } | null | undefined

/**
 * 2FA wajib: akun harus sudah mengaktifkan 2FA DAN sesi ini sudah lolos kode 2FA
 * (cookie pm-2fa). Tanpa itu, tidak bisa menulis apa pun lewat admin maupun REST API.
 */
const punya = (req: PayloadRequest, izin: string[]) => {
  const u = req.user as Pengguna
  return !!u?.twoFactorEnabled && izin.includes(u.role ?? '') && sesiTerverifikasi(req.headers?.get('cookie'))
}

export const apakahAdmin = (req: PayloadRequest) => punya(req, ['admin'])
export const penulis: Access = ({ req }) => punya(req, ['penulis', 'editor', 'admin'])
export const editor: Access = ({ req }) => punya(req, ['editor', 'admin'])
export const admin: Access = ({ req }) => punya(req, ['admin'])
export const login: Access = ({ req: { user } }) => !!user
export const adminField: FieldAccess = ({ req }) => punya(req, ['admin'])

/** Publik hanya melihat yang sudah terbit; pengguna admin melihat draf juga. */
export const terbitAtauLogin: Access = ({ req: { user } }) => (user ? true : { _status: { equals: 'published' } })

/** Penulis menyimpan draf dan mengirim review; hanya editor dan admin yang menerbitkan. */
export const cegahPenulisTerbit: CollectionBeforeChangeHook = ({ data, req }) => {
  if (req.user && data?._status === 'published' && !punya(req, ['editor', 'admin'])) {
    throw new APIError('Penulis tidak bisa menerbitkan. Centang "Kirim untuk review" lalu simpan draf.', 403)
  }
  return data
}
