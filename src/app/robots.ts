import type { MetadataRoute } from "next";
import { envSiteUrl } from "@/lib/site-url";

// `robots.txt` es identico para todos los visitantes: si se genera con el host
// de la peticion acaba siendo dinamico y, detras de un proxy sin
// `x-forwarded-proto`, publica `http://` en la linea `Sitemap`.
export default function robots(): MetadataRoute.Robots {
  const base = envSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Rutas privadas o sin valor para el buscador.
        disallow: ["/admin/", "/api/", "/auth/", "/offline", "/enviar-carrera"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
