## Geolocalizacion automatica del visitante

- `src/components/AutoLocationFilter.tsx` se monta en `/calendario`.
- Flujo: pregunta -> geolocation del navegador -> `GET /api/geo/reverse` -> guarda `jp-visitor-location` en localStorage -> aplica `?provincia=` automaticamente.
- NO se aplica si el visitante ya eligio provincia/comunidad/lat a mano, ni en `/admin`, `/auth`, `/enviar-carrera`, `/offline`, `/live`.
- Banner con "Ver todas" para quitar el filtro y "X" para no volver a preguntar (`jp-visitor-dismissed`).
- `GET /api/geo/reverse?lat=&lng=`: proxy server-side de Nominatim (el navegador no puede enviar un User-Agent valido), cache 24h, rate limit 20/min por IP.
- Normalizacion: `normalizeProvinceName()` en utils + `COMMUNITY_ALIASES` en visitor-location (claves ASCII, a prueba de mojibake).
- Tests: `npm run test:visitor`, `npm run test:provinces`.