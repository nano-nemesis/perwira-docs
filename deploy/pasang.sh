#!/usr/bin/env bash
#
# Pasang / perbarui PerwiraMedia Docs di VPS Linux.
# Jalankan lagi kapan saja: kalau folder sudah ada dan berisi git, script menarik versi
# terbaru lalu membangun ulang. Kalau belum ada, script meng-clone dari awal.
#
#   bash pasang.sh
#
# Atur lewat variabel lingkungan sebelum menjalankan, contoh:
#   REPO=https://github.com/nano-nemesis/perwira-docs.git DOMAIN=docs.perwiramedia.com bash pasang.sh
#
set -euo pipefail

# ----- pengaturan (ubah di sini atau lewat env) -----
REPO="${REPO:-https://github.com/nano-nemesis/perwira-docs.git}"
APP_DIR="${APP_DIR:-/srv/perwira-docs}"
DOMAIN="${DOMAIN:-}"                      # mis. docs.perwiramedia.com; kosong = isi .env manual nanti
PORT="${PORT:-3000}"
SERVICE="${SERVICE:-perwira-docs}"
RUN_USER="${RUN_USER:-$(id -un)}"
NODE_MIN_MAYOR=22                         # butuh Node 22.23.4+ atau 24.22.1+
BUILD_MEM_MB=8192                         # build Next butuh memori besar; buat swap kalau kurang

# ----- tampilan -----
merah='\033[0;31m'; hijau='\033[0;32m'; kuning='\033[0;33m'; biru='\033[0;34m'; nol='\033[0m'
info()  { echo -e "${biru}==>${nol} $*"; }
ok()    { echo -e "${hijau}  ok${nol} $*"; }
warn()  { echo -e "${kuning}  !${nol} $*"; }
mati()  { echo -e "${merah}  x${nol} $*" >&2; exit 1; }
ada()   { command -v "$1" >/dev/null 2>&1; }

# =====================================================================
# 1. Verifikasi spesifikasi VPS
# =====================================================================
info "Memeriksa spesifikasi VPS"

[ "$(uname -s)" = "Linux" ] || mati "Script ini untuk Linux."
ok "OS: $( (. /etc/os-release 2>/dev/null && echo "$PRETTY_NAME") || uname -sr)"

arch="$(uname -m)"
case "$arch" in
  x86_64|aarch64|arm64) ok "Arsitektur: $arch" ;;
  *) warn "Arsitektur $arch belum teruji (sharp/Next mungkin tidak jalan)." ;;
esac

# Node
if ada node; then
  node_ver="$(node -p 'process.versions.node')"
  node_mayor="${node_ver%%.*}"
  # butuh 22.23.4+ (seri 22) atau 24.22.1+ (seri 24 ke atas), sesuai engines di package.json
  minimal_ok() { [ "$(printf '%s\n%s\n' "$2" "$1" | sort -V | head -1)" = "$2" ]; }  # $1 >= $2 ?
  if   [ "$node_mayor" -ge 25 ]; then ok "Node $node_ver"
  elif [ "$node_mayor" -eq 24 ] && minimal_ok "$node_ver" 24.22.1; then ok "Node $node_ver"
  elif [ "$node_mayor" -eq 22 ] && minimal_ok "$node_ver" 22.23.4; then ok "Node $node_ver"
  else mati "Node $node_ver terlalu lama. Butuh 22.23.4+ atau 24.22.1+. Pasang dari nodejs.org atau nvm."
  fi
else
  mati "Node belum terpasang. Pasang Node ${NODE_MIN_MAYOR}+ dulu (nodejs.org / nvm / nodesource)."
fi

ada git || mati "git belum terpasang. Pasang: apt install git / dnf install git"
ada npm || mati "npm belum terpasang (biasanya sepaket dengan Node)."

# RAM + swap
ram_mb=$(( $(grep MemTotal /proc/meminfo | awk '{print $2}') / 1024 ))
swap_mb=$(( $(grep SwapTotal /proc/meminfo | awk '{print $2}') / 1024 ))
total_mb=$(( ram_mb + swap_mb ))
info "RAM ${ram_mb}MB + swap ${swap_mb}MB = ${total_mb}MB (build butuh ~${BUILD_MEM_MB}MB)"
if [ "$total_mb" -lt "$BUILD_MEM_MB" ]; then
  if [ "$(id -u)" -eq 0 ] && [ ! -f /swapfile ]; then
    tambah=$(( BUILD_MEM_MB - total_mb + 512 ))
    warn "Membuat /swapfile ${tambah}MB supaya build tidak kehabisan memori."
    fallocate -l "${tambah}M" /swapfile || dd if=/dev/zero of=/swapfile bs=1M count="$tambah"
    chmod 600 /swapfile; mkswap /swapfile >/dev/null; swapon /swapfile
    grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
    ok "Swap ditambahkan."
  else
    warn "Memori + swap kurang dari ${BUILD_MEM_MB}MB. Build bisa gagal (OOM). Tambah swap manual atau jalankan sebagai root agar dibuatkan."
  fi
fi

# Disk
disk_avail_mb=$(( $(df -Pk "$(dirname "$APP_DIR")" 2>/dev/null | awk 'NR==2{print $4}') / 1024 ))
if [ "${disk_avail_mb:-0}" -lt 2048 ]; then
  warn "Sisa disk ${disk_avail_mb}MB di $(dirname "$APP_DIR"). Disarankan minimal 2GB (node_modules + build + database)."
else
  ok "Sisa disk ${disk_avail_mb}MB"
fi

# =====================================================================
# 2. Ambil kode (clone baru / pull kalau sudah ada)
# =====================================================================
if [ -d "$APP_DIR/.git" ]; then
  info "Memperbarui kode di $APP_DIR"
  git -C "$APP_DIR" fetch --prune origin
  cabang="$(git -C "$APP_DIR" rev-parse --abbrev-ref HEAD)"
  git -C "$APP_DIR" reset --hard "origin/$cabang"
  ok "Ditarik ke versi terbaru cabang $cabang"
else
  info "Meng-clone $REPO ke $APP_DIR"
  mkdir -p "$(dirname "$APP_DIR")"
  git clone "$REPO" "$APP_DIR"
  ok "Clone selesai"
fi
cd "$APP_DIR"

# =====================================================================
# 3. Berkas .env (dibuat sekali, tidak ditimpa saat update)
# =====================================================================
if [ ! -f .env ]; then
  info "Membuat .env"
  [ -f .env.example ] && cp .env.example .env || : > .env
  rahasia="$(node -e 'console.log(require("crypto").randomBytes(24).toString("hex"))')"
  set_env() { grep -q "^$1=" .env && sed -i "s|^$1=.*|$1=$2|" .env || echo "$1=$2" >> .env; }
  set_env PAYLOAD_SECRET "$rahasia"
  set_env DATABASE_URL "file:./payload.db"
  [ -n "$DOMAIN" ] && set_env NEXT_PUBLIC_SITE_URL "https://$DOMAIN"
  ok "PAYLOAD_SECRET dibuat otomatis."
  [ -z "$DOMAIN" ] && warn "NEXT_PUBLIC_SITE_URL belum diisi. Edit .env: set ke https://domain-kamu sebelum dipakai publik."
  warn "Isi SMTP_* di .env kalau mau fitur reset password lewat email."
else
  ok ".env sudah ada, tidak diubah."
fi

# =====================================================================
# 4. Dependency, migrasi database, build
# =====================================================================
info "Memasang dependency (npm ci)"
npm ci

info "Menjalankan migrasi database"
# Aman diulang: migrasi yang sudah pernah jalan dilewati. DB & skema dibuat kalau belum ada.
NODE_ENV=production npx payload migrate

info "Build produksi (bisa beberapa menit)"
npm run build
ok "Build selesai"

# =====================================================================
# 5. systemd service (hidup lagi setelah reboot, restart otomatis kalau mati)
# =====================================================================
unit="/etc/systemd/system/${SERVICE}.service"
if [ "$(id -u)" -eq 0 ]; then
  info "Memasang systemd service: $SERVICE"
  node_bin="$(command -v node)"; npm_bin="$(command -v npm)"
  cat > "$unit" <<UNIT
[Unit]
Description=PerwiraMedia Docs (Next.js + Payload)
After=network.target

[Service]
Type=simple
User=$RUN_USER
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
Environment=PORT=$PORT
Environment=PATH=$(dirname "$node_bin"):/usr/local/bin:/usr/bin:/bin
ExecStart=$npm_bin start
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT
  systemctl daemon-reload
  systemctl enable "$SERVICE" >/dev/null 2>&1 || true
  systemctl restart "$SERVICE"
  sleep 2
  systemctl is-active --quiet "$SERVICE" && ok "Service $SERVICE aktif di port $PORT" || mati "Service gagal start. Cek: journalctl -u $SERVICE -n 50"
else
  warn "Bukan root: systemd service dilewati. Jalankan manual: npm start"
  warn "Atau jalankan ulang script ini sebagai root untuk memasang service."
fi

# =====================================================================
# 6. Petunjuk lanjutan
# =====================================================================
echo
info "Selesai."
echo "  Aplikasi berjalan di http://127.0.0.1:$PORT"
echo "  Admin: /tuan  (akun pertama dibuat lewat /tuan di browser, lalu aktifkan 2FA)"
echo
echo "  Langkah berikutnya:"
echo "   1. Arahkan domain ke VPS, pasang reverse proxy HTTPS. Contoh Caddy (/etc/caddy/Caddyfile):"
echo
echo "        ${DOMAIN:-docs.contoh.com} {"
echo "            encode gzip"
echo "            reverse_proxy 127.0.0.1:$PORT"
echo "        }"
echo
echo "   2. Batasi laju /api/* di reverse proxy (mis. 30 req/menit per IP)."
echo "   3. Cadangkan payload.db dan folder media/ secara rutin."
echo "   4. Update kapan saja: jalankan lagi script ini (git pull + migrate + build + restart)."
