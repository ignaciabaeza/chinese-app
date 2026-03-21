#!/bin/bash
# =============================================================================
# setup.sh — One-time server setup for 汉语学习 on EC2 (Ubuntu 24.04 LTS)
#
# Run this ONCE on a fresh EC2 t3.small instance:
#   chmod +x setup.sh && sudo ./setup.sh
# =============================================================================
set -euo pipefail

# ── Colours ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $1"; }
success() { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ── Must run as root ──────────────────────────────────────────────────────────
[[ $EUID -ne 0 ]] && error "Run with sudo: sudo ./setup.sh"

echo ""
echo "================================================="
echo "   汉语学习 · Chinese Learning App — Server Setup"
echo "================================================="
echo ""

# ── Collect configuration ─────────────────────────────────────────────────────
read -rp "GitHub repo URL (e.g. https://github.com/you/chinese-app.git): " REPO_URL
read -rp "App domain or EC2 public IP (e.g. 54.123.45.67 or myapp.com): "   APP_DOMAIN
read -rp "PostgreSQL app user password (letters and numbers only): "         DB_PASSWORD
read -rp "Anthropic API key (sk-ant-...): "                                  ANTHROPIC_API_KEY
read -rp "JWT secret (press Enter to auto-generate): "                       JWT_SECRET_INPUT

JWT_SECRET="${JWT_SECRET_INPUT:-$(openssl rand -base64 32)}"
DB_NAME="chinese_app"
DB_USER="chinese_app_user"
APP_DIR="/opt/chinese-app"
APP_USER="appuser"
NODE_VERSION="20"
PM2_BIN="/usr/local/bin/pm2"

# URL-encode the DB password — pass as command-line argument to python3
DB_PASSWORD_ENCODED=$(python3 -c "import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$DB_PASSWORD")

echo ""
info "Starting setup with:"
echo "  Repo:    $REPO_URL"
echo "  Domain:  $APP_DOMAIN"
echo "  App dir: $APP_DIR"
echo ""

# ── 1. System update ──────────────────────────────────────────────────────────
info "Updating system packages…"
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get upgrade -y -q
success "System updated"

# ── 2. Install essentials ─────────────────────────────────────────────────────
info "Installing git, curl, openssl…"
apt-get install -y -q git curl openssl ca-certificates gnupg
success "Essentials installed"

# ── 3. Add swap (safety net) ──────────────────────────────────────────────────
if [[ ! -f /swapfile ]]; then
  info "Adding 1GB swap…"
  fallocate -l 1G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  success "Swap enabled"
fi

# ── 4. Install Node.js 20 ─────────────────────────────────────────────────────
info "Installing Node.js ${NODE_VERSION}…"
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt-get install -y -q nodejs
success "Node.js installed: $(node --version)"

# ── 5. Install PostgreSQL ─────────────────────────────────────────────────────
info "Installing PostgreSQL…"
apt-get install -y -q postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql
success "PostgreSQL installed and running"

# ── 6. Configure PostgreSQL ───────────────────────────────────────────────────
info "Creating database and user…"

# Escape single quotes in password for SQL safety
DB_PASSWORD_SQL="${DB_PASSWORD//\'/\'\'}"

sudo -u postgres psql <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD_SQL}';
  END IF;
END
\$\$;

SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
SQL

# Switch local connections from peer to md5 and host connections to md5
# Handles both old (peer) and new (scram-sha-256) default formats
PG_HBA=$(find /etc/postgresql -name "pg_hba.conf" 2>/dev/null | head -1)
if [[ -n "$PG_HBA" ]]; then
  sed -i 's/peer/md5/g' "$PG_HBA"
  sed -i 's/scram-sha-256/md5/g' "$PG_HBA"
  systemctl restart postgresql
fi
success "Database '${DB_NAME}' and user '${DB_USER}' ready"

# ── 7. Create app system user ─────────────────────────────────────────────────
info "Creating system user '${APP_USER}'…"
if ! id "$APP_USER" &>/dev/null; then
  useradd -m -d /home/$APP_USER -s /bin/bash $APP_USER
fi
success "User '${APP_USER}' ready"

# ── 8. Install PM2 globally ───────────────────────────────────────────────────
info "Installing PM2…"
npm install -g pm2
success "PM2 installed: $($PM2_BIN --version)"

# ── 9. Clone the repository ───────────────────────────────────────────────────
info "Cloning repository…"
git config --global --add safe.directory "$APP_DIR"
if [[ -d "$APP_DIR" ]]; then
  warn "Directory $APP_DIR already exists — pulling latest"
  git -C "$APP_DIR" pull
else
  git clone "$REPO_URL" "$APP_DIR"
fi
chown -R $APP_USER:$APP_USER "$APP_DIR"
success "Repository cloned to $APP_DIR"

# ── 10. Write .env ────────────────────────────────────────────────────────────
info "Writing .env file…"
cat > "$APP_DIR/.env" <<ENV
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD_ENCODED}@localhost:5432/${DB_NAME}"
JWT_SECRET="${JWT_SECRET}"
ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY}"
NODE_ENV="production"
ENV
chown $APP_USER:$APP_USER "$APP_DIR/.env"
chmod 600 "$APP_DIR/.env"
success ".env written"

# ── 11. Install dependencies ──────────────────────────────────────────────────
info "Installing npm dependencies…"
# Use -H to set HOME correctly for npm cache
sudo -H -u $APP_USER bash -c "cd $APP_DIR && npm ci"
success "Dependencies installed"

# ── 12. Generate Prisma client ────────────────────────────────────────────────
info "Generating Prisma client…"
sudo -H -u $APP_USER bash -c "cd $APP_DIR && npx prisma generate"
success "Prisma client generated"

# ── 13. Apply database schema ─────────────────────────────────────────────────
info "Applying database schema…"
# Use db push — works whether or not migration files exist in the repo
sudo -H -u $APP_USER bash -c "cd $APP_DIR && npx prisma db push --accept-data-loss"
success "Database schema applied"

# ── 14. Build Next.js ─────────────────────────────────────────────────────────
info "Building Next.js app (this takes a minute)…"
sudo -H -u $APP_USER bash -c "cd $APP_DIR && npm run build"
success "App built successfully"

# ── 15. Start app with PM2 ────────────────────────────────────────────────────
info "Starting app with PM2…"
sudo -H -u $APP_USER bash -c "
  $PM2_BIN delete chinese-app 2>/dev/null || true
  cd $APP_DIR
  $PM2_BIN start npm --name chinese-app -- start
  $PM2_BIN save
"
# Generate and install the systemd startup service
$PM2_BIN startup systemd -u $APP_USER --hp /home/$APP_USER
systemctl enable pm2-$APP_USER
success "App running with PM2"

# ── 16. Install and configure Nginx ───────────────────────────────────────────
info "Installing Nginx…"
apt-get install -y -q nginx
systemctl enable nginx

# Remove default site
rm -f /etc/nginx/sites-enabled/default

cat > /etc/nginx/sites-available/chinese-app <<NGINX
server {
    listen 80;
    server_name ${APP_DOMAIN};

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    # Proxy to Next.js
    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Cache static Next.js assets
    location /_next/static/ {
        proxy_pass       http://127.0.0.1:3000;
        proxy_cache_bypass \$http_upgrade;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
NGINX

ln -sf /etc/nginx/sites-available/chinese-app /etc/nginx/sites-enabled/chinese-app
nginx -t && systemctl restart nginx
success "Nginx configured and running"

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "================================================="
echo -e "${GREEN}   Setup complete!${NC}"
echo "================================================="
echo ""
echo "  App URL:     http://${APP_DOMAIN}"
echo "  App dir:     ${APP_DIR}"
echo "  Logs:        sudo -u ${APP_USER} ${PM2_BIN} logs chinese-app"
echo "  Status:      sudo -u ${APP_USER} ${PM2_BIN} status"
echo "  Restart app: sudo -u ${APP_USER} ${PM2_BIN} restart chinese-app"
echo ""
echo -e "${YELLOW}Next step — enable HTTPS (requires a real domain):${NC}"
echo "  sudo apt-get install -y certbot python3-certbot-nginx"
echo "  sudo certbot --nginx -d ${APP_DOMAIN}"
echo ""
echo -e "${YELLOW}Remember to open ports 80 and 443 in your EC2 Security Group!${NC}"
echo ""
