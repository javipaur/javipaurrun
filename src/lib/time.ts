/**
 * Fecha de referencia para "carreras próximas".
 *
 * `new Date()` a secas hacía desaparecer las carreras del mismo día: la fecha se
 * guarda a las 00:00, así que en cuanto pasaban unos segundos ya no cumplían
 * `date >= now` y la carrera de hoy dejaba de listarse.
 *
 * Además, un valor que cambia en cada petición impide que el resultado sea
 * cacheable: con el inicio del día todas las páginas (ISR de 1 h) ven el mismo
 * corte y los contadores no bailan entre home, hub y provincia.
 *
 * El "día" se calcula en Europe/Madrid y no en la zona del servidor (Vercel
 * corre en UTC): a las 00:30 en España todavía sería "ayer" en UTC.
 */
export function startOfToday(now: Date = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = Number(parts.find((p) => p.type === "year")?.value);
  const month = Number(parts.find((p) => p.type === "month")?.value);
  const day = Number(parts.find((p) => p.type === "day")?.value);

  return new Date(Date.UTC(year, month - 1, day));
}
