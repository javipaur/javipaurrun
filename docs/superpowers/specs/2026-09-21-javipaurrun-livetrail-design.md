# JavipaurRun + Plataforma LiveTrail-like — Diseño

Fecha: 2026-09-21

## 1. Visión y objetivos

Construir sobre la app existente dos bloques:

- **A. Directorio**: alimentar la base con muchas más carreras (nuevos scrapers) y mejorar la indexación SEO por provincia y tipo.
- **B. Plataforma B2B de seguimiento en vivo** (estilo web.livetrail.net): múltiples organizadores gestionan eventos; el público sigue a corredores con mapa y clasificación en tiempo real; la posición GPS llega desde la app móvil del corredor; los checkpoints se capturan por QR, geofence, confirmación manual o chips RFid.

Decisiones confirmadas con el usuario:

- VPS propio con proceso siempre vivo.
- App nativa Expo para el corredor con envío de GPS en background.
- Tiempo real por WebSocket/SSE desde el inicio.
- Cronometraje multi-vía: QR + geofence + manual + RFid.
- Plataforma multi-evento (B2B).
- Alimentación del directorio vía más scrapers.

## 2. Arquitectura general

```
App corredor (Expo)
   │  HTTPS POST posiciones (token dorsal)
   ▼
Next.js (VPS, always-on)  ── API de ingesta ──▶ PostgreSQL (Prisma)
   │   ▲                                     │
   │   │ insert + geofence + proyección      │ publica
   ▼   │                                     ▼
Redis pub/sub  ◀──────▶  Realtime Gateway (proceso Node: ws + SSE)
                               ▲ rooms por evento
Página pública /live/[event]   │ fan-out
Organizador (dashboard web) ───┘
```

- **Next.js**: frontal y API (ingesta, dashboard, CRUD, directorio).
- **Realtime Gateway**: proceso separado (`services/realtime/`) en el mismo VPS, suscribe a Redis y sirve WebSocket + SSE. Reutiliza la misma instancia siempre viva.
- **Redis**: bus entre API y gateway (pub/sub).

Alternativa considerada: custom server en Next con WebSocket integrado. Se descarta: un gateway separado es más simple de desplegar/monitorear y no fuerza un `server.js` sobre Next 16.

## 3. Modelo de datos (incrementos sobre prisma/schema.prisma)

Todos los cambios son incrementales, no se rompe el esquema existente.

```prisma
enum RunnerStatus { REGISTRADO, EN_CURSO, FINALIZADO, NO_PARTIR, DESCALIFICADO }
enum PassSource { QR, GEOFENCE, MANUAL, RFID }

model Organization {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  users     User[]            // admins del organizador (m:N via OrganizerMembership)
  events    Event[]
  createdAt / updatedAt
}

model Event {
  id             String  @id @default(cuid())
  organizationId String
  name / slug    (slug unique)
  description    String?
  date           DateTime
  raceId         String?          // opcional: enlazar con Race del directorio
  route          Json?            // GeoJSON de la traza
  status         @default("DRAFT")
  liveOpen       Boolean @default(false)
  checkpoints    Checkpoint[]
  runners        EventRunner[]
  createdAt / updatedAt
}

model Checkpoint {
  id / eventId / order Int
  name, km Float, lat?, lng?
  radius Int @default(50)          // metros para geofence
  passes CheckpointPass[]
}

model EventRunner {
  id / eventId
  bib    Int                       // dorsal
  name   String
  category String?
  token  String  @unique           // token de auth del corredor (hash)
  status RunnerStatus @default(REGISTRADO)
  startTime? / finishTime? DateTime
  positions LivePosition[]
  passes   CheckpointPass[]
  @@unique([eventId, bib])
}

model LivePosition {
  id / runnerId / eventId          // eventId desnormalizado para index
  lat / lng Float
  km Float?                        // distancia recorrida (acumulada)
  speed Float? / heading Float?
  createdAt DateTime
  @@index([eventId, createdAt])
}

model CheckpointPass {
  id / runnerId / checkpointId / eventId
  time   DateTime
  source PassSource
  @@unique([runnerId, checkpointId])
}
```

`User.role` se amplía: `ADMIN | ORGANIZADOR | USER`.

## 4. Fase 0 — Directorio

1. Nuevos scrapers en `src/lib/scraping.ts` siguiendo el patrón `scrapeFromSportmaniacs()`. Candidatos priorizados:
   - `carreraspopulares.com` (ya contemplado en `next.config.ts`).
   - Calendario FEDME CxM.
   - iRun / Donsport / Chronorace (Cheerio).
   Cada uno se registra en el array `sources`; la dedup/actualización/geocoding son comunes.
2. Sitemap completo (`sitemap.ts`): ahora solo 8 provincias hardcodeadas y 1000 carreras por fecha desc. Cambios: las 50 provincias, prioridades, incluir `/carreras/[provincia]` y páginas tipo×provincia.
3. Índice de provincias: página hub `/carreras` que enlace las 50 provincias.

## 5. Fase 1 — MVP de seguimiento en vivo

**Ingesta de posiciones**

`POST /api/live/[eventSlug]/positions` · auth por `Authorization: Bearer <dorsal token>` · rate-limit por runner · body `{ lat, lng, km, speed?, heading?, timestamp? }`.

Handler: validar runner EN_CURSO → insertar `LivePosition` → geofence (si un checkpoint cruza en km/radio, crear `CheckpointPass` con `source=GEOFENCE`) → recalcular proyección → `redis.publish`. Respuesta 204.

**Tiempo real**

Gateway Node (`ws` + SSE): suscribe a `live:{eventId}`, mantiene rooms por evento, hace fan-out. Cliente web conexión WebSocket con fallback SSE.

**Página pública `/live/[eventSlug]`**

- Mapa Leaflet con marcadores vivos e ícono por estado; polyline de la traza.
- Clasificación en vivo (puesto según km/distancia total), dorsal/nombre/categoría.
- Progreso por checkpoint y barra de avance.
- Favoritos (localStorage) y filtros por categoría.
- Snapshot inicial REST (`/api/live/[eventSlug]/snapshot`) + stream incremental.
- Estimación ETA a finish y al siguiente checkpoint (proyección lineal).

**Checkpoints QR**

Endpoint en PWA del organizador: cámara escanea código del dorsal (string `eventSlug:bib`). POST a `/api/live/[event]/checkpoint/[id]/pass` con `source=QR`, registra `CheckpointPass`.

**Seed/MVP**: un organizador, un evento, alta de runners por dorsal.

## 6. Fase 2 — Dashboard organizador

- Auth: role `ORGANIZADOR`; `Organization` ligada al usuario.
- Gestión de evento: crear/editar, enlazar `Race`, subir GPX/KML → GeoJSON, estados DRAFT/PROGRAMADO/EN_VIVO.
- Checkpoints: CRUD con km, nombre, coordenadas, radio geofence, modos de captura.
- Corredores: alta masiva (CSV/paste), códigos QR por dorsal, lista imprimible, estados, tiempos.
- Panel de control en vivo: tabla, últimos pasos, incidencias, botón live.
- Rutas: `/admin/eventos`, `/admin/eventos/[id]`.

## 7. Fase 3 — App corredor (Expo)

- Stack: Expo + TypeScript + expo-location + expo-task-manager + expo-notifications. Expo Router.
- Pantallas: login (código de evento + dorsal → token), en curso (distancia, tiempo, siguiente checkpoint), confirmación manual, mapa resumido.
- Background GPS: `startLocationUpdatesAsync` alta precisión, envío en ráfagas (cada ~15 s).
- Distribution: dev build vía EAS (background location no corre en Expo Go).

## 8. Fase 4 — RFid, WebTV, stats, escalado

- RFid: importación CSV de cronometrajes (dorsal+checkpoint+hora) → `CheckpointPass` con `source=RFID`.
- WebTV: embed del evento en directo.
- Stats: gráficas de participación, ritmos, curvas de avance.
- Escalado: sharding de posiciones por evento, gateway multi-instancia, limpieza.

## 9. Seguridad

- Tokens de dorsal hasheados (bcrypt, ya en deps) y nunca expuestos públicamente.
- Rate-limit en ingesta y pasos; validación zod (patrón `validation.ts`).
- Uploads GPX validados (tamaño/tipo).
- CSP de `next.config.ts`: añadir origen del gateway y `geo:` en `img-src` para Leaflet si procede.
- QR: solo codifica `eventSlug:bib` (sin token); el paso se autentica con la sesión del organizador.

## 10. Pruebas y verificación

El repo no tiene runner de tests; `package.json` solo tiene `lint` y `build`. Para cada fase:

- `npm run lint` y `npm run build` como puerta.
- Test de integración mínimo del gateway (publicar→recibir) ejecutable con `tsx`.
- Verificación manual del flujo live con script simulado de posiciones.

## 11. Despliegue

`nixpacks.toml` + `start.sh`: ampliar para levantar Redis, arrancar el gateway, y ejecutar migraciones. Todo en el mismo VPS.

## 12. Fases y tamaño

| Fase | Contenido | Tamaño |
|---|---|---|
| 0 | Scrapers + sitemap + hub provincias | Pequeña |
| 1 | Datos, ingesta, Gateway, página live, QR+geofence | Grande (MVP) |
| 2 | Dashboard organizador + gestión eventos/corredores | Grande |
| 3 | App Expo nativa | Grande |
| 4 | RFid, WebTV, stats, escalado | Media |