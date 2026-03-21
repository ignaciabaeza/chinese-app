#!/bin/bash
# =============================================================================
# setup.sh — One-time server setup for 汉语学习 on EC2 (Ubuntu 24.04 LTS)
#
# Run this ONCE on a fresh EC2 t3.micro instance:
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
read -rp "PostgreSQL app user password: "                                    DB_PASSWORD
read -rp "Anthropic API key (sk-ant-...): "                                  ANTHROPIC_API_KEY
read -rp "JWT secret (press Enter to auto-generate): "                       JWT_SECRET_INPUT

JWT_SECRET="${JWT_SECRET_INPUT:-$(openssl rand -base64 32)}"
DB_NAME="chinese_app"
DB_USER="chinese_app_user"
APP_DIR="/opt/chinese-app"
APP_USER="appuser"
NODE_VERSION="20"

# URL-encode the DB password so special characters don't break the connection string
DB_PASSWORD_ENCODED=$(python3 -c "import urllib.parse; print(urllib.parse.quote('${DB_PASSWORD}', safe=''))")

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

# ── 3. Install Node.js 20 ─────────────────────────────────────────────────────
info "Installing Node.js ${NODE_VERSION}…"
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt-get install -y -q nodejs
success "Node.js installed: $(node --version)"

# ── 4. Install PostgreSQL 16 ──────────────────────────────────────────────────
info "Installing PostgreSQL 16…"
apt-get install -y -q postgresql postgresql-contrib
systemctl enable postgresql
systemctl start postgresql
success "PostgreSQL installed and running"

# ── 5. Configure PostgreSQL ───────────────────────────────────────────────────
info "Creating database and user…"
sudo -u postgres psql <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}';
  END IF;
END
\$\$;

SELECT 'CREATE DATABASE ${DB_NAME} OWNER ${DB_USER}'
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${DB_NAME}')\gexec
GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};
SQL

# Ubuntu PostgreSQL uses peer auth by default for local connections.
# Switch to md5 so our app user can authenticate with a password.
PG_HBA=$(find /etc/postgresql -name "pg_hba.conf" 2>/dev/null | head -1)
if [[ -n "$PG_HBA" ]]; then
  sed -i 's/^local\s\+all\s\+all\s\+peer/local   all             all                                     md5/' "$PG_HBA"
  systemctl restart postgresql
fi
success "Database '${DB_NAME}' and user '${DB_USER}' ready"

# ── 6. Create app system user ─────────────────────────────────────────────────
info "Creating system user '${APP_USER}'…"
if ! id "$APP_USER" &>/dev/null; then
  useradd -r -m -d /home/$APP_USER -s /bin/bash $APP_USER
fi
success "User '${APP_USER}' ready"

# ── 7. Install PM2 globally ───────────────────────────────────────────────────
info "Installing PM2…"
npm install -g pm2 --silent
success "PM2 installed: $(pm2 --version)"

# ── 8. Clone the repository ───────────────────────────────────────────────────
info "Cloning repository…"
if [[ -d "$APP_DIR" ]]; then
  warn "Directory $APP_DIR already exists — pulling latest"
  cd "$APP_DIR" && git pull
else
  git clone "$REPO_URL" "$APP_DIR"
fi
chown -R $APP_USER:$APP_USER "$APP_DIR"
success "Repository cloned to $APP_DIR"

# ── 9. Write .env ─────────────────────────────────────────────────────────────
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

# ── 10. Install dependencies, migrate, build ──────────────────────────────────
info "Installing npm dependencies…"
sudo -u $APP_USER bash -c "cd $APP_DIR && npm ci --silent"

info "Running Prisma migrations…"
sudo -u $APP_USER bash -c "cd $APP_DIR && npx prisma migrate deploy"

info "Building Next.js app (this takes a minute)…"
sudo -u $APP_USER bash -c "cd $APP_DIR && npm run build"
success "App built successfully"

# ── 11. Start app with PM2 ────────────────────────────────────────────────────
info "Starting app with PM2…"
sudo -u $APP_USER bash -c "
  cd $APP_DIR
  pm2 delete chinese-app 2>/dev/null || true
  pm2 start npm --name chinese-app -- start
  pm2 save
"
# Register PM2 startup on reboot
env PATH=$PATH:/usr/bin pm2 startup systemd -u $APP_USER --hp /home/$APP_USER
sudo -u $APP_USER pm2 save
success "App running with PM2"

# ── 12. Install and configure Nginx ───────────────────────────────────────────
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
echo "  Logs:        sudo -u ${APP_USER} pm2 logs chinese-app"
echo "  Status:      sudo -u ${APP_USER} pm2 status"
echo "  Restart app: sudo -u ${APP_USER} pm2 restart chinese-app"
echo ""
echo -e "${YELLOW}Next step — enable HTTPS (requires a real domain):${NC}"
echo "  sudo apt-get install -y certbot python3-certbot-nginx"
echo "  sudo certbot --nginx -d ${APP_DOMAIN}"
echo ""
echo -e "${YELLOW}Remember to open ports 80 and 443 in your EC2 Security Group!${NC}"
echo ""
