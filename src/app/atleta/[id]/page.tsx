import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { Trophy, Calendar, MapPin, Timer, Medal, ArrowUpRight } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    select: { name: true },
  });
  if (!user) return { title: "Atleta no encontrado - JavipaurRun" };
  return {
    title: `${user.name} - Perfil atleta - JavipaurRun`,
    description: `Perfil de ${user.name} con sus resultados y marcas en carreras populares.`,
  };
}

export default async function AthletePage({ params }: PageProps) {
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      image: true,
      createdAt: true,
      results: {
        include: {
          race: { select: { name: true, slug: true, type: true, date: true, location: true, province: true, distance: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user || !user.name) notFound();

  const personalBests: Record<string, (typeof user.results)[0]> = {};
  for (const r of user.results) {
    const type = r.race.type;
    if (r.hours == null || r.minutes == null || r.seconds == null) continue;
    const current = personalBests[type];
    if (
      !current ||
      current.hours == null || current.minutes == null || current.seconds == null ||
      r.hours < current.hours ||
      (r.hours === current.hours && r.minutes < current.minutes) ||
      (r.hours === current.hours && r.minutes === current.minutes && r.seconds < current.seconds)
    ) {
      personalBests[type] = r;
    }
  }

  const typeLabels: Record<string, string> = {
    ASFALTO: "Asfalto",
    MEDIA_MARATON: "Media Maratón",
    MARATON: "Maratón",
    TRAIL: "Trail",
    MARCHA: "Marcha",
    ORIENTACION: "Orientación",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-8">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-24 md:h-32" />

        <div className="px-6 md:px-8 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 mb-6">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl bg-white dark:bg-gray-900 border-2 border-white dark:border-gray-900 shadow-md flex items-center justify-center">
              {user.image ? (
                <img src={user.image} alt={user.name} className="w-full h-full rounded-lg object-cover" />
              ) : (
                <span className="text-2xl font-bold text-orange-500">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                {user.name}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Se unió el {formatDate(user.createdAt)} · {user.results.length} resultado{user.results.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Personal Bests */}
          {Object.keys(personalBests).length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <Medal size={16} className="text-orange-500" />
                Mejores marcas personales
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(personalBests).map(([type, result]) => (
                  <Link
                    key={type}
                    href={`/carrera/${result.race.slug}`}
                    className="block bg-gray-50 dark:bg-gray-800 rounded-xl p-4 hover:shadow-sm transition-shadow"
                  >
                    <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase">
                      {typeLabels[type] || type}
                    </span>
                    <p className="text-lg font-bold font-mono text-gray-900 dark:text-gray-100 mt-1">
                      {result.hours != null && result.hours > 0
                        ? `${result.hours}:${String(result.minutes ?? 0).padStart(2, "0")}:${String(result.seconds ?? 0).padStart(2, "0")}`
                        : `${String(result.minutes ?? 0).padStart(2, "0")}:${String(result.seconds ?? 0).padStart(2, "0")}`}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                      {result.race.name} · {result.race.distance || "—"}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <Trophy size={16} className="text-orange-500" />
              Resultados ({user.results.length})
            </h2>
            {user.results.length > 0 ? (
              <div className="space-y-2">
                {user.results.map((r) => (
                  <Link
                    key={r.id}
                    href={`/carrera/${r.race.slug}`}
                    className="flex items-center gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-gray-900 dark:text-gray-100 font-mono block">
                        {r.time}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 text-xs truncate block">
                        {r.race.name}
                      </span>
                    </div>
                    <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {formatDate(r.race.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin size={11} />
                        {r.race.location}
                      </span>
                    </div>
                    {r.position && (
                      <span className="text-xs font-semibold bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-md">
                        #{r.position}
                      </span>
                    )}
                    <ArrowUpRight size={14} className="text-gray-400 shrink-0" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
                Este atleta aún no ha registrado resultados
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
