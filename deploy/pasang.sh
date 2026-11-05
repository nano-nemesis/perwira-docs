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

# ----- pemasangan paket otomatis -----
NODE_SERI="${NODE_SERI:-22}"            # seri Node yang dipasang kalau belum ada (22 = LTS; 24 juga boleh)

# deteksi package manager distro
PM=""
if   ada apt-get; then PM=apt
elif ada dnf;     then PM=dnf
elif ada yum;     then PM=yum
elif ada apk;     then PM=apk
elif ada pacman;  then PM=pacman
fi

# jalankan perintah sebagai root (langsung kalau sudah root, pakai sudo kalau ada)
sbg_root() {
  if [ "$(id -u)" -eq 0 ]; then "$@"
  elif ada sudo; then sudo "$@"
  else mati "Butuh akses root untuk: $*. Jalankan script sebagai root atau pasang sudo."
  fi
}

# pasang paket sistem lewat package manager yang terdeteksi
pasang_paket() {
  case "$PM" in
    apt)    sbg_root apt-get update -y && sbg_root apt-get install -y "$@" ;;
    dnf)    sbg_root dnf install -y "$@" ;;
    yum)    sbg_root yum install -y "$@" ;;
    apk)    sbg_root apk add --no-cache "$@" ;;
    pacman) sbg_root pacman -Sy --noconfirm "$@" ;;
    *)      return 1 ;;
  esac
}

# pasang Node seri $NODE_SERI (NodeSource untuk apt/dnf/yum, bawaan distro untuk lainnya; nvm sebagai cadangan)
pasang_node() {
  info "Memasang Node ${NODE_SERI}.x"
  case "$PM" in
    apt)
      curl -fsSL "https://deb.nodesource.com/setup_${NODE_SERI}.x" -o /tmp/nodesource.sh \
        && sbg_root bash /tmp/nodesource.sh && sbg_root apt-get install -y nodejs && return 0 ;;
    dnf|yum)
      curl -fsSL "https://rpm.nodesource.com/setup_${NODE_SERI}.x" -o /tmp/nodesource.sh \
        && sbg_root bash /tmp/nodesource.sh && pasang_paket nodejs && return 0 ;;
    apk)     pasang_paket nodejs npm && return 0 ;;
    pacman)  pasang_paket nodejs npm && return 0 ;;
  esac
  # cadangan: nvm (level user, tidak butuh root)
  warn "Memasang Node lewat nvm (cadangan)."
  export NVM_DIR="$HOME/.nvm"
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"
  nvm install "$NODE_SERI" && nvm alias default "$NODE_SERI"
}

node_cukup() {
  ada node || return 1
  local v m; v="$(node -p 'process.versions.node')"; m="${v%%.*}"
  minimal_ok() { [ "$(printf '%s\n%s\n' "$2" "$1" | sort -V | head -1)" = "$2" ]; }  # $1 >= $2 ?
  [ "$m" -ge 25 ] || { [ "$m" -eq 24 ] && minimal_ok "$v" 24.22.1; } || { [ "$m" -eq 22 ] && minimal_ok "$v" 22.23.4; }
}

# =====================================================================
# 1. Verifikasi spesifikasi VPS (pasang yang kurang)
# =====================================================================
info "Memeriksa spesifikasi VPS"
[ -n "$PM" ] && ok "Package manager: $PM" || warn "Package manager tak dikenal; Node/git dipasang lewat cara cadangan."

[ "$(uname -s)" = "Linux" ] || mati "Script ini untuk Linux."
ok "OS: $( (. /etc/os-release 2>/dev/null && echo "$PRETTY_NAME") || uname -sr)"

arch="$(uname -m)"
case "$arch" in
  x86_64|aarch64|arm64) ok "Arsitektur: $arch" ;;
  *) warn "Arsitektur $arch belum teruji (sharp/Next mungkin tidak jalan)." ;;
esac

# curl & git: dipasang kalau belum ada
for alat in curl git; do
  if ada "$alat"; then ok "$alat terpasang"
  else info "Memasang $alat"; pasang_paket "$alat" || mati "Gagal memasang $alat. Pasang manual lalu jalankan lagi."; ok "$alat terpasang"; fi
done

# Node: pasang kalau belum ada / versinya kurang (butuh 22.23.4+ atau 24.22.1+, sesuai engines)
if node_cukup; then
  ok "Node $(node -p 'process.versions.node')"
else
  if ada node; then warn "Node $(node -p 'process.versions.node') terlalu lama, memasang yang lebih baru"; fi
  pasang_node
  ada nvm 2>/dev/null || { export NVM_DIR="$HOME/.nvm"; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; }
  hash -r
  node_cukup || mati "Node masih di bawah syarat setelah pemasangan. Pasang manual Node ${NODE_SERI}.x dari nodejs.org, lalu jalankan lagi."
  ok "Node $(node -p 'process.versions.node') terpasang"
fi
ada npm || mati "npm tidak ikut terpasang bersama Node. Periksa instalasi Node."

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
# beberapa modul mungkin perlu dikompilasi; kalau gagal, pasang build tools lalu coba lagi sekali
if ! npm ci; then
  warn "npm ci gagal. Memasang build tools (compiler, make, python3) lalu mencoba lagi."
  case "$PM" in
    apt)         pasang_paket build-essential python3 || true ;;
    dnf|yum)     pasang_paket gcc gcc-c++ make python3 || true ;;
    apk)         pasang_paket build-base python3 || true ;;
    pacman)      pasang_paket base-devel python || true ;;
    *)           warn "Package manager tak dikenal; pasang compiler/make/python manual kalau masih gagal." ;;
  esac
  npm ci || mati "npm ci tetap gagal. Cek pesan error di atas (sering karena build tools atau versi Node)."
fi

# sharp butuh binary native sesuai OS/arsitektur/libc. Kalau tidak termuat (gagal terunduh saat
# npm ci, atau glibc VPS terlalu lama), payload migrate dan build akan crash. Uji lalu pasang ulang.
info "Memeriksa sharp (pengolah gambar)"
if node -e 'require("sharp")' >/dev/null 2>&1; then
  ok "sharp termuat"
else
  warn "sharp tidak termuat. Memasang ulang binary sharp untuk platform ini."
  rm -rf node_modules/sharp node_modules/@img
  npm install sharp --include=optional --foreground-scripts >/dev/null 2>&1 || true
  if node -e 'require("sharp")' >/dev/null 2>&1; then
    ok "sharp OK setelah dipasang ulang"
  else
    echo; warn "Pesan asli sharp:"; node -e 'require("sharp")' 2>&1 | head -4 || true
    mati "sharp tidak bisa jalan di VPS ini. Penyebab umum: glibc terlalu lama (butuh distro lebih baru, mis. Ubuntu 22.04+/Debian 12+). Alternatif: pasang libvips sistem (apt install libvips-dev) lalu: npm install --build-from-source sharp"
  fi
fi

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
