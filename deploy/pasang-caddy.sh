#!/usr/bin/env bash
#
# Pasang Caddy sebagai reverse proxy HTTPS untuk PerwiraMedia Docs, di belakang Cloudflare
# (A record proxied / awan oranye) memakai Cloudflare Origin Certificate.
#
#   DOMAIN=docs.contoh.com bash pasang-caddy.sh
#
# Langkah yang dilakukan:
#   1. Pasang Caddy (repo resmi) kalau belum ada.
#   2. Ikat aplikasi Next ke 127.0.0.1 saja (tidak langsung terekspos ke internet).
#   3. Tulis Caddyfile untuk DOMAIN (lewat ganti-domain.sh).
#   4. Pasang firewall ufw (izinkan 22/80/443).
#   5. Start Caddy kalau sertifikat origin sudah ada; kalau belum, cetak petunjuk.
#
set -euo pipefail

APP_DIR="${APP_DIR:-/srv/perwira-docs}"
CERT_DIR="${CERT_DIR:-/etc/perwira-docs}"
DOMAIN="${DOMAIN:-}"
# kalau DOMAIN tidak diisi, ambil dari .env aplikasi
[ -z "$DOMAIN" ] && DOMAIN="$(grep -oP '^NEXT_PUBLIC_SITE_URL=https?://\K[^/]+' "$APP_DIR/.env" 2>/dev/null || true)"
[ -n "$DOMAIN" ] || { echo "Set DOMAIN, contoh: DOMAIN=docs.perwiramedia.com bash pasang-caddy.sh"; exit 1; }
[ "$(id -u)" -eq 0 ] || { echo "Jalankan sebagai root."; exit 1; }

echo "==> Domain: $DOMAIN"

# 1. Pasang Caddy
if ! command -v caddy >/dev/null 2>&1; then
  echo "==> Memasang Caddy (repo resmi)"
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl gnupg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list >/dev/null
  apt-get update -y && apt-get install -y caddy
else
  echo "==> Caddy sudah terpasang"
fi

mkdir -p "$CERT_DIR"; chmod 700 "$CERT_DIR"

# 2. Ikat aplikasi ke localhost saja (di balik Caddy), lewat drop-in systemd.
#    next start tidak membaca env HOSTNAME, jadi override ExecStart dengan flag -H.
echo "==> Mengikat aplikasi ke 127.0.0.1 (hanya lewat Caddy)"
NPM_BIN="$(command -v npm)"
mkdir -p /etc/systemd/system/perwira-docs.service.d
cat > /etc/systemd/system/perwira-docs.service.d/bind-localhost.conf <<EOF
[Service]
ExecStart=
ExecStart=$NPM_BIN start -- -H 127.0.0.1
EOF
systemctl daemon-reload
systemctl restart perwira-docs 2>/dev/null || true

# 3. Caddyfile untuk DOMAIN
echo "==> Menulis Caddyfile"
DOMAIN="$DOMAIN" bash "$APP_DIR/deploy/ganti-domain.sh" "$DOMAIN" || true

# 4. Firewall
echo "==> Firewall (ufw): izinkan SSH, HTTP, HTTPS"
command -v ufw >/dev/null 2>&1 || apt-get install -y ufw
ufw allow 22/tcp >/dev/null; ufw allow 80/tcp >/dev/null; ufw allow 443/tcp >/dev/null
yes | ufw enable >/dev/null 2>&1 || ufw --force enable

# 5. Start Caddy kalau sertifikat sudah ada
echo
if [ -s "$CERT_DIR/origin.pem" ] && [ -s "$CERT_DIR/origin.key" ]; then
  systemctl enable caddy >/dev/null 2>&1 || true
  systemctl restart caddy
  sleep 2
  systemctl is-active --quiet caddy && echo "Caddy aktif. Situs: https://$DOMAIN" || echo "Caddy gagal start, cek: journalctl -u caddy -n 30"
else
  cat <<PETUNJUK
Caddy belum bisa start: sertifikat origin belum ada.

Buat di Cloudflare: SSL/TLS > Origin Server > Create Certificate.
  - Hostnames: $DOMAIN  (disarankan tambah wildcard: *.${DOMAIN#*.} dan ${DOMAIN#*.})
  - Simpan isinya di VPS:
      $CERT_DIR/origin.pem   <- isi "Origin Certificate"
      $CERT_DIR/origin.key   <- isi "Private Key"
  - chmod 600 $CERT_DIR/origin.key
Lalu: systemctl restart caddy

Terakhir di Cloudflare: SSL/TLS > Overview > set mode ke "Full (strict)".
PETUNJUK
fi
