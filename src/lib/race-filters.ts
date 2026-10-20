import { Prisma, RaceType } from "@/generated/prisma/client";
import { distanceRanges, getProvincesByCommunity } from "@/lib/utils";

export interface CalendarFilters {
  tipo?: string;
  provincia?: string;
  comunidad?: string;
  distancia?: string;
  buscar?: string;
  mes?: string;
  orden?: string;
  lat?: string;
  lng?: string;
  radio?: string;
  page?: string;
}

export interface CalendarNearFilter {
  lat: number;
  lng: number;
  radius: number;
}

export function parseCalendarFilters(raw: CalendarFilters) {
  const lat = raw.lat ? Number(raw.lat) : Number.NaN;
  const lng = raw.lng ? Number(raw.lng) : Number.NaN;
  const radius = raw.radio ? Number(raw.radio) : 25;

  return {
    filters: raw,
    near: Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng, radius } : null,
  };
}

export function buildCalendarWhere(raw: CalendarFilters, now = new Date()): Prisma.RaceWhereInput {
  const where: Prisma.RaceWhereInput = { pendingReview: false };

  const tipo = raw.tipo;
  if (tipo && Object.values(RaceType).includes(tipo as RaceType)) where.type = tipo as RaceType;

  if (raw.provincia) where.province = raw.provincia;

  if (raw.comunidad) {
    const communityProvinces = getProvincesByCommunity(raw.comunidad);
    if (communityProvinces.length > 0) {
      if (raw.provincia) {
        if (!communityProvinces.includes(raw.provincia)) where.province = { in: [] };
      } else {
        where.province = { in: communityProvinces };
      }
    }
  }

  if (raw.buscar) {
    where.OR = [
      { name: { contains: raw.buscar, mode: "insensitive" } },
      { location: { contains: raw.buscar, mode: "insensitive" } },
      { province: { contains: raw.buscar, mode: "insensitive" } },
    ];
  }

  if (raw.distancia) {
    if (raw.distancia === "sin-distancia") {
      where.distanceKm = null;
    } else {
      const distanceRange = distanceRanges.find((d) => d.value === raw.distancia);
      if (distanceRange) {
        if (!Number.isFinite(distanceRange.max)) {
          where.distanceKm = { gt: distanceRange.min };
        } else {
          where.distanceKm = { gt: distanceRange.min, lte: distanceRange.max };
        }
      }
    }
  }

  if (raw.mes && /^\d{4}-\d{2}$/.test(raw.mes)) {
    const [year, month] = raw.mes.split("-").map(Number);
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    where.date = { gte: new Date(Math.max(start.getTime(), now.getTime())), lt: end };
  } else {
    where.date = { gte: now };
  }

  return where;
}

export function buildCalendarOrder(raw: CalendarFilters): Prisma.RaceOrderByWithRelationInput {
  if (raw.orden === "distancia-asc") return { distanceKm: "asc" };
  if (raw.orden === "distancia-desc") return { distanceKm: "desc" };
  return { date: "asc" };
}

/**
 * Filtro base para cualquier consulta de carreras **publicable**.
 *
 * Sin esto, las propuestas enviadas desde /enviar-carrera (pendingReview = true)
 * se filtraban a la home, al mapa o al comparador antes de ser moderadas.
 */
export function publicRaces(extra: Prisma.RaceWhereInput = {}): Prisma.RaceWhereInput {
  return { pendingReview: false, ...extra };
}
