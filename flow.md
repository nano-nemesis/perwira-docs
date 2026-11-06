# Flow

Cara pakai dari login sampai terbit, plus error yang sering muncul dan solusinya. Versi singkat.

## 1. Login admin

Admin ada di **`/tuan`** (bukan `/admin`).

1. Akun pertama: buka `/tuan`, otomatis diarahkan ke **buat akun pertama**. Akun pertama otomatis jadi `admin`.
2. Login email + password.
3. **Wajib 2FA.** Akun baru diarahkan ke `/verifikasi-2fa`: scan QR di Google Authenticator/Authy, masukkan kode 6 digit. Simpan 8 kode cadangan.
4. Login berikutnya: email + password, lalu kode 2FA.

Lupa password: tombol di halaman login kirim email reset (butuh SMTP diisi di `.env`; kalau kosong, link dicetak ke log server).

Peran: **penulis** (tulis draf, tidak bisa terbit) → **editor** (terbit) → **admin** (kelola pengguna, redirect). Admin atur peran di **Pengguna**.

## 2. Buat docs atau blog

Dua cara.

**A. Tulis langsung di admin**
1. **Konten → Halaman docs** (atau **Tulisan blog**) → Create New.
2. Isi judul, slug, dan (untuk docs) kode + kategori produk. Isi konten di editor (bisa pintasan Markdown: `## ` judul, `- ` daftar, ` ``` ` blok kode).
3. Penulis centang **Kirim untuk review** lalu simpan draf. Editor yang menekan **Publish** (atau jadwalkan).

**B. Impor Markdown/HTML/JSON**
1. Di daftar docs/blog, tombol **Impor berkas** atau **Tulis / tempel Markdown**.
2. Hasil selalu **draf**. Slug yang sudah ada = diperbarui, versi lama tetap di riwayat.
3. Contoh siap pakai ada di folder `contoh/`.

**Ekspor / untuk AI video:** di halaman edit, tombol **Ekspor** → Markdown, HTML, JSON, atau **Brief video short** (`.md` untuk diserahkan ke AI agent pembuat video).

## 3. Alur terbit

```
Penulis tulis draf → centang "Kirim untuk review" → Editor cek di dasbor → Publish / jadwalkan → tampil di situs
```

Draf tidak pernah tampil di situs publik. URL berubah? Tambah entri di **SEO → Redirects**.

## 4. Jalankan & deploy

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Server pengembangan (`localhost:3000`) |
| `npm run build` lalu `npm start` | Produksi |
| `npm run seed` | Isi contoh (aman diulang) |
| `npm run cek` | Tes 2FA, Markdown, pencarian |
| `NODE_ENV=production npx payload migrate` | Terapkan skema database |

Deploy VPS: `DOMAIN=... bash deploy/pasang.sh` (app) lalu `DOMAIN=... bash deploy/pasang-caddy.sh` (reverse proxy). Update = jalankan lagi. Ganti domain: `bash deploy/ganti-domain.sh <domain-baru>`.

## 5. Error yang sering muncul

| Gejala | Penyebab | Solusi |
| --- | --- | --- |
| **`Unsupported CPU: require v2 microarchitecture`** saat migrate/build | CPU VPS baseline (qemu64), sharp 0.35 butuh x86-64-v2 | Sudah dipatok sharp 0.33.5. Kalau muncul lagi: `rm -rf node_modules/sharp node_modules/@img && npm install`. Atau set CPU VM ke `host`. |
| **Halaman 500 saat start dev** | drizzle push SQLite nulis `CREATE INDEX` dua kali | Produksi pakai migrasi (`payload migrate`), bukan push. Dev: restart `npm run dev`. Lihat `jebakan-docs-perwira`. |
| **Build/tsc pakai file lama setelah rute dihapus** | `.next` basi | `rm -rf .next` lalu ulang. Atau `npm run devsafe`. |
| **`next dev` menolak jalan** | Sudah ada `next dev` lain di folder sama | `ss -ltnp \| grep :3000`, matikan proses lama lewat PID-nya. |
| **`No migration directory found`** saat migrate | Folder `src/migrations` hilang | Migrasi sudah ikut di repo. Kalau benar hilang: `NODE_ENV=production DATABASE_URL="file:/tmp/kosong.db" npx payload migrate:create baseline`. |
| **502 Bad Gateway** sesaat | App baru restart, Next belum siap | Tunggu ~10 detik, app otomatis siap. Cek `systemctl status perwira-docs`. |
| **521 di `https://` lewat Cloudflare** | SSL mode Cloudflare "Full", VPS cuma HTTP | Cloudflare → SSL/TLS → **Flexible** + **Always Use HTTPS** ON. |
| **Impor gagal: "Kategori produk ... tidak ada"** | Slug produk di frontmatter salah | Pakai slug kategori yang ada (mis. `perwiracloud`), atau kosongkan. |
| **Semua pengunjung terlihat satu IP / rate limit salah blokir** | Tanpa trusted proxy di belakang Cloudflare | Sudah diatur di Caddyfile (`trusted_proxies` + `header_up X-Forwarded-For {client_ip}`). Jalankan `ganti-domain.sh` kalau Caddyfile di-reset. |
| **Email reset tidak terkirim** | `SMTP_*` kosong di `.env` | Isi `SMTP_HOST` dll. Tanpa itu, link reset dicetak ke log server. |
| **Teks admin masih Inggris** ("Publish", "Confirm") | Teks bawaan Payload | Bukan bug. Bisa diterjemahkan dengan `@payloadcms/translations` kalau mau. |

## 6. Kalau pembaca mentok

Tombol WhatsApp muncul di titik pembaca buntu (hasil cari kosong, "masih belum berhasil?", masukan "Belum"). Pesan otomatis menyebut kode panduan. Nomor: `src/lib/situs.ts` (`WA`).

Cadangkan rutin: `payload.db` (+ `payload.db-wal`) dan folder `media/`.
