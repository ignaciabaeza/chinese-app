#!/bin/bash
# =============================================================================
# harden.sh — Idempotent server hardening. Safe to re-run.
#
#   sudo bash /opt/chinese-app/scripts/harden.sh
#
# - fail2ban: bans IPs after repeated failed SSH logins
# - sshd: no root login, no X11 forwarding
# - nginx: hide version, TLS 1.2+ only
# =============================================================================
set -euo pipefail

[[ $EUID -ne 0 ]] && { echo "Run with sudo"; exit 1; }

# ── fail2ban ─────────────────────────────────────────────────────────────────
DEBIAN_FRONTEND=noninteractive apt-get install -y -q fail2ban >/dev/null
cat > /etc/fail2ban/jail.local <<'JAIL'
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 5
# Repeat offenders get banned for longer each time (up to a week).
bantime.increment = true
bantime.maxtime   = 1w

[sshd]
enabled = true
backend = systemd
JAIL
systemctl enable fail2ban >/dev/null 2>&1
systemctl restart fail2ban
echo "[OK] fail2ban active"

# ── sshd ─────────────────────────────────────────────────────────────────────
cat > /etc/ssh/sshd_config.d/10-hardening.conf <<'SSHD'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
X11Forwarding no
SSHD
sshd -t
systemctl reload ssh
echo "[OK] sshd hardened"

# ── nginx ────────────────────────────────────────────────────────────────────
sed -i 's/^\s*#\s*server_tokens off;/\tserver_tokens off;/' /etc/nginx/nginx.conf
sed -i 's/^\(\s*\)ssl_protocols .*/\1ssl_protocols TLSv1.2 TLSv1.3;/' /etc/nginx/nginx.conf
nginx -t
systemctl reload nginx
echo "[OK] nginx hardened"
