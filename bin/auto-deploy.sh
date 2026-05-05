#!/usr/bin/env bash
# =====================================================================
# Auto-deploy do briefing-docads no cPanel (DNSPRO)
# =====================================================================
# Chamado pelo cron job a cada 1 minuto.
# Só faz deploy se houver novo commit no remote.
# Idempotente — pode rodar quantas vezes quiser.
# =====================================================================

set -e

REPO=/home/murilosp/repositories/briefing-docads
WEBROOT=/home/murilosp/briefing.docads.com.br
LOG=/home/murilosp/.cron-briefing.log

cd "$REPO"

# Verifica se há novos commits
git fetch origin main --quiet 2>>"$LOG" || exit 0

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

# Nada a fazer se já está atualizado
if [ "$LOCAL" = "$REMOTE" ]; then
  exit 0
fi

# Atualiza o repo
git reset --hard origin/main >>"$LOG" 2>&1

# Copia para o webroot
mkdir -p "$WEBROOT"
cp -Rf public/. "$WEBROOT/" >>"$LOG" 2>&1
chmod -R 755 "$WEBROOT" 2>>"$LOG" || true
find "$WEBROOT" -type f -exec chmod 644 {} \; 2>>"$LOG" || true

# Marca o deploy
COMMIT_MSG=$(git log -1 --pretty=format:"%s" "$REMOTE")
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Deployed ${REMOTE:0:7} — ${COMMIT_MSG}" >> "$LOG"
