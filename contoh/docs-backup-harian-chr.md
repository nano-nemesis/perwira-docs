---
judul: Backup harian konfigurasi CHR dengan scheduler
slug: backup-harian-chr
kode: CLD-020
produk: perwiracloud
urutan: 30
ringkasan: Buat backup otomatis setiap malam di VPS MikroTik CHR, lalu simpan salinannya di luar router supaya konfigurasi bisa dipulihkan kapan saja.
bahasa: id
---

# Backup harian konfigurasi CHR dengan scheduler

## Langkah

### 1. Cek versi RouterOS
Script di panduan ini memakai format tanggal RouterOS 7.10 ke atas, misalnya 2026-11-05. Versi yang lebih lama memakai garis miring di tanggal, dan garis miring tidak boleh ada di nama file. Kalau versi router kamu masih di bawah 7.10, update RouterOS dulu.

```routeros
/system resource print
```

### 2. Buat script backup
Script ini membuat dua file sekaligus, yaitu file .backup untuk pemulihan penuh dan file .rsc berisi export konfigurasi dalam bentuk teks. Ganti GantiPasswordIni dengan password yang kamu simpan di tempat aman, karena file .backup dienkripsi dengan password tersebut.

```routeros
/system script add name=backup-harian policy=read,write,policy,test,sensitive source={
:local tgl [/system clock get date]
/system backup save name=("backup-" . $tgl) password=GantiPasswordIni
/export show-sensitive file=("export-" . $tgl)
}
```

### 3. Jalankan sekali untuk uji
Jalankan script secara manual, lalu pastikan dua file dengan tanggal hari ini muncul di daftar file.

```routeros
/system script run backup-harian
/file print where name~"backup-|export-"
```

### 4. Jadwalkan setiap malam
Scheduler berikut menjalankan script setiap hari pukul 02.00 waktu router. Cek dulu jam router dengan /system clock print, karena jam yang salah membuat nama file ikut salah.

```routeros
/system scheduler add name=backup-harian interval=1d start-time=02:00:00 on-event="/system script run backup-harian"
```

### 5. Simpan salinan di luar router
Backup yang hanya tersimpan di VPS akan ikut hilang kalau VPS-nya bermasalah. Unduh file secara rutin lewat menu Files di Winbox, atau lewat SFTP seperti dijelaskan di bagian Penjelasan.

## Penjelasan

### Kenapa ada dua file

File .backup menyimpan seluruh isi router, termasuk password user dan sertifikat. File ini paling cepat dipakai untuk memulihkan router yang sama, atau router lain dengan versi RouterOS yang sama.

File .rsc berisi export dalam bentuk teks. Isinya bisa dibaca dan disunting, jadi cocok untuk memindahkan konfigurasi ke router lain atau membandingkan perubahan dari hari ke hari.

### Memulihkan dari backup

Unggah file ke router lewat Winbox atau SFTP, lalu jalankan perintah berikut. Router akan reboot setelah backup selesai dimuat.

```routeros
/system backup load name=backup-2026-11-05.backup password=GantiPasswordIni
```

Untuk file export, jalankan import di router yang konfigurasinya masih kosong supaya tidak bentrok dengan pengaturan lama.

```routeros
/import file-name=export-2026-11-05.rsc
```

### Mengunduh lewat SFTP

Pastikan layanan SSH di router aktif dan hanya bisa diakses dari IP kamu. Cara membatasinya ada di panduan [Mengamankan CHR ber-IP publik](/panduan/mengamankan-chr). Setelah itu jalankan perintah ini dari komputer:

```shell
sftp admin@IP-VPS-KAMU
get backup-2026-11-05.backup
get export-2026-11-05.rsc
```

### Kalau backup tidak terbentuk

- Cek apakah scheduler pernah berjalan. Nilai run-count di hasil perintah di bawah harus bertambah setiap hari.
- Lihat log script. Pesan not enough permissions berarti policy di script kurang lengkap.
- Pastikan sisa ruang disk masih cukup lewat nilai free-hdd-space di /system resource print.

```routeros
/system scheduler print detail where name=backup-harian
/log print where topics~"script"
```

> File backup lama tidak terhapus otomatis. Hapus file yang sudah kamu unduh lewat menu Files supaya disk VPS tidak penuh.
