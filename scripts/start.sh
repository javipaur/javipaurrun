#!/usr/bin/env bash
set -euo pipefail

echo "[start.sh] Aplicando esquema de base de datos..."
npx prisma db push --skip-generate

echo "[start.sh] Importando carreras desde fuentes..."
# No bloquea el arranque si falla; el cron diario lo reintenta.
timeout 900 npx tsx scripts/import-all.mts || echo "[start.sh] Importación falló o excedió el tiempo (se continúa con el arranque)."

echo "[start.sh] Arrancando Next.js..."
exec npm run start
