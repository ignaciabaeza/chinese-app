#!/bin/bash
# =============================================================================
# auto-deploy.sh — Pull-based deploy, run every 2 minutes by the
# chinese-app-autodeploy systemd timer (installed by deploy.sh).
#
# If origin/main has a new commit AND its GitHub "check" job (tsc) passed,
# runs deploy.sh. No inbound SSH or GitHub secrets needed: the server only
# makes outbound requests to GitHub.
#
# Logs: journalctl -u chinese-app-autodeploy -n 100
# =============================================================================
set -euo pipefail

APP_DIR="/opt/chinese-app"
APP_USER="appuser"
REPO_API="https://api.github.com/repos/ignaciabaeza/chinese-app"
STATE_DIR="/var/lib/chinese-app"
SKIPPED_FILE="$STATE_DIR/skipped-sha"

mkdir -p "$STATE_DIR"

# Never overlap with another (manual or automatic) deploy.
exec 9>/run/chinese-app-deploy.lock
flock -n 9 || { echo "Another deploy is running — skipping."; exit 0; }

sudo -u $APP_USER git -C "$APP_DIR" fetch --quiet origin main
HEAD_SHA=$(sudo -u $APP_USER git -C "$APP_DIR" rev-parse HEAD)
REMOTE_SHA=$(sudo -u $APP_USER git -C "$APP_DIR" rev-parse origin/main)

[[ "$HEAD_SHA" == "$REMOTE_SHA" ]] && exit 0
[[ -f "$SKIPPED_FILE" && "$(cat "$SKIPPED_FILE")" == "$REMOTE_SHA" ]] && exit 0

# Gate on the CI type check for this exact commit.
CONCLUSION=$(curl -fsS --max-time 15 -H "Accept: application/vnd.github+json" \
  "$REPO_API/commits/$REMOTE_SHA/check-runs?check_name=check" \
  | python3 -c 'import sys,json; r=json.load(sys.stdin)["check_runs"]; print(r[0]["conclusion"] or "pending" if r else "missing")')

case "$CONCLUSION" in
  success)
    echo "New commit ${REMOTE_SHA:0:7} passed CI — deploying."
    DEPLOY_LOCK_HELD=1 bash "$APP_DIR/scripts/deploy.sh" || {
      # Don't retry a broken commit every 2 minutes; the next push resets this.
      echo "$REMOTE_SHA" > "$SKIPPED_FILE"
      echo "Deploy of ${REMOTE_SHA:0:7} failed — skipping this commit until a new one is pushed." >&2
      exit 1
    }
    ;;
  pending|missing)
    echo "New commit ${REMOTE_SHA:0:7}: CI $CONCLUSION — waiting."
    ;;
  *)
    echo "$REMOTE_SHA" > "$SKIPPED_FILE"
    echo "New commit ${REMOTE_SHA:0:7}: CI $CONCLUSION — not deploying." >&2
    ;;
esac
