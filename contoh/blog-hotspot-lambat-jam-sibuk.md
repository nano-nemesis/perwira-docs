---
judul: Hotspot lambat di jam sibuk? Ini urutan cek yang kami pakai di MikroTik
slug: hotspot-lambat-jam-sibuk
kategori: Troubleshooting
terbitPada: 2026-11-05
ringkasan: Lima pemeriksaan berurutan di MikroTik untuk mencari penyebab hotspot RT RW Net melambat di jam ramai, mulai dari CPU router sampai DNS.
bahasa: id
---

# Hotspot lambat di jam sibuk? Ini urutan cek yang kami pakai di MikroTik

Siang hari semua normal. Setelah magrib, pelanggan mulai mengirim pesan bahwa video patah-patah dan halaman susah terbuka. Penyebabnya bisa ada di router, di pengaturan antrean, atau di jalur ke internet. Urutan di bawah kami susun dari pemeriksaan yang paling cepat.

Jalankan semua perintah saat keluhan sedang terjadi. Angka yang diambil siang hari biasanya terlihat baik dan tidak membantu.

## 1. Lihat beban CPU router

Router kelas kecil bisa kehabisan tenaga lebih dulu sebelum bandwidth-nya penuh, terutama kalau aturan firewall dan antreannya banyak.

```routeros
/system resource print
/tool profile duration=10s
```

Perhatikan nilai cpu-load. Kalau angkanya bertahan di atas 90 persen, lihat hasil /tool profile untuk mengetahui proses mana yang paling berat. Beban tinggi di firewall, queue, dan dns punya cara penanganan yang berbeda, jadi catat namanya.

## 2. Cari pemakai bandwidth terbesar

Torch menampilkan lalu lintas per alamat IP secara langsung. Ganti bridge-hotspot dengan nama interface hotspot di router kamu.

```routeros
/tool torch interface=bridge-hotspot src-address=0.0.0.0/0 dst-address=0.0.0.0/0
```

Satu perangkat yang sedang mengunduh file besar bisa menghabiskan jatah semua pengguna lain kalau batas kecepatan per pengguna tidak berjalan.

## 3. Pastikan batas kecepatan per pengguna berjalan

Pada hotspot MikroTik, batas kecepatan biasanya diatur lewat rate-limit di user profile. Router lalu membuat simple queue dinamis untuk setiap pengguna yang login.

```routeros
/ip hotspot user profile print
/queue simple print stats where dynamic
```

Kalau daftar queue dinamis kosong padahal banyak pengguna sedang online, berarti rate-limit belum terisi di profile yang mereka pakai.

## 4. Ukur jalur ke internet

Masalah bisa juga ada di atas router. Ping gateway ISP dan satu alamat di internet pada saat yang sama, lalu bandingkan hasilnya. Ganti 192.168.1.1 dengan alamat gateway ISP kamu.

```routeros
/ping 192.168.1.1 count=20
/ping 8.8.8.8 count=20
```

Kalau ping ke gateway stabil tetapi ping ke 8.8.8.8 sering hilang atau waktunya melonjak, kemungkinan besar gangguan ada di sisi penyedia internet. Simpan hasilnya untuk dilampirkan saat melapor.

## 5. Periksa DNS

Kalau pengguna memakai router sebagai DNS, cache yang terlalu kecil membuat setiap halaman harus menunggu jawaban dari luar.

```routeros
/ip dns print
/ip dns set cache-size=8192KiB
```

Ukuran cache bawaan adalah 2048 KiB. Naikkan hanya kalau sisa RAM router masih longgar. Pastikan juga port DNS tidak terbuka ke internet, karena router bisa dipakai orang lain untuk serangan amplifikasi.

```routeros
/ip firewall filter add chain=input in-interface-list=WAN protocol=udp dst-port=53 action=drop comment="tutup DNS dari internet"
```

## Setelah penyebabnya ketemu

> Catat jam, nilai cpu-load, dan hasil ping setiap kali keluhan muncul. Dari catatan beberapa hari, pola masalahnya biasanya kelihatan.

Kalau router berada di lokasi tanpa IP publik, semua pemeriksaan ini tetap bisa dilakukan dari rumah lewat VPN Remote. Caranya ada di [panduan menyambungkan VPN Remote](/panduan/vpn-remote-l2tp-sstp).

Masih belum menemukan penyebabnya? Kirim hasil perintah di atas ke tim support lewat WhatsApp, supaya kami bisa langsung membaca angkanya.
