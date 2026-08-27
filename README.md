# JavipaurRun

Director web de carreras populares (asfalto, trail, media maratón, maratón, marcha y orientación) en toda España. Permite buscar por **provincia**, **distancia** y **tipo de carrera**, y consultar un calendario actualizado cada día.

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
- **Detalle de carrera** (`/carrera/[slug]`) con mapa, tiempo, reviews, comparador, recordatorios.
- Panel **admin** para gestionar carreras, resultados, blog, suscriptores y el scraping.

## Scraping de carreras

El proyecto importa carreras automáticamente desde varias fuentes gratuitas:

| Fuente | Cobertura |
|--------|-----------|
| Sportmaniacs | Nacional (~3000 carreras de running), incluye provincia, ciudad y coordenadas |
| RockTheSport | Nacional (~350 carreras de trail/running) |
| Buscametas | Calendario nacional |
| Lasterketak.eus | País Vasco / norte |

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

### Ejecución automática en el despliegue (Nixpacks)

En producción, el arranque (`nixpacks.toml`) usa `scripts/start.sh`:

1. Aplica el esquema con `prisma db push --skip-generate`.
2. Arranca `next start` **inmediatamente** (la web queda disponible al momento).
3. Lanza la importación de carreras (`tsx scripts/import-all.mts`) **en segundo plano** para poblar o actualizar la base de datos sin bloquear el servicio.

El import no afecta a la disponibilidad: Next ya está sirviendo mientras se rellena la BD. Si el despliegue se reinicia, el import vuelve a ejecutarse; el cron diario se encarga del refresco continuo.

### Variables de entorno

Ver `.env.example`:

- `DATABASE_URL` — cadena de conexión a PostgreSQL.
- `AUTH_SECRET` — secreto de NextAuth.
- `CRON_SECRET` — secreto para los endpoints de cron.
- `RESEND_API_KEY` — para envío de emails.
- `NEXT_PUBLIC_APP_URL` — URL pública de la aplicación.

## Desarrollo

```bash
npm install
npm run dev
```

## Producción

Despliegue vía Nixpacks (`nixpacks.toml`) que ejecuta `prisma db push` y `npm run start`.
