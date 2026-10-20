# AGENTS.md

## Resumen ejecutivo

**JavipaurRun** es una aplicación web de **director de carreras populares en España** con un segundo bloque en construcción: una **plataforma B2B de seguimiento en vivo** (estilo LiveTrail) para eventos de trail/running.

- **Producto visible hoy:** calendario filtrable, directorio por provincia/ciudad, detalle de carrera con mapa, reviews, resultados, comparador, recordatorios, newsletter, blog y panel admin.
- **En construcción:** organizadores, eventos live, tracking GPS de corredores, checkpoints y dashboard en tiempo real.
- **Stack:** Next.js 16 (App Router) + React 19 + Tailwind 4 + Prisma 7 (PostgreSQL/libSQL) + NextAuth 5 + Redis/WebSocket gateway + Expo (futuro corredor).
- **Objetivo del producto:** ser **útil** (muchas carreras bien normalizadas y fáciles de filtrar) y **rápido** (cargas instantáneas, filtros sin fricción, buen SEO).

---

## Idea de producto

### A. Directorio de carreras (principal)

- Centralizar carreras populares de España: asfalto, trail, media maratón, maratón, marcha y orientación.
- Permitir búsqueda por **provincia, comunidad autónoma, tipo, distancia y texto libre**.
- Mantener el calendario actualizado mediante scraping automatizado diario.
- Generar páginas indexables por provincia/tipo para SEO.

### B. Live tracking B2B (en desarrollo)

- Múltiples organizadores gestionan eventos.
- El público sigue a corredores con mapa y clasificación en tiempo real.
- La posición GPS llega desde una app móvil del corredor (futuro Expo).
- Checkpoints capturados por QR, geofence, confirmación manual o RFID.

---

## Estado actual

### Implementado

- Directorio base y calendario.
- Scrapers: Sportmaniacs, RockTheSport, Buscametas, Lasterketak.eus y CarrerasPopulares.
- Normalización de provincias a un vocabulario canónico de 50.
- Geocoding y sincronización incremental.
- Admin: carreras, resultados, blog, suscriptores, scraping.
- Live MVP parcial: modelo de datos, ingesta de posiciones, geofence de checkpoints, snapshot y página pública.
- Gateway realtime WS+SSE con Redis pub/sub.
- PWA instalable, modo offline básico, i18n ES/EU.

### En progreso / incompleto

- Dashboard de organizador (`/admin/eventos`).
- Gestión de checkpoints, GPX/ruta y CSV de corredores.
- Autenticación específica para organizadores.
- App Expo del corredor.
- Tests automatizados y mejores de calidad.
- Métricas y observabilidad de live.

### Archivos no commiteados relevantes

El árbol actual incluye cambios no committeados de la fase LiveTrail. No revertir cambios no relacionados. Revisar siempre con `git status` antes de editar.

---

## Estructura del repositorio

```text
javipaurrun/
├── prisma/schema.prisma                  # Esquema DB actual/incremental
├── scripts/
│   ├── import-all.mts                    # Scraping manual completo
│   ├── seed-live.mts                     # Seed de eventos live
│   └── start.sh                          # Arranque producción
├── services/realtime/gateway.mts          # Gateway WS + SSE + Redis
├── src/
│   ├── app/
│   │   ├── calendario/, carreras/, carrera/[slug]/   # Directorio
│   │   ├── live/[eventSlug]/                          # Vista pública live
│   │   ├── admin/                                     # Panel admin
│   │   └── api/
│   │       ├── races/, scraping/, cron/                # Directorio/scraping
│   │       └── live/[eventSlug]/                      # Ingesta y snapshot
│   ├── components/                       # UI reutilizable
│   ├── lib/
│   │   ├── scraping.ts                   # Scrapers y dedupe
│   │   ├── live.ts                       # Utilidades live/geo/ETA
│   │   ├── realtime.ts                   # Redis pub/sub
│   │   ├── prisma.ts                     # Cliente Prisma
│   │   ├── validation.ts                 # Schemas Zod
│   │   └── utils.ts                      # Provincias, formatos, helpers
│   ├── generated/prisma/                 # Cliente generado (no editar)
│   └── types/
├── docs/superpowers/specs/               # Diseño LiveTrail
├── next.config.ts                        # Imágenes, seguridad, CSP
├── nixpacks.toml
└── package.json
```

---

## Arquitectura

### Directorio

```text
Fuentes externas → scraping.ts → Prisma Race → Next.js SSR/ISR → navegador
```

- Los scrapers devuelven `ScrapedRace[]`.
- La deduplicación se hace por URL o `nombre + fecha`.
- Si una carrera cambia fecha, distancia o precio, se actualiza en lugar de duplicarse.
- Las provincias se normalizan a `PROVINCE_SLUGS` / vocabulario canónico.
- El cron diario mantiene el calendario actualizado.

### Live

```text
App corredor → POST positions → Next.js API → PostgreSQL + geofence → Redis
Redis → Realtime Gateway → WebSocket/SSE → navegador público/organizador
```

- Next.js se encarga de frontend, API de ingesta y CRUD.
- El gateway es un proceso separado para no obligar a custom server.
- Redis es el bus entre API y gateway.
- PostgreSQL persiste posiciones, checkpoints y resultados.

---

## Modelo de datos clave

### Directorio

- `Race`: carrera base (slug, fecha, provincia, ciudad, tipo, distancia, coordenadas, fuente, etc.).
- `RaceResult`, `Review`, `RaceReminder`: resultados, valoraciones y recordatorios.
- `User`, `Account`, `Session`: auth.
- `NewsletterSubscriber`, `BlogPost`, `ScrapeLog`: newsletter, blog y auditoría de scraping.

### Live

- `Organization`, `OrganizerMembership`: multiorganizador y roles.
- `Event`: evento live, ligable a `Race`.
- `Checkpoint`: puntos de control con orden, km, coordenadas y radio.
- `EventRunner`: corredor/dorsal, token hasheado, estado.
- `LivePosition`: posiciones GPS.
- `CheckpointPass`: paso por checkpoint con fuente (`QR`, `GEOFENCE`, `MANUAL`, `RFID`).

Regla: los tokens de dorsal se **hashean** (SHA-256 en `lib/live.ts`) y nunca se exponen.

---

## Convenciones de código

- **TypeScript strict** (`strict: true`). No usar `any` sin justificación.
- **App Router**: server components por defecto; client components solo cuando haya estado/eventos/browser APIs.
- **Validación**: endpoints aceptan entrada con Zod (`src/lib/validation.ts`). No confiar en datos del cliente ni del scraping.
- **Prisma**: solo tocar schema; importar cliente desde `@/lib/prisma`. No editar `src/generated/prisma`.
- **Scraping**: añadir nuevos scrapers siguiendo `scrapeFrom*` y registrarlos en `sources`. Dedupe/geocoding comunes.
- **Provincias**: usar siempre `PROVINCE_SLUGS` y vocabulario canónico. No hardcodear slugs nuevos en páginas.
- **Rutas live**: room key equivalente para API (`eventId`/slug), gateway y frontend.
- **Estilos**: Tailwind 4. Mantener clases existentes y no introducir CSS custom salvo necesidad fuerte.
- **Assets externos**: añadir dominios a `next.config.ts` en `images.remotePatterns` y CSP.
- **Tests**: no hay framework de tests; mínimo `npm run lint` + `npm run build`. No marcar trabajo como terminado sin pasar ambos.

---

## Comandos

### Desarrollo

```bash
npm install
npm run dev
```

### calidad

```bash
npm run lint
npm run build
```

### Scraping

```bash
npm run import:races
# o
npx tsx scripts/import-all.mts
```

### Live

```bash
npm run live:gateway
npm run seed:live
```

### Prisma

```bash
npx prisma generate
npx prisma db push
```

---

## Variables de entorno

Ver `.env.example`:

- `DATABASE_URL`: PostgreSQL. **SQLite no funciona aunque `.env.example` lo sugiera**
  (`src/lib/prisma.ts` fuerza el adapter `PrismaPg`, que solo habla el protocolo de Postgres).
  El Postgres local de Windows exige `scram-sha-256`, así que la URL necesita
  `postgresql://USUARIO:CLAVE@localhost:5432/javipaurrun`. Sin credenciales la app
  **no lanza**: las páginas devuelven 200 con contenido vacío, lo que hace el fallo
  muy difícil de detectar.
- `AUTH_SECRET`: secreto de NextAuth.
- `CRON_SECRET`: secreto de endpoints cron.
- `RESEND_API_KEY`: email.
- `NEXT_PUBLIC_APP_URL`: URL pública.
- `REDIS_URL`: bus realtime.
- `NEXT_PUBLIC_LIVE_URL`: URL del gateway.

Producción añade Redis y el gateway siempre vivo; sin Redis, live queda parcial.

---

## Página `/completitud` (transparencia de datos)

`src/lib/data-quality.ts` + `src/app/completitud/page.tsx`.

- **Objetivo:** convertir la cobertura desigual de datos en argumento de confianza.
  Muestra completitud por campo, desglose por fuente con última sincronización,
  y cobertura por provincia.
- `getDataQuality()` **nunca lanza**: devuelve `{ ok: false }` si la BD falla y la
  página muestra un estado degradado. Es deliberado: si esta página cayera en
  blanco comunicaría justo lo contrario de lo que pretende demostrar.
- `getLastSync()` es la variante ligera (una sola consulta) que usa el `Footer`.
  No arrastres `getDataQuality()` al footer: son 7 consultas incluida la muestra
  completa de upcoming.
- `buildStats()` es pura y está exportada: se testea sin BD con
  `npm run test:data-quality`. Al tocar esta página, ejecuta ese test.
- Reglas de completitud: `"Por determinar"`, `""`, `"-"` y el número `0` cuentan
  como **vacío**. El `0` en `distanceKm` es dato sin rellenar, no una carrera de 0 km.
- La tabla de fuentes es la **unión** de fuentes con carreras y fuentes con logs:
  una fuente caída que aportó 0 carreras debe seguir viéndose, si no se oculta
  precisamente el fallo que la página pretende transparentar.

---

## Operación y despliegue

- Producción usa `nixpacks.toml` + `scripts/start.sh`.
- `start.sh` aplica schema, arranca gateway, Next y import de carreras en background.
- Cron diario recomendado:
  - `GET {URL}/api/cron/scrape?key={CRON_SECRET}`
  - `GET {URL}/api/cron/reminders` con `Authorization: Bearer {CRON_SECRET}`
- La web debe quedar disponible antes de que el import termine.

---

## Directrices para agentes

- Trabajar en `C:\ProyectosGit\javipaurrun` (o mover la sesión allí).
- No tocar `node_modules`, `.next`, `src/generated/prisma` ni archivos binarios.
- Siempre ejecutar `git status` antes de editar por los cambios no committeados.
- Preferir cambios pequeños y verificables.
- Mantener compatibilidad con Next.js 16 y React 19; evitar patrones antiguos de Pages Router.
- No romper rutas existentes de directorio al desarrollar live.
- Cuando se agregue un campo al modelo, actualizar schema, generated client y consumidores.
- Para scraping, respetar timeouts/abort, dedupe y logs en `ScrapeLog`.
- Para live, validar con Zod y aplicar rate limiting en ingesta.
- No exponer tokens, secrets ni datos personales en logs ni en respuestas públicas.

---

## Mejoras recomendadas (útil y rápido)

### Prioridad alta

1. **Cache e ISR del directorio**
   - Usar `revalidate` o cache por tags en páginas de provincia y carrera.
   - Evitar queries repetidas en cada request.
   - Objetivo: TTFB bajo y menor carga DB.

2. **Filtros sin recarga completa**
   - Aplicar filtros del calendario client-side sobre snapshot o con fetch incremental.
   - Guardar estado de filtros en URL query params para compartir/enlazar.
   - Mantener skeletons ya implementados.

3. **Slugs y SEO completos**
   - `sitemap.ts` debe cubrir 50 provincias, combinaciones tipo/provincia y carreras.
   - Añadir metadata por provincia y ciudad, canonical tags y structured data (`Event`/`SportsEvent`).
   - Priorizar páginas de alto valor (próximas carreras por provincia).

4. **Búsqueda rápida**
   - Endpoint `/api/search` con índices DB o FULL TEXT.
   - Autocompletado con debounce y límite.
   - Evitar `LIKE %...%` sin índices cuando crezca el catálogo.

5. **Cobertura de carreras**
   - Completar FEDME, iRun, Donsport y Chronorace.
   - Añadir carreras pasadas para histórico/resultados.
   - Desduplicar mejor por nombre+fecha+ciudad.

6. **Normalización de ciudades**
   - Canonicalizar ciudades antes de generar `/carreras/ciudad/[city]`.
   - Evitar páginas duplicadas por acentos/mayúsculas.

### Prioridad media

7. **Resultados e histórico**
   - Importar clasificaciones cuando existan.
   - Páginas de atleta ya iniciadas: enriquecer con ritmos, posiciones y medallas.

8. **Reviews y confianza**
   - Moderación, spam control y validación de asistencia.
   - Ordenar por fecha/utilidad, no solo cronológico.

9. **Recordatorios y newsletter**
   - Secuencias por provincia/tipo.
   - Preferencias de usuario y baja clara.
   - Medir apertura/conversión.

10. **Live tracking**
    - Finalizar dashboard organizador.
    - Checklist QR, exportaciones CSV/PDF de dorsales.
    - Status de carrera y tiempos oficiales.
    - App Expo con envío GPS en background.
    - Limpieza de posiciones antiguas y proyecciones ETAs.

11. **Calidad técnica**
    - Añadir tests de integración para gateway y API live.
    - Añadir smoke tests de rutas principales.
    - Manejo centralizado de errores y toasts.
    - Observabilidad: logs estructurados, métricas de latencia y scraping.

12. **Rendimiento de imágenes**
    - Optimizar OG images y logos de fuente.
    - Cargar mapas solo cuando sean visibles.
    - Lazy load de componentes pesados del admin.

### Lo que NO mejorar todavía

- No añadir frameworks complejos si Next.js ya cubre el caso.
- No dividir en microservicios; el gateway separado basta.
- No cambiar stack sin evidencia de cuello de botella real.

---

## Enriquecer la aplicación con más información

Sí, la aplicación gana mucho valor si se alimenta con datos adicionales:

### Datos de carrera

- Distancia exacta, desnivel, recorrido (GPX), dificultad.
- Organizador, web oficial, redes y normativa.
- Precio por tramo, fechas de inscripción y cierre.
- Cupos, inscripciones abiertas, lista de espera.
- Tipo de superficie, avituallamientos y servicios.
- Categorías (edad, género, clubs).
- Premios y normas de seguridad.

### Datos de usuario/atleta

- Historial de carreras, PBs por distancia.
- Preferencias de provincia/tipo/distancia.
- Alertas por cercanía o nueva carrera en zona.
- Seguimiento de amigos/equipos.

### Datos operativos

- Métricas de búsqueda (qué provincias/tipos más se consultan).
- Errores de scraping por fuente y tasa de éxito.
- Latencia de endpoints y carga DB.
- Eventos live activos, runners conectados y mensajes por segundo.

### SEO y contenido

- Blog con guías (trail, preparación, nutrición).
- Páginas evergreen por provincia.
- FAQ sobre inscripciones y material.
- Reviews indexables cuando sean de calidad.

---

## Seguridad

- Tokens de dorsal hasheados.
- Rate limit en ingesta (`rate-limit.ts`).
- Validación Zod en entrada.
- CSP y headers saneados en `next.config.ts`.
- QR solo codifica `eventSlug:bib`; el paso se autentica con sesión organizador.
- Uploads GPX deben validarse por tamaño/tipo cuando se implementen.
- No registrar secrets ni tokens en logs.
- Mantener `CRON_SECRET` fuera de cliente.

---

## Riesgos y atención

- Los cambios LiveTrail están sin commit; evitar sobrescribirlos.
- Redis es opcional en dev pero obligatorio para realtime real.
- Sin tests automatizados, regresiones son probables en rutas dinámicas.
- El scraping depende de HTML/APIs externas; cualquier cambio rompe importaciones.
- El gateway y Next están desacoplados; un error en room key impide ver updates.
- La inicialización Prisma y el push de schema pueden colgarse; `start.sh` usa timeout.

---

## Verificación mínima antes de entregar

```bash
npm run lint
npm run build
```

Para cambios live:

```bash
npm run live:gateway
# publicar/recibir mensajes manualmente
```

Para cambios de scraping:

```bash
npm run import:races
# revisar ScrapeLog y total de carreras
```

---

## Referencias

- Diseño LiveTrail: `docs/superpowers/specs/2026-09-21-javipaurrun-livetrail-design.md`
- Schema: `prisma/schema.prisma`
- Provincias: `src/lib/utils.ts` (`PROVINCE_SLUGS`)
- Scraping: `src/lib/scraping.ts`
- Live: `src/lib/live.ts`, `src/lib/realtime.ts`, `services/realtime/gateway.mts`
- Auth/admin: `src/lib/auth.ts`, `src/lib/auth-helpers.ts`
- Validación: `src/lib/validation.ts`


## Actualización reciente

- Filtro cercanas por geolocalización (lat, lng, adio).
- Helper compartido de filtros: src/lib/race-filters.ts.
- Pruebas nuevas: 
pm run test:utils, 
pm run test:filters, 
pm run smoke:sources, 
pm run smoke:extra-sources.
- Comandos de backfill: 
pm run backfill:races.
- Build, tsc y lint sin errores (14 warnings preexistentes).


## Alta manual de carreras

- Página pública: /enviar-carrera (enlazada en el header).
- Endpoint: POST /api/races/submit (rate limit 5/hora por IP).
- Validación: `raceSubmissionSchema` en `src/lib/validation.ts`.
- Normalización: `src/lib/race-submission.ts` (deriva `location`, `community`, `distanceKm`, slug sin acentos).
- Las propuestas se guardan con `source: 'manual'` y `pendingReview: true`; no aparecen en el calendario hasta aprobarse.
- Tests: `npm run test:submission`.


## Moderación de propuestas (admin)

- Página: `/admin/races/pending` (enlazada desde el sidebar admin y desde `/admin/races`).
- Endpoint: `POST /api/admin/races/review` con `{ id, action: 'approve' | 'reject' }` (solo ADMIN).
- Aprobar → `pendingReview: false` (publica en el calendario). Rechazar → elimina el registro.
- Orden de la cola: `createdAt asc` (FIFO).


## Export iCal

- `GET /api/calendario/export?<filtros>` → `text/calendar` con máx. 500 eventos, usando los mismos filtros del calendario (uildCalendarWhere).
- `src/lib/ical.ts`: `generateICSVevent` genera solo el bloque VEVENT (multi-evento); `generateICalEvent` mantiene el VCALENDAR simple.
- Escapa comas, punto y coma, saltos de línea y normaliza fechas a UTC.
- UI: botón Exportar a calendario en el panel de filtros.
- Tests: `npm run test:ical` (6 casos).

## Alertas de carreras nuevas

- Modelo `RaceAlert` (email único, provincia, comunidad, tipo, minKm, maxKm, active, lastSentAt).
- `src/lib/alerts.ts`: `matchesAlert`, `alertToCalendarFilters`, `normalizeAlertInput`, upsert/deactivate.
- API: `POST /api/alerts` (alta/actualización, rate limit 5/min por IP), `GET /api/alerts?email=`, `DELETE /api/alerts?email=`.
- Digest: `src/lib/alerts-digest.ts` revisa carreras creadas en las últimas 48 h y envía email a los suscriptores que encajan.
- Cron: `GET /api/cron/alerts` (Bearer CRON_SECRET).
- UI: `src/components/AlertSignup.tsx`, integrado en el panel de filtros del calendario; lee los filtros activos de la URL.
- Tests: `npm run test:alerts` (9 casos).


## Geolocalizacion automatica del visitante

## Geolocalizacion automatica del visitante

- `src/components/AutoLocationFilter.tsx` se monta en `/calendario`.
- Flujo: pregunta -> geolocation del navegador -> `GET /api/geo/reverse` -> guarda `jp-visitor-location` en localStorage -> aplica `?provincia=` automaticamente.
- NO se aplica si el visitante ya eligio provincia/comunidad/lat a mano, ni en `/admin`, `/auth`, `/enviar-carrera`, `/offline`, `/live`.
- Banner con "Ver todas" para quitar el filtro y "X" para no volver a preguntar (`jp-visitor-dismissed`).
- `GET /api/geo/reverse?lat=&lng=`: proxy server-side de Nominatim (el navegador no puede enviar un User-Agent valido), cache 24h, rate limit 20/min por IP.
- Normalizacion: `normalizeProvinceName()` en utils + `COMMUNITY_ALIASES` en visitor-location (claves ASCII, a prueba de mojibake).
- Tests: `npm run test:visitor`, `npm run test:provinces`.


## Provincias: slug de URL != valor en la BD

El nombre visible de una provincia y el valor guardado en `Race.province` no siempre coinciden:

- slug `/carreras/alava` -> visible "Álava/Araba" -> en la BD solo existe `Araba`
- la BD nunca guarda "Guipúzcoa" (si `Gipuzkoa`), ni "Vizcaya" (si `Bizkaia`)

**Regla: nunca filtres por el nombre visible.** Usa siempre:

- `getProvinceDbNames(slug)` -> lista de valores exactos de la BD
- `normalizeProvinceName(text)` -> normaliza cualquier variante a la canónica
- `cityWhere(city)` (de `src/lib/cities.ts`) -> filtro por ciudad con alias y case-insensitive

Esta clase de bug producía contadores correctos en el hub y cero resultados en el detalle,
porque el hub tenia un caso especial escrito a mano y el detalle usaba `contains` con el
nombre visible. Ver `npm run test:provinces` para el test de regresión.

Las páginas por provincia y ciudad filtran ademas por `pendingReview: false` y
`date >= now`, y el hub `/carreras` cuenta las mismas carreras (próximas y publicadas)
para que el contador del listado coincida con el del detalle.


## Marca, UI y SEO (2026-10)

**Regla critica: publicRaces()**
Toda consulta de carreras en pagina publica debe usar `publicRaces({...})` de
`src/lib/race-filters.ts`. Sin ese filtro, las propuestas pendientes de
`/enviar-carrera` se hacian publicas en home, mapa y comparador.

**Marca**
- Logo en `src/components/Logo.tsx`: corredor cruzando una cinta de meta sobre
  calles de pista en perspectiva. Legible a 16px y a 512px.
- `npm run icons` regenera `public/icons/*.png` desde el SVG con sharp.

**UX**
- `src/components/ActiveFilterChips.tsx`: chips de filtros activos, cada uno
  quita su filtro en un clic, mas "Limpiar todo". Es la via rapida para
  deshacer un filtro sin abrir el panel.
- `src/components/AutoLocationFilter.tsx`: filtro automatico por ubicacion.

**SEO**
- `layout.tsx`: `metadataBase`, plantilla de titulos `%s | JavipaurRun`,
  keywords, canonical.
- JSON-LD: `Organization` (ya no "Euskadi/Cantabria/Zamora" sino Espana),
  `WebSite`, `SportsEvent` con `offers`/`eventStatus`, e `ItemListJsonLd`.
- `sitemap.ts` excluye pendientes e incluye las ciudades.
- `robots.ts` bloquea `/admin`, `/api`, `/auth`, `/enviar-carrera`.
- Descripciones sin jerga interna (nunca mentioning "scraping" en las metas).
