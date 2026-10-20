import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { PROVINCE_SLUGS, raceTypes, slugForProvinceName } from "@/lib/utils";
import { cities } from "@/lib/cities";
import { siteUrl } from "@/lib/site-url-server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE = await siteUrl();
  let posts: { slug: string; createdAt: Date }[] = [];
  let races: { slug: string; date: Date }[] = [];
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
        take: 5000,
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
    { url: BASE, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/calendario`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/carreras`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/mapa`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    {
      url: `${BASE}/completitud`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.5,
    },
    ...raceTypes.map((t) => ({
      url: `${BASE}/calendario?tipo=${t.value}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
    ...Object.keys(cities).map((city) => ({
      url: `${BASE}/carreras/ciudad/${city}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...provinceEntries.map(([slug]) => ({
      url: `${BASE}/carreras/${slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: provincePriority.get(slug) ?? (counted.has(slug) ? 0.7 : 0.6),
    })),
    ...provinceEntries.flatMap(([slug]) =>
      raceTypes.map((t) => ({
        url: `${BASE}/carreras/${slug}?tipo=${t.value}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.5,
      }))
    ),
    ...posts.map((p) => ({
      url: `${BASE}/blog/${p.slug}`,
      lastModified: p.createdAt,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...races.map((r) => ({
      url: `${BASE}/carrera/${r.slug}`,
      lastModified: r.date,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];

  return entries;
}
