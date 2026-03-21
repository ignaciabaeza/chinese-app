#!/bin/bash
# =============================================================================
# deploy.sh — Re-deploy latest code on the server
#
# Run this on the EC2 t3.micro (Ubuntu) whenever you push new changes:
#   sudo ./scripts/deploy.sh
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $1"; }
success() { echo -e "${GREEN}[OK]${NC}    $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

[[ $EUID -ne 0 ]] && error "Run with sudo: sudo ./deploy.sh"

APP_DIR="/opt/chinese-app"
APP_USER="appuser"

[[ ! -d "$APP_DIR" ]] && error "$APP_DIR not found — run setup.sh first"

info "Pulling latest code…"
sudo -u $APP_USER git -C "$APP_DIR" pull

info "Installing dependencies…"
sudo -u $APP_USER bash -c "cd $APP_DIR && npm ci --silent"

info "Running database migrations…"
sudo -u $APP_USER bash -c "cd $APP_DIR && npx prisma migrate deploy"

info "Building…"
sudo -u $APP_USER bash -c "cd $APP_DIR && npm run build"

info "Restarting app…"
sudo -u $APP_USER pm2 restart chinese-app

success "Deploy complete — $(date)"
