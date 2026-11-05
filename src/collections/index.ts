import { APIError, type CollectionConfig, type Field } from 'payload'
import { admin, adminField, apakahAdmin, cegahPenulisTerbit, editor, login, penulis, terbitAtauLogin } from '../access'
import { endpointFormat } from '../lib/format'

const tersembunyi = { hidden: true } as const

/** Isi email reset password. Tautan berlaku 1 jam; 2FA tetap diminta setelah password diganti. */
const emailReset = (url: string) => `<!doctype html><html><body style="margin:0;background:#f3f7ff;font-family:Inter,Arial,sans-serif;color:#0f1b33">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border-radius:16px;overflow:hidden">
<tr><td style="height:4px;background:linear-gradient(90deg,#0084ff,#ff8000,#ff0000)"></td></tr>
<tr><td style="padding:32px">
<h1 style="margin:0 0 12px;font-size:20px">Reset password</h1>
<p style="margin:0 0 20px;line-height:1.6">Ada permintaan reset password untuk akun Admin PerwiraMedia Docs kamu. Klik tombol di bawah untuk membuat password baru. Tautan ini berlaku 1 jam.</p>
<p style="margin:0 0 24px"><a href="${url}" style="display:inline-block;background:#1b5fe0;color:#fff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:10px">Buat password baru</a></p>
<p style="margin:0 0 8px;font-size:13px;color:#5b6b85;line-height:1.6">Kalau tombol tidak bisa diklik, salin tautan ini:<br><a href="${url}" style="color:#1b5fe0;word-break:break-all">${url}</a></p>
<p style="margin:16px 0 0;font-size:13px;color:#5b6b85;line-height:1.6">Bukan kamu yang meminta? Abaikan email ini, password kamu tidak berubah.</p>
</td></tr></table></td></tr></table></body></html>`

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Pengguna', plural: 'Pengguna' },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 8 * 60 * 60,
    forgotPassword: {
      expiration: 60 * 60 * 1000,
      generateEmailSubject: () => 'Reset password Admin PerwiraMedia Docs',
      generateEmailHTML: (args) => emailReset(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/tuan/reset/${args?.token}`),
    },
  },
  admin: { useAsTitle: 'email', defaultColumns: ['name', 'email', 'role', 'twoFactorEnabled'], group: 'Akun' },
  access: {
    read: login,
    create: admin,
    delete: admin,
    // pengguna boleh mengubah nama dan password sendiri; sisanya admin
    update: ({ req, id }) => req.user?.id === id || apakahAdmin(req),
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req, originalDoc }) => {
        // pengguna pertama (lewat /tuan/create-first-user) otomatis jadi admin
        if (operation === 'create' && (await req.payload.count({ collection: 'users' })).totalDocs === 0) data.role = 'admin'
        // akun baru selalu mulai tanpa 2FA; aktivasi hanya lewat /verifikasi-2fa (first-register melewati akses field)
        if (operation === 'create') Object.assign(data, { twoFactorEnabled: false, totpSecret: null, kodeCadangan: null, gagal2fa: 0, kunci2faSampai: null })
        // admin mereset 2FA: hapus rahasia supaya pengguna mengaktifkan ulang
        if (data.twoFactorEnabled === false) Object.assign(data, { totpSecret: null, kodeCadangan: null })
        // 2FA hanya boleh menyala bersama rahasianya (dari /verifikasi-2fa); kalau tidak, pemilik akun terkunci
        if (data.twoFactorEnabled === true && !originalDoc?.twoFactorEnabled && !data.totpSecret) data.twoFactorEnabled = false
        return data
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', label: 'Nama' },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'penulis',
      options: [
        { label: 'Penulis', value: 'penulis' },
        { label: 'Editor', value: 'editor' },
        { label: 'Admin', value: 'admin' },
      ],
      access: { update: adminField },
      admin: { description: 'Penulis menulis draf, editor menerbitkan, admin mengelola pengguna dan redirect.' },
    },
    {
      name: 'twoFactorEnabled',
      type: 'checkbox',
      label: '2FA aktif',
      defaultValue: false,
      access: { create: () => false, update: adminField },
      admin: { description: 'Diaktifkan sendiri oleh pengguna di /verifikasi-2fa. Admin bisa mematikannya untuk mereset 2FA.' },
    },
    { name: 'totpSecret', type: 'text', admin: tersembunyi, access: { read: () => false, create: () => false, update: () => false } },
    { name: 'kodeCadangan', type: 'json', admin: tersembunyi, access: { read: () => false, create: () => false, update: () => false } },
    { name: 'gagal2fa', type: 'number', defaultValue: 0, admin: tersembunyi, access: { read: () => false, create: () => false, update: () => false } },
    { name: 'kunci2faSampai', type: 'date', admin: tersembunyi, access: { read: () => false, create: () => false, update: () => false } },
  ],
}

const versi = { drafts: { autosave: true, schedulePublish: true }, maxPerDoc: 50 }

const slug: Field = {
  name: 'slug',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  admin: { position: 'sidebar', description: 'Bagian URL, huruf kecil dan tanda hubung.' },
}

const video: Field = {
  name: 'video',
  type: 'text',
  admin: { description: 'Tautan YouTube (opsional). Kosongkan kalau tidak ada video, kotaknya otomatis tidak tampil.' },
}

const review: Field = {
  name: 'perluReview',
  type: 'checkbox',
  label: 'Kirim untuk review',
  admin: { position: 'sidebar', description: 'Penulis mencentang ini, editor yang menerbitkan.' },
}

const aksesKonten = { read: terbitAtauLogin, create: penulis, update: penulis, delete: editor }

/** Impor (di atas daftar) dan ekspor .md/.html/.json/brief video (di bar simpan). Logikanya di src/lib/format.ts. */
const tombolFormat = (koleksi: 'docs' | 'posts') => ({
  beforeListTable: [{ path: '/components/admin/Format#Impor', clientProps: { koleksi } }],
  edit: { beforeDocumentControls: ['/components/admin/Format#Ekspor'] },
})

const IKON = ['awan', 'lapis', 'wifi', 'kartu', 'kunci', 'roket', 'headset', 'info', 'pena', 'jam', 'cari', 'rumah']

/** Kategori produk (PerwiraCloud, PerwiraRadius, dst.). Tambah di admin, langsung muncul di beranda, menu samping, dan filter changelog. */
export const Produk: CollectionConfig = {
  slug: 'produk',
  labels: { singular: 'Kategori produk', plural: 'Kategori produk' },
  admin: { useAsTitle: 'nama', defaultColumns: ['nama', 'slug', 'warna', 'urutan'], group: 'Konten' },
  access: { read: () => true, create: editor, update: editor, delete: admin },
  defaultSort: 'urutan',
  hooks: {
    beforeDelete: [
      async ({ req, id }) => {
        const { totalDocs } = await req.payload.count({ collection: 'docs', where: { produk: { equals: id } }, req })
        if (totalDocs) throw new APIError(`Masih ada ${totalDocs} halaman docs di kategori ini. Pindahkan dulu ke kategori lain.`, 400, null, true)
      },
    ],
  },
  fields: [
    { name: 'nama', type: 'text', required: true },
    slug,
    { name: 'deskripsi', type: 'textarea', localized: true, admin: { description: 'Satu kalimat di kartu beranda dan halaman panduan.' } },
    { name: 'ikon', type: 'select', required: true, defaultValue: 'lapis', options: IKON, admin: { position: 'sidebar' } },
    {
      name: 'warna',
      type: 'select',
      required: true,
      defaultValue: 'biru',
      options: [
        { label: 'Biru', value: 'biru' },
        { label: 'Oranye', value: 'oranye' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'urutan', type: 'number', defaultValue: 100, admin: { position: 'sidebar', description: 'Angka kecil tampil lebih dulu.' } },
  ],
}

export const Docs: CollectionConfig = {
  slug: 'docs',
  labels: { singular: 'Halaman docs', plural: 'Halaman docs' },
  admin: { useAsTitle: 'judul', defaultColumns: ['kode', 'judul', 'produk', '_status', 'updatedAt'], group: 'Konten', components: tombolFormat('docs') },
  access: aksesKonten,
  endpoints: endpointFormat('docs'),
  versions: versi,
  hooks: { beforeChange: [cegahPenulisTerbit] },
  fields: [
    { name: 'judul', type: 'text', required: true, localized: true },
    slug,
    {
      name: 'kode',
      type: 'text',
      required: true,
      unique: true,
      admin: { position: 'sidebar', description: 'Contoh CLD-014. CS mengutip kode ini saat membalas tiket.' },
    },
    { name: 'produk', type: 'relationship', relationTo: 'produk', required: true, label: 'Kategori produk', admin: { position: 'sidebar' } },
    { name: 'urutan', type: 'number', defaultValue: 100, admin: { position: 'sidebar' } },
    review,
    { name: 'ringkasan', type: 'textarea', localized: true },
    video,
    {
      name: 'langkah',
      type: 'array',
      localized: true,
      labels: { singular: 'Langkah', plural: 'Langkah' },
      fields: [
        { name: 'judul', type: 'text', required: true },
        { name: 'isi', type: 'textarea' },
        { name: 'perintah', type: 'code', admin: { language: 'shell', description: 'Perintah RouterOS (opsional).' } },
      ],
    },
    { name: 'konten', type: 'richText', localized: true },
  ],
}

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Tulisan blog', plural: 'Tulisan blog' },
  admin: { useAsTitle: 'judul', defaultColumns: ['judul', 'kategori', '_status', 'terbitPada'], group: 'Konten', components: tombolFormat('posts') },
  access: aksesKonten,
  endpoints: endpointFormat('posts'),
  versions: versi,
  hooks: { beforeChange: [cegahPenulisTerbit] },
  fields: [
    { name: 'judul', type: 'text', required: true, localized: true },
    slug,
    { name: 'kategori', type: 'text', admin: { position: 'sidebar' } },
    { name: 'terbitPada', type: 'date', admin: { position: 'sidebar' }, defaultValue: () => new Date().toISOString() },
    { name: 'penulis', type: 'relationship', relationTo: 'users', admin: { position: 'sidebar' } },
    review,
    { name: 'ringkasan', type: 'textarea', localized: true },
    { name: 'sampul', type: 'upload', relationTo: 'media' },
    video,
    { name: 'konten', type: 'richText', localized: true },
  ],
}

export const Updates: CollectionConfig = {
  slug: 'updates',
  labels: { singular: 'Changelog', plural: 'Changelog' },
  admin: { useAsTitle: 'judul', defaultColumns: ['versi', 'judul', 'tanggal'], group: 'Konten' },
  access: { read: () => true, create: editor, update: editor, delete: editor },
  defaultSort: '-tanggal',
  fields: [
    { name: 'versi', type: 'text', required: true },
    { name: 'tanggal', type: 'date', required: true },
    { name: 'judul', type: 'text', required: true, localized: true },
    {
      name: 'item',
      type: 'array',
      localized: true,
      fields: [
        { name: 'jenis', type: 'select', required: true, options: ['Baru', 'Diperbarui', 'Perbaikan'] },
        { name: 'produk', type: 'relationship', relationTo: 'produk', label: 'Kategori produk' },
        { name: 'teks', type: 'text', required: true },
      ],
    },
  ],
}

export const Media: CollectionConfig = {
  slug: 'media',
  admin: { group: 'Konten' },
  access: { read: () => true, create: penulis, update: penulis, delete: editor },
  upload: { mimeTypes: ['image/*'] },
  fields: [
    { name: 'alt', type: 'text', required: true, localized: true },
    { name: 'kredit', type: 'text', admin: { description: 'Untuk foto dari luar: pembuat dan lisensinya.' } },
  ],
}

/** Kata yang dicari pembaca tapi tidak menemukan hasil. Diisi otomatis oleh /api/cari. */
export const PencarianGagal: CollectionConfig = {
  slug: 'pencarian-gagal',
  labels: { singular: 'Pencarian tanpa hasil', plural: 'Pencarian tanpa hasil' },
  admin: { useAsTitle: 'q', defaultColumns: ['q', 'jumlah', 'updatedAt'], group: 'Wawasan' },
  access: { read: login, create: () => false, update: editor, delete: editor },
  defaultSort: '-jumlah',
  fields: [
    { name: 'q', type: 'text', required: true, unique: true, label: 'Kata kunci' },
    { name: 'jumlah', type: 'number', defaultValue: 1 },
  ],
}

/** Jawaban "Apakah panduan ini membantu?". Diisi oleh /api/masukan. */
export const Masukan: CollectionConfig = {
  slug: 'masukan',
  labels: { singular: 'Masukan pembaca', plural: 'Masukan pembaca' },
  admin: { defaultColumns: ['doc', 'membantu', 'catatan', 'createdAt'], group: 'Wawasan' },
  access: { read: login, create: () => false, update: editor, delete: editor },
  fields: [
    { name: 'doc', type: 'relationship', relationTo: 'docs' },
    { name: 'membantu', type: 'checkbox' },
    { name: 'catatan', type: 'textarea' },
  ],
}
