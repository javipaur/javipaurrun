/**
 * Dominio del sitio, sin dependencias de servidor.
 *
 * Este modulo es ISOMORFICO a proposito: se importa desde codigo que acaba en
 * el bundle del cliente (p. ej. src/lib/ical.ts, usado por RaceDetailClient).
 * Por eso NO puede importar `next/headers`; la version que si lo hace vive en
 * `site-url-server.ts`.
 */

/**
 * Dominio real del sitio. Es el unico valor que debe usarse cuando no hay
 * una variable de entorno o esta apunta a un dominio que no responde.
 *
 * IMPORTANTE: no reintroducir `javipaurrun.com`. Ese dominio no resuelve en
 * DNS y fue el que enveneno sitemap.xml, robots.txt y el JSON-LD en produccion.
 */
export const FALLBACK_SITE_URL = "https://running.javierpalacio.es";

/**
 * Dominio configurado por entorno, si es utilizable.
 *
 * Valida que sea una URL absoluta con host. Un valor mal formado (o vacio)
 * se descarta en lugar de propagarse al sitemap.
 */
export function envSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (raw) {
    try {
      const url = new URL(raw);
      if (url.protocol === "https:" || url.protocol === "http:") {
        return url.origin;
      }
    } catch {
      // valor invalido: cae al dominio real
    }
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[site-url] NEXT_PUBLIC_APP_URL="${raw}" no es una URL valida. Se usa ${FALLBACK_SITE_URL}.`
      );
    }
  }

  return FALLBACK_SITE_URL;
}

/** Une la ruta con el dominio resuelto, sin barras duplicadas. */
export function absoluteUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}
