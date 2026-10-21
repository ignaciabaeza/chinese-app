#!/bin/bash
# =============================================================================
# deploy.sh — Re-deploy latest code on the EC2 server.
#
# Pulls the latest code, builds it into a side directory while the live app
# keeps serving, applies any pending DB migrations (with a pg_dump backup
# first, all in one transaction), then swaps the new build in and restarts.
#
# Normally run automatically by auto-deploy.sh (systemd timer, every 2 min)
# after a push to main passes CI. To run by hand:
#   sudo ./scripts/deploy.sh
#
# Migrations live in scripts/migrations/*.sql and are applied in filename
# order. Applied migrations are recorded in the `schema_migrations` table so
# each one runs at most once. They run inside a single transaction, so a
# migration must not contain its own BEGIN/COMMIT or CREATE INDEX CONCURRENTLY.
#
# Failure behaviour:
#   - Build fails      → code is reset to the previous commit; the live app
#                        was never touched.
#   - Migration fails  → the transaction rolls back (DB unchanged), code is
#                        reset to the previous commit and the old build is
#                        restarted.
#   - Health check fails after the swap (no migrations ran) → the previous
#                        build is restored and restarted.
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
BUILD_DIR_NAME=".next-build"
HEALTH_URL="http://127.0.0.1:3000/auth"

[[ ! -d "$APP_DIR" ]] && error "$APP_DIR not found — run setup.sh first"

# One deploy at a time. auto-deploy.sh already holds the lock when it calls us.
if [[ -z "${DEPLOY_LOCK_HELD:-}" ]]; then
  exec 9>/run/chinese-app-deploy.lock
  flock -n 9 || error "Another deploy is already running."
fi

as_app() { sudo -u $APP_USER bash -c "cd $APP_DIR && $1"; }

# ── 1. Sync to origin/main exactly ───────────────────────────────────────────
# `fetch + reset --hard` instead of `pull` so the box always mirrors origin —
# immune to force-pushes, divergent local commits, or stray edits on the
# server. The deploy box should never hold uncommitted work.
PREV_SHA=$(sudo -u $APP_USER git -C "$APP_DIR" rev-parse HEAD)
info "Fetching latest code (currently at ${PREV_SHA:0:7})…"
sudo -u $APP_USER git -C "$APP_DIR" fetch origin
sudo -u $APP_USER git -C "$APP_DIR" reset --hard origin/main
NEW_SHA=$(sudo -u $APP_USER git -C "$APP_DIR" rev-parse HEAD)

LOCK_CHANGED=0
if ! sudo -u $APP_USER git -C "$APP_DIR" diff --quiet "$PREV_SHA" "$NEW_SHA" -- package-lock.json; then
  LOCK_CHANGED=1
fi

# Put the checkout (and node_modules, if they changed) back to what the live
# app is running, so the box never sits on code that isn't serving.
revert_code() {
  warn "Resetting code to previous commit ${PREV_SHA:0:7}…"
  sudo -u $APP_USER git -C "$APP_DIR" reset --hard "$PREV_SHA"
  if [[ $LOCK_CHANGED -eq 1 ]]; then as_app "npm ci --silent"; fi
  sudo -u $APP_USER rm -rf "$APP_DIR/$BUILD_DIR_NAME"
}

# ── 2. Install deps (only when the lockfile changed) ─────────────────────────
# Rewriting node_modules under a running process can break lazy requires, so
# skip it when nothing changed.
if [[ $LOCK_CHANGED -eq 1 || ! -d "$APP_DIR/node_modules" ]]; then
  info "package-lock.json changed — installing dependencies…"
  as_app "npm ci --silent"
else
  info "Dependencies unchanged — skipping npm ci."
fi

# ── 3. Build into a side directory (live app keeps serving .next) ────────────
# Stale route typings in the live .next would fail the type check if a route
# was removed; they aren't used at runtime, so drop them.
sudo -u $APP_USER rm -rf "$APP_DIR/.next/types" "$APP_DIR/.next/dev"

# Turbopack writes chunks via *.tmp.<hash> + atomic rename. On small EC2
# boxes with EBS, an occasional I/O stall makes the rename fail with
# ENOENT mid-build. Retry up to 3 times, wiping the build dir between each
# attempt, before giving up.
info "Building into $BUILD_DIR_NAME…"
BUILD_ATTEMPTS=0
BUILD_MAX_ATTEMPTS=3
until [[ $BUILD_ATTEMPTS -ge $BUILD_MAX_ATTEMPTS ]]; do
  BUILD_ATTEMPTS=$((BUILD_ATTEMPTS + 1))
  sudo -u $APP_USER rm -rf "$APP_DIR/$BUILD_DIR_NAME"
  if as_app "NEXT_DIST_DIR=$BUILD_DIR_NAME npm run build"; then
    success "Build succeeded on attempt $BUILD_ATTEMPTS."
    break
  fi
  if [[ $BUILD_ATTEMPTS -lt $BUILD_MAX_ATTEMPTS ]]; then
    warn "Build attempt $BUILD_ATTEMPTS failed — retrying."
    sleep 2
  else
    revert_code
    error "Build failed after $BUILD_MAX_ATTEMPTS attempts. Live app untouched. Inspect the output above."
  fi
done

# ── 4. Detect pending migrations ─────────────────────────────────────────────
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

# ── 5. Apply migrations (if any) with a backup + brief downtime ──────────────
APP_STOPPED=0
if [[ ${#PENDING[@]} -gt 0 ]]; then
  info "${#PENDING[@]} pending migration(s) to apply:"
  for m in "${PENDING[@]}"; do echo "         $(basename "$m")"; done

  mkdir -p "$BACKUP_DIR"
  BACKUP_FILE="$BACKUP_DIR/$(date +%Y%m%d-%H%M%S)-pre-migration.sql.gz"
  info "Backing up database to $BACKUP_FILE…"
  if ! sudo -u postgres pg_dump "$DB_NAME" | gzip > "$BACKUP_FILE.tmp"; then
    rm -f "$BACKUP_FILE.tmp"
    revert_code
    error "pg_dump failed — not applying migrations. Live app untouched."
  fi
  mv "$BACKUP_FILE.tmp" "$BACKUP_FILE"
  success "Backup written ($(du -h "$BACKUP_FILE" | cut -f1))"

  info "Stopping app to apply migrations safely…"
  sudo -u $APP_USER $PM2_BIN stop chinese-app || true
  APP_STOPPED=1

  # All pending migrations and their schema_migrations rows run in ONE
  # transaction (-1): either everything applies or nothing does.
  PSQL_ARGS=()
  for migration in "${PENDING[@]}"; do
    name=$(basename "$migration")
    PSQL_ARGS+=(-f "$migration" -c "INSERT INTO schema_migrations (filename) VALUES ('$name');")
  done
  info "Applying migrations in a single transaction…"
  if sudo -u postgres psql -d "$DB_NAME" -v ON_ERROR_STOP=1 -1 "${PSQL_ARGS[@]}"; then
    success "Applied ${#PENDING[@]} migration(s)."
  else
    warn "Migration failed — transaction rolled back, database is unchanged."
    revert_code
    sudo -u $APP_USER $PM2_BIN start chinese-app || true
    error "Aborting deploy. App restarted on previous build (${PREV_SHA:0:7})."
  fi
else
  info "No pending migrations."
fi

# ── 6. Swap the new build in and restart ─────────────────────────────────────
info "Swapping in the new build…"
sudo -u $APP_USER rm -rf "$APP_DIR/.next-old"
if [[ -d "$APP_DIR/.next" ]]; then
  sudo -u $APP_USER mv "$APP_DIR/.next" "$APP_DIR/.next-old"
fi
sudo -u $APP_USER mv "$APP_DIR/$BUILD_DIR_NAME" "$APP_DIR/.next"

if [[ $APP_STOPPED -eq 1 ]]; then
  sudo -u $APP_USER $PM2_BIN start chinese-app
else
  sudo -u $APP_USER $PM2_BIN restart chinese-app
fi

# ── 7. Health check ──────────────────────────────────────────────────────────
healthy=0
for _ in $(seq 1 30); do
  if curl -fsS -o /dev/null --max-time 5 "$HEALTH_URL"; then healthy=1; break; fi
  sleep 1
done

if [[ $healthy -eq 1 ]]; then
  success "Health check passed."
elif [[ ${#PENDING[@]} -eq 0 && -d "$APP_DIR/.next-old" ]]; then
  warn "Health check failed — rolling back to the previous build."
  sudo -u $APP_USER rm -rf "$APP_DIR/.next-failed"
  sudo -u $APP_USER mv "$APP_DIR/.next" "$APP_DIR/.next-failed"
  sudo -u $APP_USER mv "$APP_DIR/.next-old" "$APP_DIR/.next"
  revert_code
  sudo -u $APP_USER $PM2_BIN restart chinese-app
  error "Deploy rolled back to ${PREV_SHA:0:7}. Failed build kept in .next-failed for inspection."
else
  # Migrations already changed the schema, so the old code may not match it.
  error "Health check failed after migrations — NOT rolling back automatically. Check: sudo -u $APP_USER $PM2_BIN logs chinese-app"
fi

# ── 8. Make sure the nightly backup cron is installed ────────────────────────
cat > /etc/cron.d/chinese-app-backup <<CRON
# Nightly PostgreSQL backup — installed by scripts/deploy.sh
0 6 * * * root /bin/bash $APP_DIR/scripts/backup.sh >> /var/log/chinese-app-backup.log 2>&1
CRON
chmod 644 /etc/cron.d/chinese-app-backup

# ── 9. Make sure the pull-based auto-deploy timer is installed ───────────────
cat > /etc/systemd/system/chinese-app-autodeploy.service <<UNIT
[Unit]
Description=Deploy chinese-app when origin/main has a new commit that passed CI
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/bin/bash $APP_DIR/scripts/auto-deploy.sh
TimeoutStartSec=30min
UNIT
cat > /etc/systemd/system/chinese-app-autodeploy.timer <<UNIT
[Unit]
Description=Check for chinese-app updates every 2 minutes

[Timer]
OnBootSec=2min
OnUnitActiveSec=2min

[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload
systemctl enable --now chinese-app-autodeploy.timer >/dev/null 2>&1

success "Deploy complete — ${PREV_SHA:0:7} → ${NEW_SHA:0:7} — $(date)"
