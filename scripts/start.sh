#!/usr/bin/env bash
set -euo pipefail

echo "[start.sh] Aplicando esquema de base de datos..."
# No bloquear el arranque si el push fallase o se colgara.
timeout 180 npx prisma db push --skip-generate || echo "[start.sh] prisma db push falló (se continúa con el arranque)."

echo "[start.sh] Arrancando Next.js..."
npm run start &

APP_PID=$!

echo "[start.sh] Importando carreras desde fuentes en segundo plano..."
# No bloquea: Next ya está sirviendo. El cron diario reintenta si hace falta.
nohup timeout 1800 npx tsx scripts/import-all.mts > /tmp/import-races.log 2>&1 </dev/null &

echo "[start.sh] Next.js arrancado (pid $APP_PID). Import corriendo en background."
# Mantener el contenedor vivo siguiendo el proceso de Next.
wait $APP_PID
