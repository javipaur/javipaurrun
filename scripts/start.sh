#!/usr/bin/env bash
set -euo pipefail

echo "[start.sh] Aplicando esquema de base de datos..."
# El esquema se aplica tambien en la fase de build (nixpacks.toml) para que
# Next no prerenderice paginas con un schema viejo. Ver scripts/apply-schema.sh.
bash "$(dirname "$0")/apply-schema.sh"

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
