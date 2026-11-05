import { convertHTMLToLexical, convertLexicalToMarkdown, convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import type { Endpoint, PayloadRequest, RichTextField } from 'payload'
import { ambilJudul, ambilLangkah, briefVideo, jadiSlug, pisahFrontmatter, rapikanPagar, susunFrontmatter, susunLangkah, type Langkah } from './markdown'
import { SITUS, WA } from './situs'

/**
 * Impor dan ekspor docs/blog. Endpoint:
 *   POST /api/{docs|posts}/impor          body { nama, isi } dari .md/.markdown/.txt/.html/.htm/.json, disimpan sebagai draf
 *   GET  /api/{docs|posts}/:id/ekspor     ?format=md|html|json|video &locale=id|en
 * Akses tetap lewat aturan koleksi (overrideAccess: false + req), jadi 2FA dan peran ikut berlaku.
 */

type Jenis = 'docs' | 'posts'
type Data = Record<string, unknown>
type Lexical = Parameters<typeof convertLexicalToMarkdown>[0]['data']

// konfigurasi editor diambil dari field konten itu sendiri (termasuk blok kode), bukan fitur bawaan
const editorDari = async (req: PayloadRequest, jenis: Jenis) =>
  editorConfigFactory.fromField({ field: req.payload.collections[jenis].config.flattenedFields.find((f) => f.name === 'konten') as RichTextField })

// field yang boleh datang dari luar, plus nama padanannya di Hugo/Jekyll/WordPress
const FIELD: Record<Jenis, string[]> = {
  docs: ['judul', 'slug', 'kode', 'produk', 'urutan', 'ringkasan', 'video'],
  posts: ['judul', 'slug', 'kategori', 'terbitPada', 'ringkasan', 'video'],
}
const ALIAS: Record<string, string> = { title: 'judul', description: 'ringkasan', summary: 'ringkasan', excerpt: 'ringkasan', date: 'terbitPada', category: 'kategori', youtube: 'video' }

const galat = (pesan: string, status = 400) => Response.json({ galat: pesan }, { status })
const escape = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

function saring(sumber: Data, jenis: Jenis) {
  const data: Data = {}
  for (const [k, v] of Object.entries(sumber)) {
    const kunci = ALIAS[k] ?? k
    if (FIELD[jenis].includes(kunci) && v !== '' && v != null) data[kunci] = v
  }
  return data
}

/** Kembalikan blok kode lexical (CodeBlock) ke HTML, di luar itu pakai konverter bawaan. */
const keHtml = (data: Lexical) =>
  convertLexicalToHTML({
    data,
    disableContainer: true,
    converters: ({ defaultConverters }) => ({
      ...defaultConverters,
      blocks: { Code: ({ node }: { node: unknown }) => `<pre><code>${escape(String((node as { fields: { code?: string } }).fields.code ?? ''))}</code></pre>` },
    }),
  })

async function impor(req: PayloadRequest, jenis: Jenis) {
  if (!req.user) return galat('Login dulu.', 401)
  const { nama = 'tempel.md', isi = '' } = ((await req.json?.()) ?? {}) as { nama?: string; isi?: string }
  if (!isi.trim()) return galat('Isi berkas kosong.')
  if (isi.length > 2_000_000) return galat('Berkas lebih dari 2 MB.')
  const ext = nama.toLowerCase().split('.').pop()
  const editorConfig = await editorDari(req, jenis)
  let data: Data
  let locale: 'id' | 'en' = 'id'

  try {
    if (ext === 'json') {
      const j = JSON.parse(isi) as Data
      data = saring(j, jenis)
      if (Array.isArray(j.langkah) && jenis === 'docs') data.langkah = j.langkah
      if ((j.konten as { root?: unknown })?.root) data.konten = j.konten
      if (j.bahasa === 'en') locale = 'en'
    } else if (ext === 'html' || ext === 'htm') {
      const { Window } = await import('happy-dom')
      const teks = (s?: string) => s?.replace(/<[^>]+>/g, '').trim()
      const h1 = isi.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
      const badan = (isi.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? isi).replace(h1?.[0] ?? '\u0000', '')
      // convertHTMLToLexical meminta kelas mirip JSDOM; happy-dom sudah terpasang bersama editor Lexical
      class Dom {
        window: { document: Document }
        constructor(html: string) {
          const w = new Window()
          w.document.body.innerHTML = html
          this.window = w as unknown as { document: Document }
        }
      }
      data = { judul: teks(h1?.[1]) || teks(isi.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]), konten: convertHTMLToLexical({ editorConfig, html: badan, JSDOM: Dom }) }
    } else if (ext === 'md' || ext === 'markdown' || ext === 'txt') {
      const { meta, isi: badan } = pisahFrontmatter(isi)
      const { judul, sisa } = ambilJudul(badan)
      const { langkah, sisa: konten } = jenis === 'docs' ? ambilLangkah(sisa) : { langkah: [] as Langkah[], sisa: sisa.trim() }
      data = { judul, ...saring(meta, jenis) }
      if (langkah.length) data.langkah = langkah
      if (konten) data.konten = convertMarkdownToLexical({ editorConfig, markdown: rapikanPagar(konten) })
      if (meta.bahasa === 'en') locale = 'en'
    } else return galat('Format belum didukung. Pakai .md, .markdown, .txt, .html, atau .json.')
  } catch (e) {
    return galat(`Berkas tidak bisa dibaca: ${(e as Error).message}`)
  }

  if (!data.judul) return galat('Judul tidak ditemukan. Isi frontmatter "judul:" atau baris pertama "# Judul".')
  data.slug = jadiSlug(String(data.slug || data.judul))
  if (data.urutan !== undefined) data.urutan = Number(data.urutan) || 100

  // kategori produk boleh ditulis sebagai slug (perwiracloud) atau id
  if (jenis === 'docs' && data.produk !== undefined) {
    const p = String(data.produk)
    const ketemu = await req.payload.find({ collection: 'produk', where: { or: [{ slug: { equals: p } }, ...(/^\d+$/.test(p) ? [{ id: { equals: Number(p) } }] : [])] }, limit: 1, depth: 0, req })
    if (!ketemu.docs[0]) return galat(`Kategori produk "${p}" tidak ada. Pakai slug kategori, misalnya perwiracloud.`)
    data.produk = ketemu.docs[0].id
  }

  try {
    const lama = (await req.payload.find({ collection: jenis, where: { slug: { equals: data.slug } }, draft: true, limit: 1, depth: 0, req, overrideAccess: false })).docs[0]
    if (!lama && jenis === 'docs') {
      // dua field wajib docs diisi sementara; penulis merapikannya sebelum minta review
      data.kode ??= `DRAF-${Date.now().toString(36).toUpperCase()}`
      data.produk ??= (await req.payload.find({ collection: 'produk', sort: 'urutan', limit: 1, depth: 0, req })).docs[0]?.id
    }
    const opsi = { collection: jenis, data: { ...data, _status: 'draft' as const }, draft: true, locale, req, overrideAccess: false }
    // slug yang sudah ada diperbarui sebagai draf baru; versi lama tetap di riwayat versi
    const hasil = (lama ? await req.payload.update({ ...opsi, id: lama.id }) : await req.payload.create(opsi as never)) as { id: number | string; judul?: string; slug?: string }
    return Response.json({ id: hasil.id, judul: hasil.judul, slug: hasil.slug, aksi: lama ? 'diperbarui' : 'dibuat' })
  } catch (e) {
    const err = e as Error & { status?: number; data?: { errors?: { message: string; path: string }[] } }
    const rinci = err.data?.errors?.map((x) => `${x.path}: ${x.message}`).join(', ')
    return galat(rinci || err.message, err.status && err.status < 500 ? err.status : 400)
  }
}

async function ekspor(req: PayloadRequest, jenis: Jenis) {
  const format = req.searchParams.get('format') ?? 'md'
  const locale = req.searchParams.get('locale') === 'en' ? 'en' : 'id'
  let doc: Data
  try {
    doc = (await req.payload.findByID({ collection: jenis, id: String(req.routeParams?.id), draft: true, depth: 1, locale, req, overrideAccess: false })) as unknown as Data
  } catch {
    return galat('Dokumen tidak ditemukan atau kamu tidak punya akses.', 404)
  }
  const editorConfig = await editorDari(req, jenis)
  const konten = doc.konten as Lexical | undefined
  const kontenMd = konten ? convertLexicalToMarkdown({ data: konten, editorConfig }).trim() : ''
  const langkah = ((doc.langkah as Langkah[] | undefined) ?? []).map(({ judul, isi, perintah }) => ({ judul, isi, perintah }))
  const produk = doc.produk as { slug?: string; nama?: string } | null
  const judul = String(doc.judul ?? '')
  const url = `${SITUS}/${jenis === 'docs' ? 'panduan' : 'blog'}/${doc.slug}${locale === 'en' ? '?lang=en' : ''}`
  const meta =
    jenis === 'docs'
      ? { jenis, bahasa: locale, judul, slug: doc.slug, kode: doc.kode, produk: produk?.slug, urutan: doc.urutan, ringkasan: doc.ringkasan, video: doc.video }
      : { jenis, bahasa: locale, judul, slug: doc.slug, kategori: doc.kategori, terbitPada: doc.terbitPada, ringkasan: doc.ringkasan, video: doc.video }

  let isi: string, tipe: string, nama: string
  if (format === 'json') {
    isi = JSON.stringify({ ...meta, langkah: jenis === 'docs' ? langkah : undefined, konten }, null, 2)
    ;[tipe, nama] = ['application/json', `${doc.slug}.json`]
  } else if (format === 'html') {
    const daftar = langkah.length
      ? `<h2>Langkah</h2>\n<ol>${langkah.map((l) => `<li><h3>${escape(l.judul)}</h3>${l.isi ? `<p>${escape(l.isi)}</p>` : ''}${l.perintah ? `<pre><code>${escape(l.perintah)}</code></pre>` : ''}</li>`).join('')}</ol>\n`
      : ''
    isi = `<!doctype html>\n<html lang="${locale}">\n<head><meta charset="utf-8"><title>${escape(judul)}</title></head>\n<body>\n<h1>${escape(judul)}</h1>\n${doc.ringkasan ? `<p><em>${escape(String(doc.ringkasan))}</em></p>\n` : ''}${daftar}${konten ? keHtml(konten) : ''}\n</body>\n</html>\n`
    ;[tipe, nama] = ['text/html', `${doc.slug}.html`]
  } else if (format === 'video') {
    isi = briefVideo({ jenis, judul, url, kode: doc.kode as string, produk: produk?.nama, ringkasan: doc.ringkasan as string, video: doc.video as string, langkah, kontenMd, bahasa: locale, wa: WA })
    ;[tipe, nama] = ['text/markdown', `${doc.slug}-brief-video.md`]
  } else {
    isi = `${susunFrontmatter(meta)}\n# ${judul}\n\n${susunLangkah(langkah)}${kontenMd}\n`
    ;[tipe, nama] = ['text/markdown', `${doc.slug}.md`]
  }
  return new Response(isi, { headers: { 'content-type': `${tipe}; charset=utf-8`, 'content-disposition': `attachment; filename="${nama}"`, 'cache-control': 'no-store' } })
}

export const endpointFormat = (jenis: Jenis): Endpoint[] => [
  { path: '/impor', method: 'post', handler: (req) => impor(req, jenis) },
  { path: '/:id/ekspor', method: 'get', handler: (req) => ekspor(req, jenis) },
]
