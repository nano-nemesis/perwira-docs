#!/usr/bin/env bash
#
# Ganti domain situs (aplikasi + Caddy) dengan satu perintah.
#
#   bash ganti-domain.sh dokumentasi.contoh.com
#
# Mengubah:
#   1. NEXT_PUBLIC_SITE_URL di .env aplikasi
#   2. domain di /etc/caddy/Caddyfile
# lalu me-restart aplikasi dan me-reload Caddy.
#
# Catatan domain baru:
#   - Di Cloudflare: buat A record domain baru -> IP VPS ini, nyalakan proxy (awan oranye).
#   - Origin Certificate harus mencakup domain baru. Sertifikat wildcard (mis. *.thama.web.id)
#     otomatis menanggung semua subdomain di bawah apex yang sama, jadi ganti subdomain tidak
#     perlu sertifikat baru. Kalau pindah ke apex berbeda, buat Origin Certificate baru lalu
#     timpa /etc/perwira-docs/origin.pem dan origin.key sebelum menjalankan ini.
#
set -euo pipefail

BARU="${1:-}"
[ -n "$BARU" ] || { echo "Pakai: bash ganti-domain.sh <domain-baru>  (contoh: docs.perwiramedia.com)"; exit 1; }
# validasi bentuk domain sederhana
echo "$BARU" | grep -qE '^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+$' \
  || { echo "Domain tidak valid: $BARU"; exit 1; }

APP_DIR="${APP_DIR:-/srv/perwira-docs}"
CERT_DIR="${CERT_DIR:-/etc/perwira-docs}"
CADDYFILE="${CADDYFILE:-/etc/caddy/Caddyfile}"
[ "$(id -u)" -eq 0 ] || { echo "Jalankan sebagai root (butuh akses Caddy & systemd)."; exit 1; }

# 1. URL publik aplikasi
if grep -q '^NEXT_PUBLIC_SITE_URL=' "$APP_DIR/.env" 2>/dev/null; then
  sed -i "s|^NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=https://$BARU|" "$APP_DIR/.env"
else
  echo "NEXT_PUBLIC_SITE_URL=https://$BARU" >> "$APP_DIR/.env"
fi
echo "  .env  -> NEXT_PUBLIC_SITE_URL=https://$BARU"

# IP Cloudflare dipercaya sebagai proxy, supaya IP asli pengunjung (CF-Connecting-IP /
# X-Forwarded-For) sampai ke aplikasi. Tanpa ini semua pengunjung terlihat sebagai segelintir
# IP Cloudflare dan rate limit pencarian/masukan ikut memblokir pengguna sah.
CF_IPS="$( { curl -fsS --max-time 15 https://www.cloudflare.com/ips-v4; echo; curl -fsS --max-time 15 https://www.cloudflare.com/ips-v6; } 2>/dev/null \
  | grep -E '^[0-9a-fA-F:.]+/[0-9]+$' | tr '\n' ' ')"
# cadangan kalau unduhan gagal (daftar resmi per 2026-11)
[ -n "$CF_IPS" ] || CF_IPS="173.245.48.0/20 103.21.244.0/22 103.22.200.0/22 103.31.4.0/22 141.101.64.0/18 108.162.192.0/18 190.93.240.0/20 188.114.96.0/20 197.234.240.0/22 198.41.128.0/17 162.158.0.0/15 104.16.0.0/13 104.24.0.0/14 172.64.0.0/13 131.0.72.0/22 2400:cb00::/32 2606:4700::/32 2803:f800::/32 2405:b500::/32 2405:8100::/32 2a06:98c0::/29 2c0f:f248::/32"
GLOBAL="{
	servers {
		trusted_proxies static $CF_IPS
		client_ip_headers CF-Connecting-IP X-Forwarded-For
	}
}
"

# 2. Caddyfile. Kalau sertifikat origin sudah ada -> HTTPS (Cloudflare Full strict).
#    Kalau belum -> HTTP saja di port 80 (Cloudflare SSL mode "Flexible"); visitor tetap
#    dapat HTTPS dari edge Cloudflare. Tambah sertifikat lalu jalankan lagi untuk naik ke HTTPS.
if [ -s "$CERT_DIR/origin.pem" ] && [ -s "$CERT_DIR/origin.key" ]; then
  MODE=https
  cat > "$CADDYFILE" <<EOF
$GLOBAL
# Domain situs PerwiraMedia Docs. Ganti dengan:
#   bash $APP_DIR/deploy/ganti-domain.sh <domain-baru>
$BARU {
    encode gzip zstd
    # Sertifikat origin dari Cloudflare (SSL/TLS mode: Full strict)
    tls $CERT_DIR/origin.pem $CERT_DIR/origin.key
    reverse_proxy 127.0.0.1:3000 {
        # timpa XFF dengan IP terverifikasi; XFF kiriman pengunjung ikut diteruskan Cloudflare
        # dan bisa dipalsukan untuk membobol rate limit
        header_up X-Forwarded-For {client_ip}
    }
}
EOF
else
  MODE=http
  cat > "$CADDYFILE" <<EOF
$GLOBAL
# Domain situs PerwiraMedia Docs (mode HTTP; SSL dipegang Cloudflare, SSL mode: Flexible).
# Untuk HTTPS di origin: pasang $CERT_DIR/origin.pem & origin.key lalu jalankan lagi script ini.
#   bash $APP_DIR/deploy/ganti-domain.sh <domain-baru>
http://$BARU {
    encode gzip zstd
    reverse_proxy 127.0.0.1:3000 {
        # timpa XFF dengan IP terverifikasi; XFF kiriman pengunjung ikut diteruskan Cloudflare
        # dan bisa dipalsukan untuk membobol rate limit
        header_up X-Forwarded-For {client_ip}
    }
}
EOF
fi
echo "  Caddyfile -> $BARU (mode $MODE)"

# 3. terapkan
systemctl restart perwira-docs 2>/dev/null || true
if caddy validate --config "$CADDYFILE" >/dev/null 2>&1; then
  systemctl enable caddy >/dev/null 2>&1 || true
  systemctl reload caddy 2>/dev/null || systemctl restart caddy
  if [ "$MODE" = https ]; then
    echo "Selesai (HTTPS). Situs: https://$BARU  | Cloudflare SSL mode: Full (strict)"
  else
    echo "Selesai (HTTP origin, SSL dari Cloudflare). Situs: https://$BARU"
    echo "Di Cloudflare: SSL/TLS mode = Flexible, Edge Certificates > Always Use HTTPS = ON."
  fi
else
  echo "Caddyfile tidak valid, cek: caddy validate --config $CADDYFILE"; exit 1
fi
