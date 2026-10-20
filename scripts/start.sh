#!/usr/bin/env bash
set -euo pipefail

echo "[start.sh] Aplicando esquema de base de datos..."
# Si el push falla, el arranque CONTINUA con un schema viejo: cualquier consulta
# que use columnas nuevas (pendingReview, distanceKm, city...) revienta y el
# sitio entero cae con errores 500 sin explicacion. Es peor abortar el
# despliegue y que la plataforma conserve la version anterior.
if ! timeout 180 npx prisma db push --skip-generate; then
  echo "[start.sh] ERROR: no se pudo aplicar el esquema. Abortando el arranque para no dejar el sitio con el schema anterior." >&2
  exit 1
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
