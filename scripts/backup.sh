#!/bin/bash
# =============================================================================
# backup.sh — Nightly PostgreSQL backup.
#
# Installed as /etc/cron.d/chinese-app-backup by deploy.sh (runs as root at
# 06:00 server time). Run manually with:
#   sudo bash /opt/chinese-app/scripts/backup.sh
#
# Off-box copy (optional, strongly recommended): put
#   BACKUP_S3_URI="s3://your-bucket/chinese-app"
# in /etc/chinese-app-backup.env and install the AWS CLI with credentials
# (or an instance role) that can write to that bucket.
# =============================================================================
set -euo pipefail

DB_NAME="chinese_app"
BACKUP_DIR="/var/backups/chinese-app"
DATE=$(date +%Y-%m-%d_%H-%M)
KEEP_DAYS=14
FILE="$BACKUP_DIR/db_${DATE}.sql.gz"

[[ -f /etc/chinese-app-backup.env ]] && source /etc/chinese-app-backup.env

mkdir -p "$BACKUP_DIR"
trap 'rm -f "$FILE.tmp"' EXIT

# The postgres OS user authenticates via peer auth; `-U postgres` as root
# would fall through to md5 and fail.
sudo -u postgres pg_dump "$DB_NAME" | gzip > "$FILE.tmp"

# Only keep the file if it's a valid, non-trivial archive.
gzip -t "$FILE.tmp"
if [[ $(stat -c %s "$FILE.tmp") -lt 1024 ]]; then
  rm -f "$FILE.tmp"
  echo "Backup FAILED: dump is suspiciously small" >&2
  exit 1
fi
mv "$FILE.tmp" "$FILE"
echo "Backup saved: $FILE ($(du -h "$FILE" | cut -f1))"

if [[ -n "${BACKUP_S3_URI:-}" ]]; then
  aws s3 cp "$FILE" "$BACKUP_S3_URI/$(basename "$FILE")" --only-show-errors
  echo "Uploaded to $BACKUP_S3_URI"
fi

# Remove local backups older than KEEP_DAYS (nightly and pre-migration).
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$KEEP_DAYS -delete
