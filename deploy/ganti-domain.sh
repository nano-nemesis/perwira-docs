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

# 2. Caddyfile. Kalau sertifikat origin sudah ada -> HTTPS (Cloudflare Full strict).
#    Kalau belum -> HTTP saja di port 80 (Cloudflare SSL mode "Flexible"); visitor tetap
#    dapat HTTPS dari edge Cloudflare. Tambah sertifikat lalu jalankan lagi untuk naik ke HTTPS.
if [ -s "$CERT_DIR/origin.pem" ] && [ -s "$CERT_DIR/origin.key" ]; then
  MODE=https
  cat > "$CADDYFILE" <<EOF
# Domain situs PerwiraMedia Docs. Ganti dengan:
#   bash $APP_DIR/deploy/ganti-domain.sh <domain-baru>
$BARU {
    encode gzip zstd
    # Sertifikat origin dari Cloudflare (SSL/TLS mode: Full strict)
    tls $CERT_DIR/origin.pem $CERT_DIR/origin.key
    reverse_proxy 127.0.0.1:3000
}
EOF
else
  MODE=http
  cat > "$CADDYFILE" <<EOF
# Domain situs PerwiraMedia Docs (mode HTTP; Cloudflare SSL mode: Flexible).
# Untuk HTTPS di origin: pasang $CERT_DIR/origin.pem & origin.key lalu jalankan lagi script ini.
#   bash $APP_DIR/deploy/ganti-domain.sh <domain-baru>
http://$BARU {
    encode gzip zstd
    reverse_proxy 127.0.0.1:3000
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
    echo "Selesai (HTTP origin). Situs: https://$BARU  | SET Cloudflare SSL mode: Flexible"
  fi
else
  echo "Caddyfile tidak valid, cek: caddy validate --config $CADDYFILE"; exit 1
fi
