import { cache } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { startOfToday } from "@/lib/time";
import {
  PROVINCE_SLUGS,
  canonicalProvinceSlug,
  canonicalProvinceSlugs,
  getAutonomousCommunity,
  getAutonomousCommunityLabel,
  getProvinceDbNames,
  slugForProvinceName,
} from "@/lib/utils";

/**
 * Una sola definición de "carrera pública y próxima".
 *
 * Antes cada página usaba `date: { gte: new Date() }` por su cuenta: las
 * carreras de hoy desaparecían a medianoche, el corte cambiaba entre peticiones
 * y los contadores de home, hub y provincia no cuadraban entre sí.
 */
export function upcomingWhere(extra: Prisma.RaceWhereInput = {}): Prisma.RaceWhereInput {
  return { pendingReview: false, date: { gte: startOfToday() }, ...extra };
}

export const UNKNOWN_PROVINCE_LABEL = "Sin provincia";

/** Valores que no identifican una provincia real. */
const PLACEHOLDER_PROVINCES = new Set([
  "por confirmar",
  "ubicacion por confirmar",
  "sin provincia",
  "desconocida",
  "desconocido",
  "ninguna",
  "otra",
  "n a",
]);

function flatten(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Slug de la provincia de una carrera, o null si el dato no sirve. */
export function provinceSlugOrNull(raw?: string | null): string | null {
  if (!raw) return null;
  if (PLACEHOLDER_PROVINCES.has(flatten(raw))) return null;
  return slugForProvinceName(raw);
}

export interface ProvinceEntry {
  slug: string;
  label: string;
  /** Carreras próximas. */
  count: number;
  /** Nombres exactos con los que la provincia aparece en `Race.province`. */
  rawNames: string[];
  community: string;
  communityLabel: string;
}

export interface ProvinceDirectory {
  /** Provincias canónicas con al menos una carrera próxima, de más a menos. */
  provinces: ProvinceEntry[];
  /** Todas las provincias canónicas, incluidas las que hoy están a cero. */
  allProvinces: ProvinceEntry[];
  bySlug: Map<string, ProvinceEntry>;
  /** Total de carreras próximas publicadas (incluye las que no tienen provincia). */
  upcomingTotal: number;
  /** Total de carreras publicadas (incluye históricas). */
  totalRaces: number;
  /** Próximas sin provincia reconocible: se declaran, no se esconden. */
  unassignedUpcoming: number;
  unassignedTotal: number;
  /** Provincias distintas con al menos una carrera próxima. */
  provinceCount: number;
  /** Distintos valores crudos de `Race.province` que no casan con ninguna provincia. */
  unassignedNames: string[];
}

function emptyDirectory(): ProvinceDirectory {
  return {
    provinces: [],
    allProvinces: [],
    bySlug: new Map(),
    upcomingTotal: 0,
    totalRaces: 0,
    unassignedUpcoming: 0,
    unassignedTotal: 0,
    provinceCount: 0,
    unassignedNames: [],
  };
}

/**
 * Directorio de provincias con contadores coherentes.
 *
 * Es la única fuente de verdad para home, `/carreras`, cada provincia, el
 * sitemap y `/completitud`. Deduplica alias (`alava`/`arabako`), ignora
 * marcadores de posición ("por confirmar", "Otra") y expone aparte las carreras
 * sin provincia en vez de perderlas por el camino.
 *
 * `cache()` de React deduplica la consulta dentro de una misma petición sin
 * guardar datos entre peticiones: las páginas siguen siendo ISR de 1 h.
 */
export const getProvinceDirectory = cache(async (): Promise<ProvinceDirectory> => {
  let all: { province: string | null; _count: number }[] = [];
  let upcoming: { province: string | null; _count: number }[] = [];

  try {
    [all, upcoming] = await Promise.all([
      prisma.race.groupBy({
        by: ["province"],
        where: { pendingReview: false },
        _count: true,
      }),
      prisma.race.groupBy({
        by: ["province"],
        where: upcomingWhere(),
        _count: true,
      }),
    ]);
  } catch {
    return emptyDirectory();
  }

  const upcomingByRaw = new Map(upcoming.map((row) => [row.province, row._count]));

  const rawNamesBySlug = new Map<string, string[]>();
  const upcomingBySlug = new Map<string, number>();
  let unassignedUpcoming = 0;
  let unassignedTotal = 0;
  const unassignedNames: string[] = [];

  for (const row of all) {
    const slug = provinceSlugOrNull(row.province);
    if (!slug) {
      unassignedTotal += row._count;
      unassignedUpcoming += upcomingByRaw.get(row.province) ?? 0;
      if (row.province) unassignedNames.push(row.province);
      continue;
    }

    const names = rawNamesBySlug.get(slug) ?? [];
    if (row.province && !names.includes(row.province)) names.push(row.province);
    rawNamesBySlug.set(slug, names);
    upcomingBySlug.set(slug, (upcomingBySlug.get(slug) ?? 0) + (upcomingByRaw.get(row.province) ?? 0));
  }

  const allProvinces: ProvinceEntry[] = canonicalProvinceSlugs().map((slug) => {
    const label = PROVINCE_SLUGS[slug] ?? slug;
    const rawNames = rawNamesBySlug.get(slug) ?? getProvinceDbNames(slug);
    const community = getAutonomousCommunity(rawNames[0] ?? label);
    return {
      slug,
      label,
      count: upcomingBySlug.get(slug) ?? 0,
      rawNames,
      community,
      communityLabel: getAutonomousCommunityLabel(community),
    };
  });

  const bySlug = new Map(allProvinces.map((p) => [p.slug, p]));
  const provinces = allProvinces
    .filter((p) => p.count > 0)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "es"));

  return {
    provinces,
    allProvinces,
    bySlug,
    upcomingTotal: upcoming.reduce((sum, row) => sum + row._count, 0),
    totalRaces: all.reduce((sum, row) => sum + row._count, 0),
    unassignedUpcoming,
    unassignedTotal,
    provinceCount: provinces.length,
    unassignedNames: unassignedNames.sort(),
  };
});

/**
 * Nombres reales de `Race.province` de una provincia canónica.
 * Es lo que hay que pasar a `province: { in: ... }` para que la ficha y el
 * contador del hub no discrepen.
 */
export async function raceProvinceNames(slug: string): Promise<string[]> {
  const directory = await getProvinceDirectory();
  const entry = directory.bySlug.get(canonicalProvinceSlug(slug));
  return entry?.rawNames ?? getProvinceDbNames(canonicalProvinceSlug(slug));
}
