# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated (user menolak Laravel Filament dan Directus, minta "yang oke selain 2 itu"). Pilihan: satu aplikasi Next.js berisi Payload CMS 3 (admin di `/admin`) dan Fumadocs (situs publik blog + docs). 2FA lewat plugin `payload-auth` (Better Auth, TOTP + kode cadangan). Self-host di VPS PerwiraCloud. Alasan: satu codebase dan satu deploy, sementara draf, autosave, jadwal terbit, versi, lokalisasi, SEO, dan redirect sudah bawaan atau plugin resmi Payload.

## Users

- Operator RT/RW Net yang memakai layanan PerwiraMedia (Mikhmon Online, VPN Remote, IP Publik Statik, BayarInternet, Perwira Radius). Sering membaca saat ada gangguan dan butuh jawaban cepat.
- Pelanggan PerwiraCloud, umumnya ISP kecil, yang mengelola VPS MikroTik CHR (upgrade, BGP, BYOIP).
- Calon pelanggan yang datang dari Google lewat pencarian tutorial MikroTik.
- Penulis: siapa saja di tim Perwira boleh menulis blog; editor yang menerbitkan.

## Product Purpose

Satu situs blog dan dokumentasi untuk dua merek, PerwiraMedia (SaaS) dan PerwiraCloud (IaaS). Menggantikan blog WordPress di `perwiramedia.co.id/blog` (43 tulisan) dan docs Blogger di `docs.perwiramedia.com` (14 tulisan). Berhasil kalau pembaca menemukan jawaban sendiri tanpa membuka tiket, dan tulisan tetap mendatangkan pengunjung dari Google.

## Positioning

Ditulis oleh engineer dan CS yang menangani jaringan dan tiket pelanggan Perwira sendiri, dengan perintah RouterOS yang dipakai sungguhan di layanan Perwira.

## Operating Context

- Pembaca sering sedang menghadapi router bermasalah, kadang dari HP di lapangan.
- Konten memuat banyak blok perintah RouterOS, tabel harga, dan langkah bernomor.
- Sebagian panduan punya video tutorial YouTube pendamping.
- Alur penulis: tulis draf, kirim review, editor setujui atau kembalikan dengan catatan, terbit sekarang atau terjadwal.

## Capabilities and Constraints

- Dua bahasa: Indonesia (utama) dan English, per halaman, dengan hreflang.
- Dua seksi produk dalam satu situs: PerwiraMedia dan PerwiraCloud.
- Admin wajib login dengan 2FA untuk semua akun.
- Fitur admin versi pertama: statistik bacaan dan pencarian tanpa hasil, alur review dan jadwal terbit, alat SEO (skor per tulisan, redirect 301 dari URL lama, pantauan 404, halaman docs yang basi), pengguna dan peran dengan log aktivitas, integrasi video YouTube per tulisan.
- SEO wajib untuk blog dan docs.
- Self-host di VPS PerwiraCloud.
- Protokol VPN Remote hanya L2TP/IPsec dan SSTP; WireGuard hanya di IP Publik Statik.

## Brand Commitments

- Nama: PerwiraMedia, PerwiraCloud, PT Perwira Media Solusi.
- Warna dan font dari `perwiramedia.com`: biru `#0948B3`, aksen oranye `#FF6B35`, Inter dan Poppins.
- Bahasa tulisan datar dan natural, tanpa gaya prosa AI.

## Evidence on Hand

- 43 tulisan WordPress lewat REST API `perwiramedia.co.id/blog/wp-json/wp/v2/posts`, penulis Thama Syamdhani.
- 14 tulisan Blogger di `docs.perwiramedia.com` (feed JSON).
- Katalog produk dan harga di memory `katalog-layanan-perwira`.
- Belum ada: data analitik, testimoni, logo vektor resmi, dan daftar video YouTube. Jangan dikarang.

## Product Principles

1. Jawaban lebih dulu: pencarian dan langkah yang bisa langsung dijalankan mengalahkan dekorasi.
2. Satu sumber kebenaran: harga dan batasan layanan ditulis sekali dan dipakai ulang.
3. Penulis non-teknis bisa menerbitkan tanpa menyentuh git atau kode.
4. Ringkas tapi lengkap: setiap fitur harus mengurangi tiket atau menambah pembaca dari pencarian.

## Accessibility & Inclusion

Harus nyaman dibaca di HP di lapangan: kontras tinggi, target sentuh minimal 44 px, blok kode bisa digulir dan disalin.
