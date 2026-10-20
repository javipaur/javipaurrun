import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PROVINCE_SLUGS, getAutonomousCommunity, getAutonomousCommunityLabel, getProvinceDbNames } from "@/lib/utils";
import { MapPin, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Carreras por provincia - Directorio de carreras populares - JavipaurRun",
  description:
    "Encuentra carreras populares en tu provincia: running, trail, media maratón y marchas. Directorio de carreras por provincia en toda España.",
};

const communityOrder = [
  "andalucia", "aragon", "asturias", "baleares", "canarias", "cantabria",
  "castilla-la-mancha", "castilla-y-leon", "cataluna", "comunidad-valenciana",
  "extremadura", "galicia", "la-rioja", "madrid", "murcia", "navarra",
  "pais-vasco", "otra",
];

export default async function ProvincesPage() {
  // Contamos solo carreras próximas y publicadas para que el contador del hub
// coincida con el de la página de detalle.
  const counted = await prisma.race
    .groupBy({
      by: ["province"],
      where: { pendingReview: false, date: { gte: new Date() } },
      _count: true,
    })
    .catch(() => []);

  const countByProvince = new Map(counted.map((c) => [c.province, c._count]));

  const provinces = Object.entries(PROVINCE_SLUGS).map(([slug, name]) => {
    // Los nombres de la BD no siempre coinciden con el nombre visible (p.ej. "Araba" vs "Álava/Araba").
    const dbNames = getProvinceDbNames(slug);
    let count = 0;
    for (const dbName of dbNames) {
      count += countByProvince.get(dbName) ?? 0;
    }
    return { slug, name, count, dbName: dbNames[0] ?? name };
  });

  const grouped = new Map<string, typeof provinces>();
  for (const p of provinces) {
    const community = getAutonomousCommunity(p.dbName);
    if (!grouped.has(community)) grouped.set(community, []);
    grouped.get(community)!.push(p);
  }

  const totalCount = provinces.reduce((acc, p) => acc + p.count, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-brand-gradient/10 border border-orange-200/60 dark:border-orange-500/20 flex items-center justify-center">
            <MapPin size={22} className="text-orange-500" />
          </div>
          <div>
            <p className="section-eyebrow mb-0.5">Directorio nacional</p>
            <h1 className="section-title">Carreras por provincia</h1>
          </div>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
          {totalCount} carreras próximas en {provinces.length} provincias de toda España.
        </p>
      </div>

      {communityOrder.map((community) => {
        const items = grouped.get(community);
        if (!items || items.length === 0) return null;
        return (
          <div key={community} className="mb-8">
            <h2 className="section-eyebrow mb-4">{getAutonomousCommunityLabel(community)}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {items
                .sort((a, b) => a.name.localeCompare(b.name, "es"))
                .map((p) => (
                  <Link
                    key={p.slug}
                    href={`/carreras/${p.slug}`}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-white/10 px-4 py-3 card-premium transition-colors hover:border-orange-400/60 dark:hover:border-orange-400/40"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-8 h-8 shrink-0 rounded-lg bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center text-orange-500">
                        <MapPin size={16} />
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {p.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs text-gray-400 dark:text-gray-500 tabular-nums">
                        {p.count} carrera{p.count !== 1 ? "s" : ""}
                      </span>
                      <ChevronRight size={15} className="text-gray-300 group-hover:text-orange-400 dark:text-gray-600 transition-colors" />
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        );
      })}

      <div className="card-premium rounded-2xl px-6 py-6 text-center">
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          ¿No ves tu comunidad? Prueba el{" "}
          <Link href="/calendario" className="text-orange-600 hover:text-orange-700 font-medium">
            calendario completo
          </Link>{" "}
          con todos los filtros.
        </p>
      </div>
    </div>
  );
}