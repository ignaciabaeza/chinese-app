#!/bin/bash
# =============================================================================
# deploy.sh — Re-deploy latest code on the EC2 server.
#
# Pulls the latest code, installs deps, builds, applies any pending DB
# migrations (with a pg_dump backup first), and restarts the app.
#
# Run on the server whenever you push new changes:
#   sudo ./scripts/deploy.sh
#
# Migrations live in scripts/migrations/*.sql and are applied in filename
# order. Applied migrations are recorded in the `schema_migrations` table so
# each one runs at most once.
# =============================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $1"; }
success() { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

[[ $EUID -ne 0 ]] && error "Run with sudo: sudo ./scripts/deploy.sh"

APP_DIR="/opt/chinese-app"
APP_USER="appuser"
DB_NAME="chinese_app"
MIGRATIONS_DIR="$APP_DIR/scripts/migrations"
BACKUP_DIR="/var/backups/chinese-app"
PM2_BIN="/usr/bin/pm2"

[[ ! -d "$APP_DIR" ]] && error "$APP_DIR not found — run setup.sh first"

# ── 1. Sync to origin/main exactly ───────────────────────────────────────────
# `fetch + reset --hard` instead of `pull` so the box always mirrors origin —
# immune to force-pushes, divergent local commits, or stray edits on the
# server. The deploy box should never hold uncommitted work.
info "Fetching latest code…"
sudo -u $APP_USER git -C "$APP_DIR" fetch origin
sudo -u $APP_USER git -C "$APP_DIR" reset --hard origin/main

# ── 2. Install deps + build (old app keeps serving during this) ──────────────
info "Installing dependencies…"
sudo -u $APP_USER bash -c "cd $APP_DIR && npm ci --silent"

info "Building (clean — wiping .next so Turbopack doesn't serve a stale chunk)…"
sudo -u $APP_USER rm -rf "$APP_DIR/.next"
sudo -u $APP_USER bash -c "cd $APP_DIR && npm run build"

# ── 3. Detect pending migrations ─────────────────────────────────────────────
PENDING=()
if [[ -d "$MIGRATIONS_DIR" ]]; then
  # Ensure the tracker table exists (no-op if setup.sh already created it).
  sudo -u postgres psql -d "$DB_NAME" -v ON_ERROR_STOP=1 -c \
    "CREATE TABLE IF NOT EXISTS schema_migrations (filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW());" \
    >/dev/null

  while IFS= read -r migration; do
    [[ -z "$migration" ]] && continue
    name=$(basename "$migration")
    applied=$(sudo -u postgres psql -d "$DB_NAME" -tAc \
      "SELECT 1 FROM schema_migrations WHERE filename = '$name'")
    [[ -z "$applied" ]] && PENDING+=("$migration")
  done < <(ls "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort)
fi

# ── 4. Apply migrations (if any) with a backup + brief downtime ──────────────
if [[ ${#PENDING[@]} -gt 0 ]]; then
  info "${#PENDING[@]} pending migration(s) to apply:"
  for m in "${PENDING[@]}"; do echo "         $(basename "$m")"; done

  mkdir -p "$BACKUP_DIR"
  BACKUP_FILE="$BACKUP_DIR/$(date +%Y%m%d-%H%M%S)-pre-migration.sql"
  info "Backing up database to $BACKUP_FILE…"
  sudo -u postgres pg_dump "$DB_NAME" > "$BACKUP_FILE"
  success "Backup written ($(du -h "$BACKUP_FILE" | cut -f1))"

  info "Stopping app to apply migrations safely…"
  sudo -u $APP_USER $PM2_BIN stop chinese-app || true

  for migration in "${PENDING[@]}"; do
    name=$(basename "$migration")
    info "Applying $name…"
    if sudo -u postgres psql -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$migration"; then
      sudo -u postgres psql -d "$DB_NAME" -v ON_ERROR_STOP=1 -c \
        "INSERT INTO schema_migrations (filename) VALUES ('$name');" >/dev/null
      success "Applied $name"
    else
      warn "Migration $name failed — restore from $BACKUP_FILE with:"
      warn "  sudo -u postgres psql -d $DB_NAME < $BACKUP_FILE"
      sudo -u $APP_USER $PM2_BIN start chinese-app || true
      error "Aborting deploy. App restarted on previous code."
    fi
  done

  info "Starting app on new code…"
  sudo -u $APP_USER $PM2_BIN restart chinese-app
else
  info "No pending migrations."
  info "Restarting app…"
  sudo -u $APP_USER $PM2_BIN restart chinese-app
fi

success "Deploy complete — $(date)"
