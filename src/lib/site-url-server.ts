import { headers } from "next/headers";
import { envSiteUrl } from "@/lib/site-url";

/**
 * Dominio de la peticion actual, que gana siempre sobre la variable de entorno.
 *
 * Solo para servidor: usa `next/headers`, asi que no puede acabar en un client
 * component. Para codigo compartido con el cliente usa `envSiteUrl()` de
 * `@/lib/site-url`.
 *
 * Es lo que evita que un `NEXT_PUBLIC_APP_URL` equivocado en produccion mande
 * canonicals, sitemap y JSON-LD a un dominio que no existe: aunque la variable
 * este mal, las URLs saldran con el host por el que realmente nos llegan.
 */
export async function siteUrl(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (host) {
      const clean = host.split(",")[0].trim();
      const isLocal = clean.startsWith("localhost") || clean.startsWith("127.0.0.1");
      const proto = h.get("x-forwarded-proto") ?? (isLocal ? "http" : "https");
      return `${proto}://${clean}`;
    }
  } catch {
    // Sin contexto de peticion (scripts, cron): se usa la variable de entorno.
  }
  return envSiteUrl();
}
