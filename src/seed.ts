/**
 * Isi awal untuk mencoba situs: `npm run seed`. Aman diulang (data dengan slug yang sama dilewati).
 * Semua isi di sini contoh dan perlu dicek ulang sebelum dipakai di produksi.
 */
import config from '@payload-config'
import path from 'path'
import { getPayload } from 'payload'
import { fileURLToPath } from 'url'

const payload = await getPayload({ config })
const dirname = path.dirname(fileURLToPath(import.meta.url))

const teks = (...paragraf: string[]) => ({
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: paragraf.map((p) => ({
      type: 'paragraph',
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      textFormat: 0,
      children: [{ type: 'text', text: p, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
    })),
  },
})

const KATEGORI = [
  { slug: 'perwiracloud', nama: 'PerwiraCloud', warna: 'biru', ikon: 'awan', urutan: 10, id: 'Layanan cloud server, VPS, dan infrastruktur berperforma tinggi.', en: 'Cloud servers, VPS and high-performance infrastructure.' },
  { slug: 'perwiraradius', nama: 'PerwiraRadius', warna: 'oranye', ikon: 'lapis', urutan: 20, id: 'Manajemen hotspot, PPPoE, dan otentikasi berbasis RADIUS.', en: 'Hotspot, PPPoE and RADIUS-based authentication.' },
  { slug: 'perwiranet', nama: 'PerwiraNet', warna: 'biru', ikon: 'wifi', urutan: 30, id: 'Solusi jaringan ISP, monitoring, dan manajemen pelanggan.', en: 'ISP networking, monitoring and customer management.' },
  { slug: 'bayarinternet', nama: 'BayarInternet', warna: 'oranye', ikon: 'kartu', urutan: 40, id: 'Sistem billing internet, pembayaran, dan manajemen pelanggan.', en: 'Internet billing, payments and customer management.' },
] as const

const idProduk: Record<string, number> = {}
for (const k of KATEGORI) {
  const ada = await payload.find({ collection: 'produk', where: { slug: { equals: k.slug } }, limit: 1, depth: 0 })
  let doc = ada.docs[0]
  if (!doc) {
    doc = await payload.create({ collection: 'produk', locale: 'id', data: { slug: k.slug, nama: k.nama, merek: k.slug === 'perwiracloud' ? 'perwiracloud' : 'perwiramedia', warna: k.warna, ikon: k.ikon, urutan: k.urutan, deskripsi: k.id } })
    await payload.update({ collection: 'produk', id: doc.id, locale: 'en', data: { deskripsi: k.en } })
    console.log('produk', k.slug)
  }
  idProduk[k.slug] = doc.id
}

async function adaSlug(collection: 'docs' | 'posts', slug: string) {
  const r = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1, depth: 0, draft: true })
  return r.docs[0]
}

const DOCS = [
  {
    kode: 'CLD-014',
    slug: 'upgrade-bandwidth-ip',
    produk: 'perwiracloud',
    urutan: 40,
    judul: 'Upgrade bandwidth dan tambah IP publik',
    ringkasan: 'Bandwidth dan IP publik VPS MikroTik CHR bisa ditambah dari area klien tanpa migrasi server. VPS tetap berjalan selama proses.',
    langkah: [
      { judul: 'Buka layanan VPS', isi: 'Masuk ke my.perwiracloud.com, pilih Layanan, lalu klik VPS yang mau di-upgrade.' },
      { judul: 'Pilih upgrade lalu bayar', isi: 'Klik Upgrade/Downgrade Options, centang bandwidth atau IP tambahan, lalu bayar invoice prorata.' },
      { judul: 'Pasang IP tambahan di CHR', isi: 'Jalankan perintah ini di terminal CHR dengan IP dari email aktivasi.', perintah: '/ip address add address=<IP_TAMBAHAN>/<PREFIX> interface=ether1' },
    ],
    konten: ['Harga tambahan: bandwidth node Indonesia Rp250.000 sampai Rp800.000 per 100 Mbps per bulan, extra IP publik Rp75.000 per bulan.', 'BGP session gratis untuk paket di atas Rp500.000 per bulan.'],
  },
  {
    kode: 'CLD-012',
    slug: 'mengamankan-chr',
    produk: 'perwiracloud',
    urutan: 30,
    judul: 'Mengamankan CHR ber-IP publik',
    ringkasan: 'Tiga langkah dasar sebelum CHR kamu ditemukan bot: ganti identity, rapikan IP Service, dan buat user baru.',
    langkah: [
      { judul: 'Ganti identity router', perintah: '/system identity set name=<NAMA_ROUTER>' },
      { judul: 'Matikan layanan yang tidak dipakai', perintah: '/ip service disable telnet,ftp,www,api' },
      { judul: 'Buat user baru lalu nonaktifkan admin', perintah: '/user add name=<USER> group=full password=<PASSWORD>\n/user disable admin' },
    ],
    konten: ['Lakukan langkah ini lewat koneksi yang stabil supaya akses kamu sendiri tidak terkunci.'],
  },
  {
    kode: 'NET-021',
    slug: 'vpn-remote-l2tp-sstp',
    produk: 'perwiranet',
    urutan: 20,
    judul: 'Menyambungkan VPN Remote L2TP dan SSTP',
    ringkasan: 'Remote MikroTik tanpa IP publik lewat VPN Remote. Layanan ini menyediakan L2TP/IPsec dan SSTP.',
    langkah: [
      { judul: 'Ambil data akun VPN di panel', isi: 'Catat alamat server, username, password, dan PSK dari panel PerwiraMedia.' },
      { judul: 'Buat L2TP client', perintah: '/interface l2tp-client add name=perwira-vpn connect-to=<IP_SERVER> user=<USER> password=<PASSWORD> use-ipsec=yes ipsec-secret=<PSK> disabled=no' },
      { judul: 'Cek status tunnel', perintah: '/interface l2tp-client monitor perwira-vpn once' },
    ],
    konten: ['Kalau UDP diblokir oleh jaringanmu, pakai SSTP lewat TCP 443. WireGuard tidak tersedia di VPN Remote, hanya di IP Publik Statik.'],
  },
  {
    kode: 'RAD-031',
    slug: 'voucher-hotspot-massal',
    produk: 'perwiraradius',
    urutan: 10,
    judul: 'Voucher hotspot massal di PerwiraRadius',
    ringkasan: 'Membuat ratusan voucher hotspot sekaligus dan mencetaknya.',
    langkah: [
      { judul: 'Buat profil paket', isi: 'Atur durasi, kuota, dan batas kecepatan di menu Profil.' },
      { judul: 'Generate voucher', isi: 'Pilih profil, isi jumlah voucher, lalu klik Generate.' },
      { judul: 'Cetak', isi: 'Pilih template cetak dan unduh PDF.' },
    ],
    konten: ['Voucher tersimpan di server RADIUS, jadi tidak hilang saat router diganti.'],
  },
  {
    kode: 'BYR-010',
    slug: 'bayarinternet-ke-mikrotik',
    produk: 'bayarinternet',
    urutan: 10,
    judul: 'Menghubungkan BayarInternet ke MikroTik',
    ringkasan: 'Sambungkan router supaya isolir dan buka isolir pelanggan berjalan otomatis.',
    langkah: [
      { judul: 'Aktifkan API di router', perintah: '/ip service enable api' },
      { judul: 'Tambahkan router di BayarInternet', isi: 'Isi alamat, port API, user, dan password router di menu Router.' },
      { judul: 'Tes koneksi', isi: 'Klik Tes. Status hijau berarti router siap dipakai.' },
    ],
    konten: ['Gunakan user router khusus untuk API, jangan user admin utama.'],
  },
]

for (const d of DOCS) {
  if (await adaSlug('docs', d.slug)) continue
  await payload.create({
    collection: 'docs',
    locale: 'id',
    data: {
      ...d,
      produk: idProduk[d.produk],
      konten: teks(...d.konten),
      _status: 'published',
      meta: { title: `${d.judul} | PerwiraMedia Docs`, description: d.ringkasan },
    },
  })
  console.log('docs', d.kode)
}

// sampul blog dari folder assets (foto Wikimedia Commons berlisensi CC BY 3.0)
let sampul: number | undefined
const media = await payload.find({ collection: 'media', where: { alt: { equals: 'MikroTik mAP lite' } }, limit: 1 })
if (media.docs[0]) sampul = media.docs[0].id
else {
  const m = await payload.create({
    collection: 'media',
    data: { alt: 'MikroTik mAP lite', kredit: 'Foto: Uhernandez, CC BY 3.0, Wikimedia Commons' },
    filePath: path.resolve(dirname, '../assets/mikrotik-map-lite.jpg'),
  })
  sampul = m.id
}

const POSTS = [
  {
    slug: 'vpn-ip-publik-l2tp-sstp-wireguard',
    judul: 'VPN IP Publik MikroTik: L2TP vs SSTP vs WireGuard',
    kategori: 'VPN IP Publik',
    terbitPada: '2026-10-23T08:00:00.000Z',
    ringkasan: 'Jawab tiga pertanyaan, lalu kamu tahu protokol mana yang pas untuk routermu.',
    konten: ['Ketiganya sama-sama bisa memberi router kamu IP publik. Bedanya ada di port yang dipakai dan versi RouterOS yang didukung.', 'RouterOS 7 dan UDP tidak diblokir, pakai WireGuard. UDP diblokir, pakai SSTP. Selain itu, L2TP/IPsec paling banyak contohnya.'],
  },
  {
    slug: 'vpn-ip-publik-putus',
    judul: 'VPN IP Publik MikroTik Putus? 5 Penyebab dan Solusinya',
    kategori: 'VPN IP Publik',
    terbitPada: '2026-10-16T08:00:00.000Z',
    ringkasan: 'Cari penyebabnya dari log, lalu pasang netwatch supaya tunnel tersambung lagi sendiri.',
    konten: ['Mulai dari log: /log print where topics~"l2tp". Pesan "phase1 negotiation failed" biasanya berarti PSK salah atau UDP 500 dan 4500 diblokir.'],
  },
  {
    slug: 'perwira-radius-hotspot-kafe',
    judul: 'Perwira Radius untuk Hotspot Kafe: Use Case dan Cara Kerja',
    kategori: 'Perwira Radius',
    terbitPada: '2026-11-01T08:00:00.000Z',
    ringkasan: 'Data pengguna hotspot pindah ke server pusat, jadi voucher kafe tidak lagi dicatat manual.',
    konten: ['Dengan RADIUS, voucher dan riwayat pemakaian tersimpan di server, bukan di router.'],
  },
]

for (const p of POSTS) {
  if (await adaSlug('posts', p.slug)) continue
  await payload.create({
    collection: 'posts',
    locale: 'id',
    data: { ...p, sampul, konten: teks(...p.konten), _status: 'published', meta: { title: p.judul, description: p.ringkasan } },
  })
  console.log('posts', p.slug)
}

const UPDATES = [
  { versi: 'v1.2', tanggal: '2026-11-03', judul: 'Panduan BayarInternet diperbarui', item: [{ jenis: 'Diperbarui' as const, produk: 'bayarinternet', teks: 'Menghubungkan BayarInternet ke MikroTik.' }, { jenis: 'Perbaikan' as const, produk: 'perwiracloud', teks: 'Perintah /ip address di CLD-014.' }] },
  { versi: 'v1.1', tanggal: '2026-10-31', judul: 'Panduan PerwiraRadius ditambah', item: [{ jenis: 'Baru' as const, produk: 'perwiraradius', teks: 'Voucher hotspot massal.' }] },
  { versi: 'v1.0', tanggal: '2026-10-29', judul: 'Rilis awal dokumentasi PerwiraMedia', item: [{ jenis: 'Baru' as const, produk: 'perwiracloud', teks: 'Panduan VPS MikroTik CHR.' }, { jenis: 'Baru' as const, produk: 'perwiranet', teks: 'Panduan VPN Remote.' }] },
]
const jumlahUpdate = await payload.count({ collection: 'updates' })
if (jumlahUpdate.totalDocs === 0)
  for (const u of UPDATES) await payload.create({ collection: 'updates', locale: 'id', data: { ...u, item: u.item.map((i) => ({ ...i, produk: idProduk[i.produk] })) } })

// contoh redirect dari permalink WordPress lama
const lama = '/blog/vpn-ip-publik-mikrotik-l2tp-vs-sstp-vs-wireguard'
const r = await payload.find({ collection: 'redirects', where: { from: { equals: lama } }, limit: 1 })
const tujuan = await adaSlug('posts', 'vpn-ip-publik-l2tp-sstp-wireguard')
if (!r.docs[0] && tujuan) {
  await payload.create({ collection: 'redirects', data: { from: lama, to: { type: 'reference', reference: { relationTo: 'posts', value: tujuan.id } }, type: '301' } })
}

const jumlahPengguna = await payload.count({ collection: 'users' })
if (jumlahPengguna.totalDocs === 0) {
  console.log(`Belum ada akun. Buka ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/tuan untuk membuat admin pertama.`)
}

console.log('Seed selesai.')
process.exit(0)
