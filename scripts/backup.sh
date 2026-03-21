#!/bin/bash
# =============================================================================
# backup.sh — Daily PostgreSQL backup (add to cron)
#
# To schedule daily at 2am:
#   sudo crontab -e
#   0 2 * * * /opt/chinese-app/scripts/backup.sh
# =============================================================================
set -euo pipefail

DB_NAME="chinese_app"
BACKUP_DIR="/var/backups/chinese-app"
DATE=$(date +%Y-%m-%d_%H-%M)
KEEP_DAYS=7

mkdir -p "$BACKUP_DIR"

pg_dump -U postgres "$DB_NAME" | gzip > "$BACKUP_DIR/db_${DATE}.sql.gz"

# Remove backups older than KEEP_DAYS
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +$KEEP_DAYS -delete

echo "Backup saved: $BACKUP_DIR/db_${DATE}.sql.gz"
