import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import RaceFilters from "@/components/RaceFilters";
import LoadMoreRaces from "@/components/LoadMoreRaces";
import { Prisma, RaceType } from "@/generated/prisma/client";
import { getAutonomousCommunity, parseKmFromDistance, distanceRanges } from "@/lib/utils";
import { SearchX } from "lucide-react";

const PAGE_SIZE = 12;

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
    page?: string;
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

  const races = await prisma.race.findMany({
    where,
    orderBy: { date: "asc" },
  });

  // Memory filters (comunidad + distancia)
  const allFiltered = races.filter((r) => {
    if (params.comunidad && getAutonomousCommunity(r.province) !== params.comunidad) return false;
    if (params.distancia) {
      const distanceRange = distanceRanges.find((d) => d.value === params.distancia);
      if (distanceRange) {
        const km = parseKmFromDistance(r.distance);
        if (km == null) return params.distancia === "sin-distancia";
        if (!(km > distanceRange.min && km <= distanceRange.max)) return false;
      }
    }
    return true;
  });

  const totalFiltered = allFiltered.length;
  const currentPage = Math.min(Math.max(1, parseInt(params.page || "1", 10)), Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE)));
  const paged = allFiltered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const baseParams = new URLSearchParams();
  if (params.tipo) baseParams.set("tipo", params.tipo);
  if (params.provincia) baseParams.set("provincia", params.provincia);
  if (params.comunidad) baseParams.set("comunidad", params.comunidad);
  if (params.distancia) baseParams.set("distancia", params.distancia);
  if (params.buscar) baseParams.set("buscar", params.buscar);

  const queryString = baseParams.toString();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
      <div className="mb-8">
        <p className="section-eyebrow mb-1.5">Directorio nacional</p>
        <h1 className="section-title mb-2">Calendario de carreras</h1>
        <p className="text-text-secondary text-sm">
          {totalFiltered} carrera{totalFiltered !== 1 ? "s" : ""} encontrada{totalFiltered !== 1 ? "s" : ""}
          {params.buscar && (
            <> para &ldquo;<span className="font-medium text-text-primary">{params.buscar}</span>&rdquo;</>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <RaceFilters />
        <div>
          {totalFiltered > 0 ? (
            <LoadMoreRaces
              races={paged}
              total={totalFiltered}
              page={currentPage}
              query={queryString}
            />
          ) : (
            <div className="text-center py-20 card-premium px-6 animate-fade-in">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-50 dark:bg-primary/10 flex items-center justify-center mb-4">
                <SearchX size={28} className="text-primary" />
              </div>
              <p className="font-semibold text-text-primary mb-1.5 text-lg">No hay carreras con esos filtros</p>
              <p className="text-text-secondary text-sm mb-6 max-w-sm mx-auto">
                Prueba con otros criterios de búsqueda o vuelve a ver todas las carreras disponibles.
              </p>
              <Link href="/calendario" className="btn-primary inline-flex">
                Ver todas las carreras
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
