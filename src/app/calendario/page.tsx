import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import RaceCard from "@/components/RaceCard";
import RaceFilters from "@/components/RaceFilters";
import { Prisma, RaceType } from "@/generated/prisma/client";
import { getAutonomousCommunity, parseKmFromDistance, distanceRanges } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, parseInt(params.page || "1", 10)), totalPages);
  const paged = allFiltered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const baseParams = new URLSearchParams();
  if (params.tipo) baseParams.set("tipo", params.tipo);
  if (params.provincia) baseParams.set("provincia", params.provincia);
  if (params.comunidad) baseParams.set("comunidad", params.comunidad);
  if (params.distancia) baseParams.set("distancia", params.distancia);
  if (params.buscar) baseParams.set("buscar", params.buscar);

  function pageUrl(page: number) {
    const p = new URLSearchParams(baseParams.toString());
    if (page > 1) p.set("page", String(page));
    return `/calendario?${p.toString()}`;
  }

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
          {paged.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paged.map((race, i) => (
                  <RaceCard key={race.id} race={race} index={i} />
                ))}
              </div>

              {totalPages > 1 && (
                <nav aria-label="Paginación" className="flex items-center justify-center gap-1.5 mt-10">
                  {currentPage > 1 && (
                    <Link href={pageUrl(currentPage - 1)} className="btn-secondary text-xs">
                      <ChevronLeft size={14} /> Anterior
                    </Link>
                  )}
                  <span className="px-3 py-1.5 text-xs font-semibold text-text-primary">
                    {currentPage} / {totalPages}
                  </span>
                  {currentPage < totalPages && (
                    <Link href={pageUrl(currentPage + 1)} className="btn-secondary text-xs">
                      Siguiente <ChevronRight size={14} />
                    </Link>
                  )}
                </nav>
              )}
            </>
          ) : (
            <div className="text-center py-20 card-premium px-6">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-50 flex items-center justify-center text-3xl mb-4">🔍</div>
              <p className="font-semibold text-text-primary mb-1.5">No hay carreras con esos filtros</p>
              <p className="text-text-secondary text-sm">Prueba con otros criterios de búsqueda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
