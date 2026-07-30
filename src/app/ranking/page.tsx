import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Trophy, Medal, MapPin, Timer, ArrowUpRight } from "lucide-react";
import { provinces, getRaceTypeLabel } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Ranking por provincias - JavipaurRun",
  description: "Clasificación de corredores por provincias: Álava, Bizkaia, Gipuzkoa, Cantabria, Burgos, Navarra, La Rioja y Zamora.",
};

interface PageProps {
  searchParams: Promise<{ provincia?: string; tipo?: string }>;
}

export default async function RankingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const selectedProvince = params.provincia || "";
  const selectedType = params.tipo || "";

  const where: Record<string, unknown> = { hours: { not: null }, minutes: { not: null }, seconds: { not: null } };
  if (selectedProvince) where.race = { province: { contains: selectedProvince } };
  if (selectedType) where.race = { ...(where.race as object || {}), type: selectedType };

  const results = await prisma.raceResult.findMany({
    where: where as any,
    include: {
      user: { select: { id: true, name: true } },
      race: { select: { name: true, slug: true, type: true, province: true, date: true, location: true } },
    },
    orderBy: [
      { hours: "asc" },
      { minutes: "asc" },
      { seconds: "asc" },
    ],
    take: 50,
  });

  const grouped: Record<string, { user: { id: string; name: string | null }; results: typeof results; best: typeof results[0] }> = {};
  for (const r of results) {
    const key = r.user.id;
    if (!grouped[key]) {
      grouped[key] = { user: r.user, results: [], best: r };
    }
    grouped[key].results.push(r);
    const curr = grouped[key].best;
    const rSec = (r.hours ?? 0) * 3600 + (r.minutes ?? 0) * 60 + (r.seconds ?? 0);
    const cSec = (curr.hours ?? 0) * 3600 + (curr.minutes ?? 0) * 60 + (curr.seconds ?? 0);
    if (rSec < cSec) grouped[key].best = r;
  }

  const rankings = Object.values(grouped).sort((a, b) => {
    const aSec = (a.best.hours ?? 0) * 3600 + (a.best.minutes ?? 0) * 60 + (a.best.seconds ?? 0);
    const bSec = (b.best.hours ?? 0) * 3600 + (b.best.minutes ?? 0) * 60 + (b.best.seconds ?? 0);
    return aSec - bSec;
  });

  const filteredProvince = selectedProvince
    ? provinces.find((p) => p === selectedProvince) || selectedProvince
    : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Trophy size={20} className="text-orange-500" />
          Ranking de corredores
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
          {filteredProvince ? `Mejores tiempos en ${filteredProvince}` : "Mejores tiempos globales"}
          {" · "}{rankings.length} corredores
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link
          href="/ranking"
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            !selectedProvince
              ? "bg-orange-500 text-white"
              : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
          }`}
        >
          Todas
        </Link>
        {provinces.map((p) => (
          <Link
            key={p}
            href={`/ranking?provincia=${encodeURIComponent(p)}${selectedType ? `&tipo=${selectedType}` : ""}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedProvince === p
                ? "bg-orange-500 text-white"
                : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300"
            }`}
          >
            {p}
          </Link>
        ))}
      </div>

      {/* Ranking */}
      {rankings.length > 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {rankings.map((entry, i) => {
              const medalColors = ["text-yellow-500", "text-gray-400", "text-amber-600"];
              const medal = i < 3 ? (
                <Medal size={16} className={medalColors[i]} />
              ) : (
                <span className="text-xs text-gray-400 font-mono w-4 text-center">{i + 1}</span>
              );

              const best = entry.best;
              const timeStr = (best.hours ?? 0) > 0
                ? `${best.hours}:${String(best.minutes ?? 0).padStart(2, "0")}:${String(best.seconds ?? 0).padStart(2, "0")}`
                : `${String(best.minutes ?? 0).padStart(2, "0")}:${String(best.seconds ?? 0).padStart(2, "0")}`;

              return (
                <div key={entry.user.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="w-8 flex justify-center shrink-0">
                    {medal}
                  </div>
                  <Link
                    href={`/atleta/${entry.user.id}`}
                    className="flex-1 min-w-0"
                  >
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-orange-600 transition-colors">
                      {entry.user.name || "Anónimo"}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
                      <span>{entry.results.length} resultado{entry.results.length !== 1 ? "s" : ""}</span>
                      {best.race.province && (
                        <>
                          <span>·</span>
                          <MapPin size={10} />
                          <span>{best.race.province}</span>
                        </>
                      )}
                    </div>
                  </Link>
                  <div className="text-right">
                    <span className="text-sm font-bold font-mono text-gray-900 dark:text-gray-100">
                      {timeStr}
                    </span>
                    <div className="text-[10px] text-gray-400 truncate max-w-[160px]">
                      {best.race.name}
                    </div>
                  </div>
                  <Link
                    href={`/carrera/${best.race.slug}`}
                    className="shrink-0 text-gray-400 hover:text-orange-500 transition-colors"
                  >
                    <ArrowUpRight size={14} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700">
          <Trophy size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 font-medium mb-1">No hay resultados registrados aún</p>
          <p className="text-gray-400 text-sm">Los corredores aparecerán aquí cuando registren sus tiempos</p>
        </div>
      )}

      {/* Navigation link */}
      <div className="mt-6 text-center">
        <Link
          href="/calendario"
          className="text-sm text-orange-600 hover:text-orange-700 transition-colors"
        >
          Ver calendario de carreras
        </Link>
      </div>
    </div>
  );
}
