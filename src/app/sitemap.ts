import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { PROVINCE_SLUGS, slugForProvinceName } from "@/lib/utils";
import { cities, canonicalCitySlug } from "@/lib/cities";
import { envSiteUrl } from "@/lib/site-url";

// Sin esto el sitemap se genera una vez en el build y no incorpora carreras
// nuevas hasta el siguiente despliegue.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE = envSiteUrl();
  let posts: { slug: string; createdAt: Date }[] = [];
  let races: { slug: string; date: Date; updatedAt: Date }[] = [];
  let provinceCounts: { province: string; _count: number }[] = [];

  if (process.env.DATABASE_URL) {
    try {
      posts = await prisma.blogPost.findMany({
        where: { published: true },
        select: { slug: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1000,
      });
    } catch {}

    try {
      // Solo carreras publicadas. Las propuestas pendientes no deben indexarse.
      races = await prisma.race.findMany({
        where: { pendingReview: false },
        select: { slug: true, date: true, updatedAt: true },
        orderBy: { date: "desc" },
        // Limite tecnico del protocolo de sitemaps (50.000 URLs por fichero).
        take: 45000,
      });
    } catch {}

    try {
      const grouped = await prisma.race.groupBy({
        by: ["province"],
        where: { pendingReview: false, date: { gte: new Date() } },
        _count: true,
      });
      provinceCounts = grouped.map((g) => ({ province: g.province, _count: g._count }));
    } catch {}
  }

  const provinceEntries = Object.entries(PROVINCE_SLUGS);
  const provincePriority = new Map<string, number>();
  const counted = new Set<string>();

  // slugForProvinceName tolera que el nombre de la BD difiera del visible
  // ("Araba" en BD vs "Álava/Araba" visible). Con igualdad estricta esas
  // provincias no aparecian nunca en el sitemap.
  const ranked = [...provinceCounts]
    .map((c) => ({ slug: slugForProvinceName(c.province), count: c._count }))
    .filter((c): c is { slug: string; count: number } => c.slug !== null)
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);

  for (const c of ranked) {
    provincePriority.set(c.slug, 0.8);
    counted.add(c.slug);
  }

  const entries: MetadataRoute.Sitemap = [
    // Los hubs no declaran lastModified: `new Date()` en cada peticion hacia
    // que las 2.600 URLs pareciesen modificadas en cada rastreo.
    { url: BASE, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/calendario`, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/carreras`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/mapa`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/blog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/calculadora-ritmo`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/completitud`, changeFrequency: "weekly", priority: 0.5 },
    // Sin URLs con query (?tipo=...): compiten entre si y ya no existe una
    // landing estatica equivalente. Volveran al sitemap cuando exista ruta propia.
    // Una sola URL por ciudad: los alias (`gasteiz`, `san-sebastian`,
    // `pamplona-iruna`) declaran canonico a la ficha principal y no se listan.
    ...Object.keys(cities)
      .filter((city) => canonicalCitySlug(city) === city)
      .map((city) => ({
        url: `${BASE}/carreras/ciudad/${city}`,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ...provinceEntries.map(([slug]) => ({
      url: `${BASE}/carreras/${slug}`,
      changeFrequency: "daily" as const,
      priority: provincePriority.get(slug) ?? (counted.has(slug) ? 0.7 : 0.6),
    })),
    ...posts.map((p) => ({
      url: `${BASE}/blog/${p.slug}`,
      lastModified: p.createdAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...races.map((r) => ({
      url: `${BASE}/carrera/${r.slug}`,
      // `updatedAt` refleja cuando cambiamos el dato. `r.date` era la fecha de
      // la carrera: Google recibia como "modificado" una fecha futura.
      lastModified: r.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];

  return entries;
}
