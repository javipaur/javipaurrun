import { prisma } from "@/lib/prisma";
import { distanceRanges, getAutonomousCommunity } from "@/lib/utils";
import type { z } from "zod";
import type { raceAlertSchema } from "@/lib/validation";

export type RaceAlertInput = z.infer<typeof raceAlertSchema>;

export interface AlertBounds {
  province: string | null;
  community: string | null;
  type: "ASFALTO" | "MEDIA_MARATON" | "MARATON" | "TRAIL" | "MARCHA" | "ORIENTACION" | null;
  minKm: number | null;
  maxKm: number | null;
}

export function normalizeAlertInput(input: Partial<AlertBounds>): AlertBounds {
  return {
    province: input.province?.trim() || null,
    community: input.community?.trim() || null,
    type: (input.type as AlertBounds["type"]) ?? null,
    minKm: input.minKm ?? null,
    maxKm: input.maxKm ?? null,
  };
}

/** Convierte una alerta a un filtro reutilizable de calendario. */
export function alertToCalendarFilters(alert: AlertBounds) {
  const filters: Record<string, string> = {};

  if (alert.province) filters.provincia = alert.province;
  if (alert.community) filters.comunidad = alert.community;
  if (alert.type) filters.tipo = alert.type;

  if (alert.minKm == null && alert.maxKm == null) return filters;

  // Si coincide exactamente con un rango predefinido, reutilizamos el valor.
  for (const range of distanceRanges) {
    const matchesMin = alert.minKm == null || alert.minKm === range.min;
    const matchesMax = alert.maxKm == null || alert.maxKm === range.max;
    if (matchesMin && matchesMax) {
      filters.distancia = range.value;
      return filters;
    }
  }

  return filters;
}

export function matchesAlert(
  race: { province: string; type: string; distanceKm: number | null },
  alert: AlertBounds
): boolean {
  if (alert.province && race.province !== alert.province) return false;

  if (alert.community && getAutonomousCommunity(race.province) !== alert.community) return false;

  if (alert.type && race.type !== alert.type) return false;

  const km = race.distanceKm;

  if (alert.minKm != null) {
    if (km == null || km < alert.minKm) return false;
  }
  if (alert.maxKm != null) {
    if (km == null || km > alert.maxKm) return false;
  }

  return true;
}

export async function upsertRaceAlert(input: RaceAlertInput) {
  const bounds = normalizeAlertInput(input);
  const email = input.email.trim().toLowerCase();

  return prisma.raceAlert.upsert({
    where: { email },
    create: {
      email,
      province: bounds.province,
      community: bounds.community,
      type: bounds.type,
      minKm: bounds.minKm,
      maxKm: bounds.maxKm,
      active: true,
    },
    update: {
      province: bounds.province,
      community: bounds.community,
      type: bounds.type,
      minKm: bounds.minKm,
      maxKm: bounds.maxKm,
      active: true,
    },
  });
}

export async function getRaceAlertByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return prisma.raceAlert.findUnique({ where: { email: normalized } });
}

export async function deactivateRaceAlert(email: string) {
  const normalized = email.trim().toLowerCase();
  return prisma.raceAlert.updateMany({
    where: { email: normalized },
    data: { active: false },
  });
}