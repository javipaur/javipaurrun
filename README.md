# RunHub

Director y calendario de pruebas deportivas populares en toda España: running y asfalto, trail, media maratón y maratón, marchas, orientación, ciclismo, triatlón, natación e híbridos (HYROX/OCR). Permite buscar por **provincia**, **distancia** y **disciplina**, y consultar un calendario actualizado cada día.

## Stack

- Next.js 16 (App Router) + React 19
- Prisma 7 + PostgreSQL (via driver adapter pg/libsql)
- Tailwind CSS 4
- NextAuth 5
- Scraping automático con Cheerio

## Funcionalidades

- **Calendario filtrable** (`/calendario`) por tipo, provincia, comunidad autónoma, distancia y búsqueda libre.
- **Directorio por provincia** (`/carreras/[provincia]`) con páginas para las 50 provincias españolas.
- **Directorio por ciudad** (`/carreras/ciudad/[ciudad]`).
- **Detalle de carrera** (`/carrera/[slug]`) con mapa, tiempo, reviews, comparador, recordatorios y guía **Animar** para acompañantes (puntos de ánimo, ETAs por ritmo y checkpoints).
- Panel **admin** para gestionar carreras, resultados, blog, suscriptores y el scraping.
- **Live tracking** (en desarrollo): eventos, corredores, checkpoints y mapa en tiempo real para organizadores.

## Scraping de carreras

El proyecto importa carreras automáticamente desde varias fuentes gratuitas:

| Fuente | Cobertura |
|--------|-----------|
| Sportmaniacs | Nacional (~3000 carreras de running), incluye provincia, ciudad y coordenadas |
| RockTheSport | Nacional (~350 carreras de trail/running) |
| Buscametas | Calendario nacional |
| Lasterketak.eus | País Vasco / norte |
| CarrerasPopulares | Calendario nacional (API pública) |

Todas las carreras se deduplican (por URL o nombre+fecha) y se **actualizan** en cada ejecución: si una carrera cambia de fecha, distancia o precio, se refresca en lugar de crear un duplicado. Las provincias se normalizan a un vocabulario canónico de 50 provincias.

### Refresco diario (cron)

Configura un cron gratuito (recomendado: [cron-job.org](https://cron-job.org)) para llamar una vez al día:

```
GET {TU_URL}/api/cron/scrape?key={CRON_SECRET}
```

Este endpoint ejecuta todos los scrapers completos y a continuación la geocodificación de las carreras que aún no tienen coordenadas.

También existe un endpoint de recordatorios de carreras próximas:

```
GET {TU_URL}/api/cron/reminders
```

(autenticado con `Authorization: Bearer {CRON_SECRET}`).

Y un endpoint que envía el digest de carreras nuevas a las alertas activas:

```
GET {TU_URL}/api/cron/alerts
```

(misma autenticación `Authorization: Bearer {CRON_SECRET}`). Revisa carreras creadas en las
últimas 48 h y envía un email a cada suscriptor cuya alerta (`provincia`, `comunidad`, `tipo`,
rango de distancia) coincide con alguna de ellas.

### Exportar a calendario (iCal)

Desde el calendario se puede descargar un `.ics` con las carreras que se están viendo:

```
GET {TU_URL}/api/calendario/export?tipo=TRAIL&provincia=Araba
```

Respuesta `text/calendar` con máximo 500 eventos, respetando los filtros del calendario.

### Alta manual de carreras

- Página pública: `/enviar-carrera`
- Endpoint: `POST /api/races/submit` (rate limit 5/hora por IP)
- Las propuestas se guardan con `source: "manual"` y `pendingReview: true`.
- No aparecen en el calendario hasta aprobarse en `/admin/races/pending`.

### Alertas de carreras nuevas

- Endpoint: `POST /api/alerts` (crear/actualizar), `DELETE /api/alerts?email=...` (desactivar),
  `GET /api/alerts?email=...` (consultar).
- El digest se envía con el cron de alertas (ver arriba).

### Importación manual (sincronización inicial / puntual)

Si quieres poblar o refrescar la base de datos sin depender del cron, ejecuta el script desde el servidor que tenga acceso a la base de datos:

```bash
npm run import:races
```

o directamente:

```bash
npx tsx scripts/import-all.mts
```

Este script ejecuta todos los scrapers, imprime un resumen por fuente (encontradas/nuevas) y el total de carreras en BD. La deduplicación por URL o nombre+fecha evita duplicados y la actualización mantiene fechas, distancias y precios al día.

### Esquema y arranque en producción

El esquema se aplica con `scripts/apply-schema.sh`, no directamente con `prisma db push`. En una base de datos gestionada el usuario no puede crear la *shadow database*, así que el script intenta `db push` y, si falla, genera el SQL con `prisma migrate diff --script` y lo aplica con `db execute`. Es idempotente y no aborta el arranque si hay un error de esquema: deja el sitio en pie y lo registra en el log.

- `nixpacks.toml` ejecuta `apply-schema.sh` durante el build.
- `scripts/start.sh` vuelve a aplicarlo al arrancar y después:
  1. Arranca el gateway realtime (`services/realtime/gateway.mts`) si hay `REDIS_URL`.
  2. Arranca `next start`, que queda disponible de inmediato.
  3. Lanza la importación de carreras (`tsx scripts/import-all.mts`) **en segundo plano**.

El import no afecta a la disponibilidad: Next ya está sirviendo mientras se rellena la BD. Si el despliegue se reinicia, el import vuelve a ejecutarse; el cron diario se encarga del refresco continuo.

### Variables de entorno

Ver `.env.example`:

- `DATABASE_URL` — cadena de conexión a PostgreSQL (SQLite no funciona: el adapter es `PrismaPg`).
- `AUTH_SECRET` — secreto de NextAuth.
- `CRON_SECRET` — secreto para los endpoints de cron.
- `RESEND_API_KEY` — para envío de emails.
- `NEXT_PUBLIC_APP_URL` — URL pública de la aplicación.
- `REDIS_URL` — bus del live realtime (sin ella, el seguimiento en vivo queda parcial).
- `NEXT_PUBLIC_LIVE_URL` — URL del gateway realtime.

## Desarrollo

```bash
npm install
npm run dev
```

## Producción

Despliegue con Nixpacks (`nixpacks.toml`) + `scripts/start.sh`. El dominio público se resuelve desde el host de la petición (`src/lib/site-url.ts`), no de una variable de entorno, para que un valor mal puesto no envenene sitemap, robots ni canonicals.
