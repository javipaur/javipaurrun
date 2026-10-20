#!/usr/bin/env bash
# Aplica el esquema de prisma/schema.prisma a la base de datos.
#
# Idempotente: si el esquema ya esta al dia, no hace nada.
#
# Por que no basta con 'prisma db push': necesita una "shadow database" para
# detectar perdida de datos, y en una BD gestionada el usuario de la app casi
# nunca tiene permiso para crear bases. Cuando 'db push' falla por eso, el
# esquema se queda atrasado para siempre y las consultas que usan columnas
# nuevas (pendingReview, distanceKm, city...) lanzan: la home sale vacia, el
# sitemap no lista ninguna carrera y /completitud cae al estado degradado.
#
# Fallback: 'migrate diff' compara el esquema REAL con el del schema.prisma
# (sin shadow database) y genera el SQL; 'db execute' lo aplica.
#
# Sale siempre con 0: no debe tumbar ni el build ni el arranque. Los errores
# van a stderr, que es donde se miran los logs del contenedor.
set -uo pipefail

log() { echo "[apply-schema] $*" >&2; }

apply() {
  if timeout 180 npx prisma db push --skip-generate; then
    log "esquema aplicado con 'db push'"
    return 0
  fi

  log "'db push' fallo; probando la via SQL sin shadow database..."

  local sql
  sql="$(mktemp)"
  if ! timeout 180 npx prisma migrate diff \
        --from-config-datasource \
        --to-schema prisma/schema.prisma \
        --script > "$sql"; then
    rm -f "$sql"
    log "no se pudo calcular el diff del esquema"
    return 1
  fi

  if [ ! -s "$sql" ]; then
    rm -f "$sql"
    log "el esquema ya estaba actualizado"
    return 0
  fi

  log "aplicando $(wc -l < "$sql") lineas de SQL..."
  timeout 180 npx prisma db execute --file "$sql"
  local rc=$?
  rm -f "$sql"

  if [ "$rc" -eq 0 ]; then
    log "esquema aplicado via SQL"
  else
    log "fallo la aplicacion del SQL (exit $rc)"
  fi
  return "$rc"
}

if ! apply; then
  log "AVISO: no se pudo actualizar el esquema. Revisa los permisos de la BD."
  log "AVISO: si faltan columnas (pendingReview, distanceKm, city...), las consultas que las usan lanzan."
fi

exit 0
