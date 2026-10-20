import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url-server";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await siteUrl();

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
    host: base,
  };
}
