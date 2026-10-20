import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import RaceFilters from "@/components/RaceFilters";
import LoadMoreRaces from "@/components/LoadMoreRaces";
import { Prisma, RaceType } from "@/generated/prisma/client";
import { haversineKm } from "@/lib/utils";
import { buildCalendarWhere, buildCalendarOrder, parseCalendarFilters } from "@/lib/race-filters";
import { SearchX } from "lucide-react";
import AutoLocationFilter from "@/components/AutoLocationFilter";
import ActiveFilterChips from "@/components/ActiveFilterChips";

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
    mes?: string;
    orden?: string;
    lat?: string;
    lng?: string;
    radio?: string;
  }>;
}

export default async function CalendarPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const now = new Date();
  const { near } = parseCalendarFilters(params);
  const where = buildCalendarWhere(params, now);
  const orderBy = buildCalendarOrder(params);

  let totalFiltered: number;
  let currentPage: number;
  let paged: Awaited<ReturnType<typeof prisma.race.findMany>>;

  if (near) {
    const delta = Math.min(Math.max(near.radius / 111, 0.1), 2);
    const nearWhere = {
      ...where,
      latitude: { not: null, gte: near.lat - delta, lte: near.lat + delta },
      longitude: { not: null, gte: near.lng - delta, lte: near.lng + delta },
    };

    const candidates = await prisma.race.findMany({
      where: nearWhere,
      orderBy: { date: "asc" },
      take: 1000,
    });

    const nearRaces = candidates
      .filter((race) => race.latitude != null && race.longitude != null)
      .map((race) => ({
        race,
        distance: haversineKm(near.lat, near.lng, race.latitude as number, race.longitude as number),
      }))
      .filter(({ distance }) => distance <= near.radius)
      .sort((a, b) => a.distance - b.distance || new Date(a.race.date).getTime() - new Date(b.race.date).getTime())
      .map(({ race }) => race);

    totalFiltered = nearRaces.length;
    currentPage = Math.min(
      Math.max(1, parseInt(params.page || "1", 10)),
      Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE))
    );
    paged = nearRaces.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  } else {
    totalFiltered = await prisma.race.count({ where });
    currentPage = Math.min(
      Math.max(1, parseInt(params.page || "1", 10)),
      Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE))
    );
    paged = await prisma.race.findMany({
      where,
      orderBy,
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    });
  }

  const baseParams = new URLSearchParams();
  if (params.tipo) baseParams.set("tipo", params.tipo);
  if (params.provincia) baseParams.set("provincia", params.provincia);
  if (params.comunidad) baseParams.set("comunidad", params.comunidad);
  if (params.distancia) baseParams.set("distancia", params.distancia);
  if (params.buscar) baseParams.set("buscar", params.buscar);
  if (params.mes) baseParams.set("mes", params.mes);
  if (params.orden) baseParams.set("orden", params.orden);
  if (params.lat && params.lng) {
    baseParams.set("lat", params.lat);
    baseParams.set("lng", params.lng);
    baseParams.set("radio", params.radio || "25");
  }

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

      {/* Suspense obligatorio: ActiveFilterChips lee useSearchParams(). */}
      <Suspense fallback={null}>
        <ActiveFilterChips total={totalFiltered} />
      </Suspense>

      <AutoLocationFilter />

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
