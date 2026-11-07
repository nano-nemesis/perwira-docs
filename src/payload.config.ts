import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { BlocksFeature, CodeBlock, EXPERIMENTAL_TableFeature, FixedToolbarFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { editor } from './access'
import { Docs, Masukan, Media, PencarianGagal, Posts, Produk, Updates, Users } from './collections'
import { BAHASA_KODE } from './lib/markdown'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const situs = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

type DocSeo = { judul?: string; ringkasan?: string; slug?: string }

export default buildConfig({
  // panel admin di /tuan (bukan /admin bawaan)
  routes: { admin: '/tuan' },
  admin: {
    user: 'users',
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' | Admin PerwiraMedia Docs', icons: [{ url: '/icon.png' }] },
    components: {
      graphics: { Logo: '/components/admin/Merek#Logo', Icon: '/components/admin/Merek#Ikon' },
      beforeDashboard: ['/components/admin/Dasbor#Dasbor'],
      // bingkai bergaya situs publik: latar gradien + awan, tautan Dasbor, kartu ke situs (gaya di custom.scss)
      header: ['/components/admin/Bingkai#Latar'],
      beforeNavLinks: ['/components/admin/Bingkai#TautanDasbor'],
      afterNavLinks: ['/components/admin/Bingkai#KeSitus'],
      actions: ['/components/admin/Bingkai#TombolTema'],
    },
  },
  localization: {
    locales: [
      { label: 'Indonesia', code: 'id' },
      { label: 'English', code: 'en' },
    ],
    defaultLocale: 'id',
    fallback: true,
  },
  collections: [Docs, Posts, Produk, Updates, Media, PencarianGagal, Masukan, Users],
  endpoints: [
    {
      // Analisis SEO (mesin Yoast) untuk panel di admin. Hanya untuk pengguna admin yang sudah login.
      path: '/seo-analisis',
      method: 'post',
      handler: async (req) => {
        if (!req.user) return Response.json({ galat: 'Login dulu.' }, { status: 401 })
        const b = (await req.json?.()) ?? {}
        const { analisisSeo } = await import('./lib/seo')
        const { convertLexicalToHTML } = await import('@payloadcms/richtext-lexical/html')
        const esc = (x: unknown) => String(x ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] as string)
        type Langkah = { judul?: string; isi?: string; perintah?: string; gambar?: unknown }
        type Simpul = { type?: string; value?: unknown; children?: Simpul[] }
        // form admin hanya mengirim id Media (gambar langkah & node upload di konten); ambil alt-nya supaya Yoast melihat gambarnya
        const idMedia = (v: unknown) => (typeof v === 'object' && v ? (v as { id?: number }).id : (v as number | undefined))
        const ids = new Set<number>()
        for (const l of (b.langkah ?? []) as Langkah[]) if (idMedia(l.gambar)) ids.add(idMedia(l.gambar) as number)
        const kumpul = (n?: Simpul) => {
          if (n?.type === 'upload' && idMedia(n.value)) ids.add(idMedia(n.value) as number)
          n?.children?.forEach(kumpul)
        }
        kumpul(b.konten?.root)
        const media = ids.size ? (await req.payload.find({ collection: 'media', where: { id: { in: [...ids] } }, limit: ids.size, depth: 0, locale: b.locale })).docs : []
        const img = (v: unknown) => {
          const m = media.find((x) => x.id === idMedia(v))
          return m ? `<img src="${esc(m.url)}" alt="${esc(m.alt)}">` : ''
        }
        let html = b.ringkasan ? `<p>${esc(b.ringkasan)}</p>` : ''
        for (const l of (b.langkah ?? []) as Langkah[]) {
          html += `<h2>${esc(l.judul)}</h2>`
          if (l.isi) html += `<p>${esc(l.isi)}</p>`
          html += img(l.gambar)
          if (l.perintah) html += `<pre>${esc(l.perintah)}</pre>`
        }
        if (b.konten?.root)
          html += convertLexicalToHTML({
            data: b.konten,
            disableContainer: true,
            converters: ({ defaultConverters }) => ({
              ...defaultConverters,
              upload: ({ node }: { node: Simpul }) => img(node.value),
              blocks: { Code: ({ node }: { node: unknown }) => `<pre>${esc((node as { fields?: { code?: string } }).fields?.code)}</pre>` },
            }),
          })
        const hasil = await analisisSeo({ keyphrase: b.fokusKeyphrase || '', title: b.title || '', description: b.description || '', slug: b.slug || '', permalink: `${situs}/${b.jenis === 'docs' ? 'panduan' : 'blog'}/${b.slug || ''}`, html, locale: b.locale })
        return Response.json(hasil)
      },
    },
  ],
  // Markdown: pintasan ketik bawaan Lexical + blok kode ``` (impor/ekspor Markdown dua arah, lihat src/lib/format.ts)
  editor: lexicalEditor({
    // toolbar tetap di atas kotak tulis supaya tombol format (judul, tebal, daftar, kode) selalu kelihatan
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      FixedToolbarFeature(),
      BlocksFeature({ blocks: [CodeBlock({ languages: BAHASA_KODE, defaultLanguage: 'routeros' })] }),
      // tabel: bisa dibuat di editor dan dari Markdown (| a | b |), tampil sebagai <table> di situs
      EXPERIMENTAL_TableFeature(),
    ],
  }),
  graphQL: { disable: true },
  secret: process.env.PAYLOAD_SECRET || '',
  serverURL: situs,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: sqliteAdapter({ client: { url: process.env.DATABASE_URL || 'file:./payload.db' }, wal: true }),
  sharp,
  // Email (reset password) lewat SMTP. Tanpa SMTP_HOST, isi email hanya dicetak ke log server.
  email: process.env.SMTP_HOST
    ? nodemailerAdapter({
        defaultFromAddress: process.env.SMTP_FROM || 'noreply@perwiramedia.com',
        defaultFromName: 'PerwiraMedia Docs',
        transportOptions: {
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT || 587),
          secure: Number(process.env.SMTP_PORT) === 465,
          auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
        },
      })
    : undefined,
  // menjalankan "jadwal terbit" (schedulePublish) setiap menit
  jobs: { autoRun: [{ cron: '* * * * *', queue: 'default' }] },
  plugins: [
    seoPlugin({
      collections: ['docs', 'posts'],
      uploadsCollection: 'media',
      tabbedUI: true,
      generateTitle: ({ doc }) => `${(doc as DocSeo)?.judul ?? ''} | PerwiraMedia Docs`,
      generateDescription: ({ doc }) => (doc as DocSeo)?.ringkasan ?? '',
      generateURL: ({ doc, collectionSlug }) =>
        `${situs}/${collectionSlug === 'docs' ? 'panduan' : 'blog'}/${(doc as DocSeo)?.slug ?? ''}`,
    }),
    redirectsPlugin({
      collections: ['docs', 'posts'],
      redirectTypes: ['301', '302'],
      overrides: { admin: { group: 'SEO' }, access: { create: editor, update: editor, delete: editor } },
    }),
  ],
})
