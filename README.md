# PerwiraMedia Docs

Situs dokumentasi dan blog untuk produk PerwiraMedia dan PerwiraCloud, lengkap dengan admin untuk penulis dan editor. Satu aplikasi Next.js: situs publik dan panel admin jalan di proses yang sama, datanya di satu berkas SQLite.

## Isi

**Situs publik**

- Beranda, daftar panduan per produk, halaman panduan, blog, dan changelog.
- Pencarian langsung (Ctrl + K). Kata yang dicari tapi tidak ada hasilnya dicatat untuk tim penulis.
- Dua bahasa, Indonesia dan English (`?lang=en`), dengan hreflang di metadata dan sitemap.
- Tema terang dan gelap, mengikuti setelan perangkat dan bisa diganti manual.
- Gradien latar yang bergerak mengikuti scroll, dan efek blur saat pindah halaman. Keduanya mati otomatis kalau perangkat meminta gerak dikurangi.
- Langkah panduan bisa dicentang dan diingat per perangkat.
- Kotak video YouTube hanya muncul kalau halaman itu punya tautan video. Iframe baru dimuat setelah diklik.
- Tombol "Apakah panduan ini membantu?" yang hasilnya masuk ke admin. Kalau pembaca menjawab belum, muncul tombol WhatsApp berisi kode panduan dan catatannya.
- Bantuan WhatsApp (0851 7345 2805) di tempat pembaca biasanya mentok: tombol mengambang di semua halaman, kartu "Panduan tidak ditemukan?" di menu samping, hasil pencarian kosong, dan kartu "Masih belum berhasil?" di halaman panduan. Pesannya otomatis terisi halaman, kode panduan, atau kata yang dicari, jadi CS tidak perlu bertanya ulang. Nomornya diatur di `WA` dalam `src/lib/situs.ts`.
- SEO: judul dan deskripsi per halaman, Open Graph, schema.org HowTo, BlogPosting, dan VideoObject, `sitemap.xml`, `robots.txt`, serta redirect 301 dari URL lama.

**Admin (`/tuan`)**

Panel admin sengaja di `/tuan`, bukan `/admin` bawaan, supaya tidak gampang ditebak bot. `/admin` membalas 404.

- Halaman login dengan latar beranimasi (gradien melayang dan tiga bilah logo), lupa password lewat email, dan **2FA wajib** untuk semua akun (TOTP lewat Google Authenticator atau Authy, plus 8 kode cadangan).
- Tiga peran: penulis menulis dan menyimpan draf, editor menerbitkan, admin mengelola pengguna dan redirect.
- Draf, simpan otomatis, riwayat versi, dan jadwal terbit.
- Konten dua bahasa per halaman.
- Dasbor: tombol cepat menulis, angka ringkas, kata yang dicari pelanggan tapi belum ada panduannya (dengan tombol Tulis), antrean review, keluhan terbaru dari pembaca, jumlah panduan per kategori, dan kesehatan SEO.
- **Kategori produk** bisa ditambah sendiri di **Konten → Kategori produk** (nama, slug, deskripsi ID/EN, ikon, warna, urutan). Kategori baru langsung muncul di beranda, menu samping, halaman panduan, dan filter changelog. Kategori yang masih punya docs tidak bisa dihapus.
- Koleksi Redirect untuk memetakan permalink lama WordPress dan Blogger ke URL baru.

## Teknologi

| Bagian | Pilihan |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| CMS dan admin | Payload CMS 3.93 |
| Database | SQLite (`@payloadcms/db-sqlite`, mode WAL) |
| Editor teks | Lexical |
| Plugin | `@payloadcms/plugin-seo`, `@payloadcms/plugin-redirects` |
| 2FA | Ditulis sendiri dengan modul `crypto` Node, ada di `src/lib/duafa.ts` |
| Font | Plus Jakarta Sans, Inter, JetBrains Mono (lewat `next/font`) |

## Menjalankan di komputer sendiri

Butuh Node.js 22.23 atau 24.22 ke atas.

```bash
npm install
cp .env.example .env        # isi PAYLOAD_SECRET dengan: openssl rand -hex 24
npm run seed                # contoh panduan, blog, changelog, dan satu redirect
npm run dev
```

Buka http://localhost:3000 untuk situs dan http://localhost:3000/tuan untuk admin.

### Admin pertama

1. Buka `/tuan`. Saat database belum punya pengguna, Payload menampilkan formulir pembuatan akun pertama. Akun ini otomatis menjadi **admin**.
2. Setelah login, kamu diarahkan ke `/verifikasi-2fa`. Pindai QR dengan aplikasi authenticator, ketik kodenya, lalu **simpan 8 kode cadangan** yang muncul. Kode ini hanya tampil sekali.
3. Penulis dan editor dibuat oleh admin di menu **Akun → Pengguna**. Saat login pertama, mereka juga wajib mengaktifkan 2FA.

Kalau HP seorang pengguna hilang dan kode cadangannya habis, admin bisa mematikan centang **2FA aktif** di data pengguna itu. Pengguna tersebut akan diminta mengaktifkan 2FA lagi saat login berikutnya.

## Variabel lingkungan

| Nama | Isi |
| --- | --- |
| `DATABASE_URL` | Lokasi berkas SQLite, misalnya `file:./payload.db` |
| `PAYLOAD_SECRET` | Rahasia acak untuk token sesi dan tanda 2FA. Jangan diganti setelah dipakai, semua sesi akan putus |
| `NEXT_PUBLIC_SITE_URL` | URL publik situs, dipakai untuk sitemap, canonical, tautan di email reset, dan pengecekan CSRF Payload |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Server email untuk reset password. Port 465 otomatis memakai SSL, port lain STARTTLS. Kalau `SMTP_HOST` kosong, email tidak dikirim dan isinya hanya dicetak ke log server |

## Lupa password

Di halaman login ada tautan **Forgot password?**. Pengguna mengisi emailnya, lalu menerima email berisi tombol **Buat password baru** yang berlaku 1 jam dan hanya bisa dipakai sekali. Setelah password diganti, kode 2FA tetap diminta saat masuk. Untuk keamanan, halaman ini selalu menjawab "berhasil" walaupun emailnya tidak terdaftar, supaya orang luar tidak bisa menebak email siapa yang punya akun.

Isi `SMTP_*` di `.env` dengan akun email pengirim (misalnya email domain dari cPanel atau layanan seperti Brevo), lalu jalankan ulang server.

## Cara kerja 2FA

- `src/proxy.ts` menjaga semua halaman `/tuan`. Sesi yang sudah login tapi belum memasukkan kode 2FA dialihkan ke `/verifikasi-2fa`.
- Setelah kode benar, server memasang cookie `pm-2fa` berisi HMAC dari token sesi. Cookie ini ikut mati saat logout.
- Semua aturan akses tulis (`src/access.ts`) memeriksa dua hal: akun sudah mengaktifkan 2FA, dan sesi ini sudah lolos kode. Jadi REST API juga terkunci, bukan hanya tampilan admin.
- Lima kali kode salah, verifikasi dikunci 15 menit. Login password juga dikunci 15 menit setelah lima kali salah.
- Rahasia TOTP dan kode cadangan tidak bisa dibaca lewat API. Kode cadangan disimpan sebagai hash SHA-256.

## Alur menulis

1. Penulis membuat halaman di **Konten → Halaman docs** atau **Tulisan blog**, mengisi versi Indonesia (dan English kalau ada), lalu mencentang **Kirim untuk review**.
2. Editor melihatnya di dasbor bagian *Perlu review*, memeriksa, lalu menekan **Publish** atau mengatur jadwal terbit.
3. Kalau URL sebuah halaman berubah, tambahkan entri di **SEO → Redirects** supaya tautan lama tetap jalan.

Setiap halaman docs punya **kode** (misalnya `CLD-014`). CS bisa mengutip kode ini saat membalas tiket, dan pembaca bisa mengetiknya langsung di kotak pencarian.

### Markdown, impor, dan ekspor

- Editor menerima pintasan Markdown saat mengetik (`## ` jadi judul, `- ` jadi daftar, ` ``` ` jadi blok kode). Blok kode tampil sebagai terminal dengan tombol salin di situs.
- **Impor**: di daftar docs atau blog, tekan **Impor berkas** (`.md`, `.markdown`, `.txt`, `.html`, `.json`, boleh banyak sekaligus) atau **Tulis / tempel Markdown**. Hasilnya selalu draf. Kalau slug sudah ada, dokumen itu diperbarui dan versi lamanya tetap ada di riwayat versi.
- **Ekspor**: di halaman edit, tombol **Ekspor** mengunduh versi tersimpan terakhir sebagai Markdown, HTML, JSON, atau **Brief video short**, yaitu `.md` berisi tugas, aturan, dan isi lengkap untuk diserahkan ke AI agent pembuat video 9:16.

Contoh lengkap satu panduan dan satu blog ada di folder `contoh/` (juga sudah masuk admin sebagai draf). Salin salah satunya sebagai titik awal tulisan baru.

Format Markdown yang dibaca (frontmatter opsional; tanpa `judul`, baris `# Judul` pertama dipakai):

~~~markdown
---
judul: Setting PPPoE di MikroTik
kode: NET-020          # docs; kalau kosong diisi DRAF-xxxx
produk: perwiranet     # docs; slug kategori, kalau kosong kategori pertama
ringkasan: Satu kalimat untuk Google
bahasa: id             # id atau en
---

## Langkah            <- khusus docs, jadi field Langkah

### 1. Buat profil
Penjelasan langkah.

```routeros
/ppp profile add name=10M rate-limit=10M/10M
```

## Penjelasan         <- bagian lain masuk ke Konten
~~~

Blog memakai `kategori` dan `terbitPada` sebagai pengganti `kode` dan `produk`. Nama kunci Hugo/Jekyll (`title`, `description`, `date`, `category`) juga dikenali. Endpoint-nya: `POST /api/{docs|posts}/impor` dan `GET /api/{docs|posts}/:id/ekspor?format=md|html|json|video`, dengan aturan akses yang sama seperti admin (login + 2FA).

## Pasang di VPS

Untuk VPS Linux dengan Node 22.23.4+ (atau 24.22.1+). Pakai script `deploy/pasang.sh`:
script memeriksa spesifikasi (OS, versi Node, RAM, swap, disk), **memasang yang kurang** (Node lewat NodeSource/nvm, git, build tools bila perlu), meng-clone kode, membuat
`.env` berikut `PAYLOAD_SECRET` acak, menjalankan migrasi database, build, lalu memasang
systemd service. Jalankan sebagai root supaya service dan swap (kalau RAM kurang) ikut diurus.

```bash
# di VPS, sebagai root
curl -fsSL https://raw.githubusercontent.com/nano-nemesis/perwira-docs/main/deploy/pasang.sh -o pasang.sh
DOMAIN=docs.perwiramedia.com bash pasang.sh
```

Atau clone dulu lalu jalankan `bash deploy/pasang.sh`. Variabel yang bisa diatur lewat env:
`REPO`, `APP_DIR` (default `/srv/perwira-docs`), `DOMAIN`, `PORT` (default 3000), `SERVICE`, `RUN_USER`.

**Update ke versi terbaru:** jalankan script yang sama lagi. Kalau folder sudah berisi git,
script menarik versi terbaru (`git reset --hard origin/<cabang>`), migrasi, build ulang, lalu
me-restart service. Berkas `.env` dan `payload.db` tidak disentuh.

Langkah manual kalau tidak mau pakai script:

```bash
git clone https://github.com/nano-nemesis/perwira-docs.git /srv/perwira-docs && cd /srv/perwira-docs
npm ci
cp .env.example .env                       # isi PAYLOAD_SECRET (openssl rand -hex 24) dan NEXT_PUBLIC_SITE_URL
NODE_ENV=production npx payload migrate     # buat/skema database produksi (migrasi sudah ikut di repo)
npm run build
npm start                                   # port 3000
```

Jalankan `npm start` lewat systemd atau pm2 supaya hidup lagi setelah reboot. Arahkan domain ke port 3000 lewat reverse proxy dengan HTTPS. Jadwal terbit berjalan di dalam proses ini, jadi tidak perlu cron terpisah.

**Cadangkan dua hal ini secara rutin:** berkas `payload.db` (beserta `payload.db-wal` kalau ada) dan folder `media/` berisi gambar unggahan.

Endpoint publik `/api/cari`, `/api/masukan`, dan `/api/users/forgot-password` tidak butuh login. Batasi lajunya di reverse proxy (misalnya 30 permintaan per menit per IP) supaya tidak bisa dibanjiri.

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Server pengembangan |
| `npm run build` lalu `npm start` | Build dan jalankan produksi |
| `npm run seed` | Isi contoh (aman diulang) |
| `npm run cek` | Tes TOTP, kode cadangan, cookie 2FA, dan pengurai Markdown impor/ekspor |
| `npm run generate:types` | Perbarui `src/payload-types.ts` setelah koleksi diubah |
| `npm run generate:importmap` | Perbarui import map admin setelah komponen admin ditambah |

## Struktur

```
src/
  payload.config.ts        konfigurasi Payload: koleksi, bahasa, plugin
  collections/index.ts     Users, Docs, Posts, Updates, Media, Pencarian tanpa hasil, Masukan
  access.ts                aturan akses per peran dan 2FA
  proxy.ts                 gerbang 2FA untuk /tuan
  lib/duafa.ts             TOTP, kode cadangan, tanda sesi
  app/(frontend)/          situs publik
  app/(duafa)/             halaman verifikasi dan aktivasi 2FA
  app/(payload)/           panel admin Payload (berkas bawaan)
  app/api/cari, masukan    pencarian dan masukan pembaca
  components/situs/        komponen situs publik
  components/tuan/        logo dan dasbor admin
  seed.ts                  isi contoh
```

## Catatan

- Isi dari `npm run seed` adalah contoh. Harga, langkah, dan kode docs perlu dicek ulang sebelum dipakai.
- Foto sampul contoh: "MikroTik mAP lite" oleh Uhernandez, CC BY 3.0, via Wikimedia Commons. Data lisensi foto lain ada di `assets/credits.json`.
- Batasi juga laju `/api/users/forgot-password` di reverse proxy supaya tidak dipakai untuk membanjiri kotak masuk orang.
