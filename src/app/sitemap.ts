import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "https://javipaurrun.com";

const raceTypes = [
  "ASFALTO", "TRAIL", "MEDIA_MARATON", "MARATON", "MARCHA", "ORIENTACION",
] as const;

const provinces = [
  "Araba", "Bizkaia", "Gipuzkoa", "Cantabria", "Burgos", "La Rioja", "Navarra", "Zamora",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    select: { slug: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  const races = await prisma.race.findMany({
    select: { slug: true, date: true },
    orderBy: { date: "desc" },
    take: 1000,
  });

  const entries: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/calendario`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/mapa`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    ...raceTypes.map((t) => ({
      url: `${BASE}/calendario?tipo=${t}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
    ...provinces.map((p) => ({
      url: `${BASE}/calendario?provincia=${encodeURIComponent(p)}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.5,
    })),
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
