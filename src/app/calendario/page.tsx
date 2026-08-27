import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import RaceCard from "@/components/RaceCard";
import RaceFilters from "@/components/RaceFilters";
import { Prisma, RaceType } from "@/generated/prisma/client";
import { getAutonomousCommunity, parseKmFromDistance, distanceRanges } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Calendario de carreras populares - JavipaurRun",
  description:
    "Calendario actualizado con todas las carreras populares en España. Filtra por tipo, provincia, comunidad autónoma o busca tu próxima carrera.",
};

interface PageProps {
  searchParams: Promise<{
    tipo?: string;
    provincia?: string;
    comunidad?: string;
    distancia?: string;
    buscar?: string;
  }>;
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const where: Prisma.RaceWhereInput = {};
  where.date = { gte: new Date() };

  if (params.tipo && Object.values(RaceType).includes(params.tipo as RaceType)) where.type = params.tipo as RaceType;
  if (params.provincia) where.province = params.provincia;
  if (params.buscar) {
    where.OR = [
      { name: { contains: params.buscar } },
      { location: { contains: params.buscar } },
    ];
  }

  let races = await prisma.race.findMany({
    where,
    orderBy: { date: "asc" },
  });

  if (params.comunidad) {
    races = races.filter((r) => getAutonomousCommunity(r.province) === params.comunidad);
  }

  const distanceRange = distanceRanges.find((r) => r.value === params.distancia);
  if (distanceRange) {
    races = races.filter((r) => {
      const km = parseKmFromDistance(r.distance);
      if (km == null) return params.distancia === "sin-distancia";
      return km > distanceRange.min && km <= distanceRange.max;
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
      <div className="mb-8">
        <p className="section-eyebrow mb-1.5">Directorio nacional</p>
        <h1 className="section-title mb-2">Calendario de carreras</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {races.length} carrera{races.length !== 1 ? "s" : ""} encontrada{races.length !== 1 ? "s" : ""}
          {params.buscar && (
            <> para &ldquo;<span className="font-medium text-gray-700 dark:text-gray-200">{params.buscar}</span>&rdquo;</>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <RaceFilters />
        <div>
          {races.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {races.map((race, i) => (
                <RaceCard key={race.id} race={race} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 card-premium px-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center text-3xl mb-4">🔍</div>
              <p className="font-semibold text-gray-900 dark:text-white mb-1.5">No hay carreras con esos filtros</p>
              <p className="text-gray-500 text-sm">Prueba con otros criterios de búsqueda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
