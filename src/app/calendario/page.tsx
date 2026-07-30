import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import RaceCard from "@/components/RaceCard";
import RaceFilters from "@/components/RaceFilters";
import { Prisma, RaceType } from "@/generated/prisma/client";
import { getAutonomousCommunity } from "@/lib/utils";

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
    buscar?: string;
  }>;
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const where: Prisma.RaceWhereInput = {};
  where.date = { gte: new Date() };

  if (params.tipo && Object.values(RaceType).includes(params.tipo as RaceType)) where.type = params.tipo as RaceType;
  if (params.comunidad) where.province = params.comunidad; // placeholder, overridden after fetch
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Calendario de carreras</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {races.length} carrera{races.length !== 1 ? "s" : ""} encontrada{races.length !== 1 ? "s" : ""}
          {params.buscar && (
            <> para &ldquo;<span className="font-medium">{params.buscar}</span>&rdquo;</>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <RaceFilters />
        <div>
          {races.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {races.map((race, i) => (
                <RaceCard key={race.id} race={race} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-gray-500 font-medium mb-1">No hay carreras con esos filtros</p>
              <p className="text-gray-400 text-sm">Prueba con otros criterios de búsqueda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
