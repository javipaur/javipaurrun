import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildCalendarWhere, buildCalendarOrder, parseCalendarFilters } from "@/lib/race-filters";
import { haversineKm } from "@/lib/utils";

const PAGE_SIZE = 12;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const raw = {
    tipo: searchParams.get("tipo") || undefined,
    provincia: searchParams.get("provincia") || undefined,
    comunidad: searchParams.get("comunidad") || undefined,
    distancia: searchParams.get("distancia") || undefined,
    buscar: searchParams.get("buscar") || undefined,
    mes: searchParams.get("mes") || undefined,
    orden: searchParams.get("orden") || undefined,
    lat: searchParams.get("lat") || undefined,
    lng: searchParams.get("lng") || undefined,
    radio: searchParams.get("radio") || undefined,
    page: searchParams.get("page") || undefined,
  };

  const pageParam = raw.page;
  const { near } = parseCalendarFilters(raw);
  const now = new Date();
  const where = buildCalendarWhere(raw, now);
  const orderBy = buildCalendarOrder(raw);

  try {
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

      const total = nearRaces.length;
      const page = Math.min(Math.max(1, parseInt(pageParam || "1", 10)), Math.max(1, Math.ceil(total / PAGE_SIZE)));
      const races = nearRaces.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

      return NextResponse.json({ races, total, page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) });
    }

    const total = await prisma.race.count({ where });
    const page = Math.min(Math.max(1, parseInt(pageParam || "1", 10)), Math.max(1, Math.ceil(total / PAGE_SIZE)));

    const races = await prisma.race.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    });

    return NextResponse.json({ races, total, page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    );
  }
}
