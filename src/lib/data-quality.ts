import { prisma } from "@/lib/prisma";
import {
  getAutonomousCommunity,
  getAutonomousCommunityLabel,
  getRaceTypeLabel,
} from "@/lib/utils";

export interface DataQualityUnavailable {
  ok: false;
}

export interface DataQuality {
  ok: true;
  total: number;
  upcoming: number;
  provinces: {
    province: string;
    count: number;
    community: string;
    communityLabel: string;
  }[];
  types: { type: string; count: number; label: string }[];
  sources: SourceStat[];
  fields: FieldCompleteness[];
  provinceCount: number;
  lastSync: Date | null;
  medianDistanceKm: number | null;
}

/**
 * Ultima sincronizacion registrada, sin agregar datos.
 *
 * Pensado para el footer: una sola consulta, a diferencia de getDataQuality()
 * que arrastra el conjunto de muestras para calcular porcentajes.
 * Nunca lanza: si la BD no esta disponible devuelve null.
 */
export async function getLastSync(): Promise<Date | null> {
  try {
    const latest = await prisma.scrapeLog.findFirst({
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    return latest?.createdAt ?? null;
  } catch {
    return null;
  }
}

export interface FieldCompleteness {
  key: string;
  label: string;
  filled: number;
  total: number;
  percent: number;
}

/** Campos que medimos como "completos". Cada uno aporta valor real al usuario. */
const TRACKED_FIELDS: { key: string; label: string }[] = [
  { key: "location", label: "Ciudad" },
  { key: "time", label: "Hora de salida" },
  { key: "distanceKm", label: "Distancia" },
  { key: "latitude", label: "Coordenadas" },
  { key: "url", label: "Enlace de inscripción" },
  { key: "price", label: "Precio" },
  { key: "image", label: "Cartel" },
  { key: "registrationUrl", label: "Web de inscripciones" },
];

export interface SourceStat {
  source: string;
  label: string;
  count: number;
  lastSync: Date | null;
  lastStatus: string | null;
}

const SOURCE_LABELS: Record<string, string> = {
  lasterketak: "Lasterketak.eus",
  rockthesport: "RockTheSport",
  sportmaniacs: "Sportmaniacs",
  buscametas: "Buscametas",
  carreraspopulares: "CarrerasPopulares",
  manual: "Alta manual",
};

const UNKNOWN_LOCATIONS = ["Por determinar", "", "-"];

/**
 * Métricas de completitud del directorio.
 *
 * Se muestran públicamente: es la ventaja diferencial de JavipaurRun frente a
 * directorios que no dicen de dónde sacan los datos ni cuánto falta por rellenar.
 *
 * NUNCA lanza. Si la base de datos no está disponible devuelve `ok: false` y
 * la página muestra un estado degradado en lugar de romperse en blanco: esta
 * página trata sobre confianza en los datos, no puede caer cuando no hay datos.
 */
export async function getDataQuality(): Promise<DataQuality | DataQualityUnavailable> {
  try {
    const [total, upcoming, byProvince, byType, bySource, recentLogs, samples] =
      await Promise.all([
        prisma.race.count({ where: { pendingReview: false } }),
        prisma.race.count({ where: { pendingReview: false, date: { gte: new Date() } } }),
        prisma.race.groupBy({
          by: ["province"],
          where: { pendingReview: false, date: { gte: new Date() } },
          _count: true,
        }),
        prisma.race.groupBy({
          by: ["type"],
          where: { pendingReview: false, date: { gte: new Date() } },
          _count: true,
        }),
        prisma.race.groupBy({
          by: ["source"],
          where: { pendingReview: false },
          _count: true,
        }),
        prisma.scrapeLog.findMany({
          orderBy: { createdAt: "desc" },
          take: 60,
          select: { source: true, createdAt: true, status: true },
        }),
        // Muestra por provincia para el cálculo de completitud (barato y suficiente).
        prisma.race.findMany({
          where: { pendingReview: false, date: { gte: new Date() } },
          select: {
            location: true,
            time: true,
            distanceKm: true,
            latitude: true,
            url: true,
            price: true,
            image: true,
            registrationUrl: true,
          },
        }),
      ]);

    return buildStats({ total, upcoming, byProvince, byType, bySource, recentLogs, samples });
  } catch (error) {
    console.error("[data-quality] no se pudieron leer las métricas:", error);
    return { ok: false };
  }
}

/** Filas crudas que necesita buildStats para calcular los porcentajes. */
export interface StatsInput {
  total: number;
  upcoming: number;
  byProvince: { province: string; _count: number }[];
  byType: { type: string; _count: number }[];
  bySource: { source: string | null; _count: number }[];
  recentLogs: { source: string; createdAt: Date; status: string }[];
  samples: {
    location: string | null;
    time: string | null;
    distanceKm: number | null;
    latitude: number | null;
    url: string | null;
    price: string | null;
    image: string | null;
    registrationUrl: string | null;
  }[];
}

/**
 * Calcula los porcentajes y desgloses a partir de las filas ya leídas.
 *
 * Exportada para poder testearla sin base de datos (scripts/test-data-quality.mts).
 */
export function buildStats(input: StatsInput): DataQuality {
  const { total, upcoming, byProvince, byType, bySource, recentLogs, samples } = input;

  const n = samples.length;

  const fields: FieldCompleteness[] = TRACKED_FIELDS.map((f) => {
    let filled = 0;
    for (const row of samples) {
      const value = (row as unknown as Record<string, unknown>)[f.key];
      const isEmpty =
        value == null ||
        // 0 no es una distancia/coordenada válida: el scraper deja el valor nulo
        // o a cero cuando no la conoce, y 0 km (Kilómetro 0) no es una carrera.
        value === 0 ||
        (typeof value === "string" &&
          (value.trim() === "" || UNKNOWN_LOCATIONS.includes(value.trim())));
      if (!isEmpty) filled += 1;
    }
    return {
      ...f,
      filled,
      total: n,
      percent: n === 0 ? 0 : Math.round((filled / n) * 100),
    };
  });

  // Último estado por fuente.
  const lastBySource = new Map<string, { createdAt: Date; status: string }>();
  for (const log of recentLogs) {
    if (!lastBySource.has(log.source)) {
      lastBySource.set(log.source, { createdAt: log.createdAt, status: log.status });
    }
  }

  // Unión de fuentes con carreras y fuentes con registros de sync.
  // Una fuente que falló y aportó 0 carreras no aparece en `bySource`, pero es
  // justo lo que un usuario necesita ver: si una fuente está caída, se oculta.
  const countsBySource = new Map<string, number>();
  for (const s of bySource) {
    countsBySource.set(s.source ?? "desconocida", s._count);
  }
  for (const source of lastBySource.keys()) {
    if (!countsBySource.has(source)) countsBySource.set(source, 0);
  }

  const sources: SourceStat[] = [...countsBySource.entries()]
    .map(([source, count]) => ({
      source,
      label: SOURCE_LABELS[source] ?? source,
      count,
      lastSync: lastBySource.get(source)?.createdAt ?? null,
      lastStatus: lastBySource.get(source)?.status ?? null,
    }))
    .sort((a, b) => b.count - a.count || a.source.localeCompare(b.source));

  const provinces = byProvince
    .map((p) => ({
      province: p.province,
      count: p._count,
      community: getAutonomousCommunity(p.province),
      communityLabel: getAutonomousCommunityLabel(getAutonomousCommunity(p.province)),
    }))
    .sort((a, b) => b.count - a.count);

  const types = byType
    .map((t) => ({
      type: t.type,
      count: t._count,
      label: getRaceTypeLabel(t.type),
    }))
    .sort((a, b) => b.count - a.count);

  // Distancia mediana entre las que la tienen.
  const distances = samples
    .map((s) => s.distanceKm)
    .filter((d): d is number => typeof d === "number" && d > 0)
    .sort((a, b) => a - b);

  // Última sincronización = intento más reciente de cualquier fuente, tenga o no
  // carreras. Debe coincidir con getLastSync() para que footer y página no discrepen.
  const lastSync = recentLogs.reduce<Date | null>(
    (acc, log) => (!acc || log.createdAt > acc ? log.createdAt : acc),
    null
  );

  return {
    ok: true,
    total,
    upcoming,
    provinces,
    types,
    sources,
    fields,
    provinceCount: provinces.length,
    lastSync,
    medianDistanceKm:
      distances.length > 0
        ? Math.round(distances[Math.floor(distances.length / 2)] * 10) / 10
        : null,
  };
}

/** "hace 3 h" a partir de una fecha. */
export function timeAgo(date: Date | null): string {
  if (!date) return "sin datos";
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "hace instantes";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days} día${days !== 1 ? "s" : ""}`;
  const months = Math.floor(days / 30);
  return `hace ${months} mes${months !== 1 ? "es" : ""}`;
}