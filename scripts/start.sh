#!/usr/bin/env bash
set -euo pipefail

echo "[start.sh] Aplicando esquema de base de datos..."
# NO abortar el arranque si esto falla: la disponibilidad manda. Un 'exit 1'
# dejaba el contenedor muerto (502 en todo el sitio) cuando la BD gestionada no
# permite crear la shadow database que usa 'db push'.
if ! timeout 180 npx prisma db push --skip-generate; then
  echo "[start.sh] AVISO: 'prisma db push' no pudo aplicarse (revisa permisos de la BD)." >&2
  echo "[start.sh] El sitio arranca igualmente." >&2
fi

echo "[start.sh] Arrancando Realtime Gateway (WS+SSE)..."
nohup npx tsx services/realtime/gateway.mts > /tmp/live-gateway.log 2>&1 </dev/null &

echo "[start.sh] Arrancando Next.js..."
npm run start &

APP_PID=$!

echo "[start.sh] Importando carreras desde fuentes en segundo plano..."
# No bloquea: Next ya está sirviendo. El cron diario reintenta si hace falta.
nohup timeout 1800 npx tsx scripts/import-all.mts > /tmp/import-races.log 2>&1 </dev/null &

echo "[start.sh] Next.js arrancado (pid $APP_PID). Import corriendo en background."
# Mantener el contenedor vivo siguiendo el proceso de Next.
wait $APP_PID
