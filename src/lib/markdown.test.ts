import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ambilJudul, ambilLangkah, briefVideo, jadiSlug, pisahFrontmatter, rapikanPagar, susunFrontmatter, susunLangkah } from './markdown.ts'

test('frontmatter bolak-balik aman untuk titik dua dan tanda kutip', () => {
  const meta = { judul: 'VPN: L2TP "cepat"', slug: 'vpn-l2tp', kosong: '' }
  const { meta: m, isi } = pisahFrontmatter(susunFrontmatter(meta) + '\nIsi')
  assert.deepEqual(m, { judul: 'VPN: L2TP "cepat"', slug: 'vpn-l2tp' })
  assert.equal(isi.trim(), 'Isi')
  assert.deepEqual(pisahFrontmatter("---\r\ntitle: 'Halo'\r\n---\r\nX").meta, { title: 'Halo' })
  assert.deepEqual(pisahFrontmatter('tanpa frontmatter').meta, {})
})

test('langkah bolak-balik, ## di dalam blok kode tidak memutus bagian', () => {
  const langkah = [
    { judul: 'Tambah IP', isi: 'Buka terminal.', perintah: '/ip address add address=10.0.0.1/24\n## bukan judul' },
    { judul: 'Cek', isi: null, perintah: null },
  ]
  const md = `Pembuka.\n\n${susunLangkah(langkah)}## Penjelasan\n\nTeks akhir.`
  const hasil = ambilLangkah(md)
  assert.deepEqual(hasil.langkah, langkah)
  assert.equal(hasil.sisa, 'Pembuka.\n\n## Penjelasan\n\nTeks akhir.')
  assert.deepEqual(ambilLangkah('Tanpa langkah').langkah, [])
})

test('judul dari # pertama, slug, dan bahasa blok kode', () => {
  assert.deepEqual(ambilJudul('\n# Setting PPPoE\n\nIsi'), { judul: 'Setting PPPoE', sisa: 'Isi' })
  assert.equal(ambilJudul('Isi saja').judul, undefined)
  assert.equal(jadiSlug('  Upgrade CHR ke v7.16: Mudah!  '), 'upgrade-chr-ke-v7-16-mudah')
  assert.equal(rapikanPagar('```bash\nls\n```\n```cobol\nx\n```\n```\ny\n```'), '```shell\nls\n```\n```plaintext\nx\n```\n```\ny\n```')
})

test('brief video memuat tugas, perintah persis, dan sumber', () => {
  const md = briefVideo({ jenis: 'docs', judul: 'Tes', url: 'https://x/panduan/tes', kode: 'CLD-1', langkah: [{ judul: 'A', perintah: '/system reboot' }], kontenMd: 'Isi.', bahasa: 'id', wa: '62851' })
  assert.match(md, /^---\ntipe: "brief-video-short"/)
  assert.match(md, /\/system reboot/)
  assert.match(md, /https:\/\/x\/panduan\/tes \(kode CLD-1\)/)
})
