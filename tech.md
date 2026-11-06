# Tech Stack

Kenapa setiap bagian dipilih. Versi singkat.

## Inti

| Bagian | Pakai | Kenapa |
| --- | --- | --- |
| Framework | **Next.js 16.3** (App Router) | Satu aplikasi untuk situs publik dan admin. SSR bagus untuk SEO docs/blog. |
| CMS + admin | **Payload CMS 3.93** | Admin panel, draf, versi, jadwal terbit, lokalisasi, peran sudah bawaan. Code-first (semua di `src/`, bukan klik-klik). Jalan di dalam Next yang sama. |
| Database | **SQLite** (`@payloadcms/db-sqlite`, WAL) | Self-host satu VPS, trafik docs tidak besar. Tanpa server DB terpisah. Backup = salin satu file. |
| Editor konten | **Lexical** (`@payloadcms/richtext-lexical`) | Editor bawaan Payload. Mendukung blok kode dan impor/ekspor Markdown. |
| Gambar | **sharp 0.33.5** | Resize gambar unggahan. Dipatok 0.33.5 (bukan 0.35) karena 0.34+ wajib CPU x86-64-v2; VPS qemu baseline tidak punya. |
| UI | **React 19.2** + CSS biasa | Situs publik ditulis sendiri (`src/app/(frontend)`), bukan Fumadocs, supaya kendali penuh atas tampilan. |

## Plugin & library pendukung

| Pakai | Untuk |
| --- | --- |
| `@payloadcms/plugin-seo` | Skor SEO, meta title/description per tulisan. |
| `@payloadcms/plugin-redirects` | Redirect 301 dari URL lama WordPress/Blogger. |
| `@payloadcms/email-nodemailer` | Email reset password lewat SMTP. |
| `happy-dom` | Parsing HTML saat impor berkas `.html`. |
| `qrcode` | QR code untuk aktivasi 2FA. |
| `zod` | Validasi input. |
| 2FA buatan sendiri (`src/lib/duafa.ts`) | TOTP + kode cadangan pakai `node:crypto`. `payload-auth`/Better Auth dibuang karena bug (lihat `jebakan-docs-perwira`). |

## Infrastruktur

| Bagian | Pakai | Kenapa |
| --- | --- | --- |
| Web server | **Caddy** (reverse proxy) | Konfig satu file, proxy ke app di `127.0.0.1:3000`. |
| TLS | **Cloudflare** (proxied) | SSL dipegang Cloudflare di edge. VPS cukup HTTP. |
| Proses | **systemd** (`perwira-docs.service`) | Hidup lagi setelah reboot, restart otomatis kalau mati. |
| Firewall | **ufw** | Hanya 22/80/443 terbuka; port 3000 hanya localhost. |
| Deploy | Script `deploy/*.sh` | Verifikasi spek, migrasi, build, service. Idempoten (install = update). |

## Kenapa satu codebase (bukan pisah)

Situs publik dan admin jalan di proses Next yang sama. Satu `npm run build`, satu deploy, satu database. Jadwal terbit berjalan di dalam proses ini, tidak perlu cron terpisah.

## Prinsip

- Code-first: koleksi, akses, 2FA semua di `src/`. Ubah struktur = ubah kode + migrasi, bukan klik di UI.
- Draf aman: query publik pakai `overrideAccess: false` (`src/lib/payload.ts` → `publik`), jadi yang belum terbit tidak bocor.
- Satu sumber kebenaran: kategori produk, harga, batasan ditulis sekali.

Detail versi lengkap: `package.json`. Catatan jebakan teknis: memory `jebakan-docs-perwira`.
