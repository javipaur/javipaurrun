export interface CityInfo {
  name: string;
  province: string;
  description: string;
  /** Nombres con los que la ciudad aparece realmente en `Race.location` / `Race.city`. */
  aliases: string[];
}

const raw: Record<string, Omit<CityInfo, "aliases"> & { aliases?: string[] }> = {
  bilbao: {
    name: "Bilbao",
    province: "Bizkaia",
    description: "Carreras populares en Bilbao y alrededores. Running, trail y marchas en la capital de Bizkaia.",
    aliases: ["Bilbao", "Bilbo"],
  },
  "vitoria-gasteiz": {
    name: "Vitoria-Gasteiz",
    province: "Araba",
    description: "Carreras populares en Vitoria-Gasteiz. Running, trail y marchas en la capital de Araba.",
    aliases: ["Vitoria", "Vitoria-Gasteiz", "Gasteiz", "Vitoria/Gasteiz"],
  },
  gasteiz: {
    name: "Vitoria-Gasteiz",
    province: "Araba",
    description: "Carreras populares en Vitoria-Gasteiz. Running, trail y marchas en la capital de Araba.",
    aliases: ["Vitoria", "Vitoria-Gasteiz", "Gasteiz", "Vitoria/Gasteiz"],
  },
  donostia: {
    name: "Donostia-San Sebastian",
    province: "Gipuzkoa",
    description: "Carreras populares en Donostia-San Sebastian. Running, trail y marchas en la capital de Gipuzkoa.",
    aliases: ["Donostia", "Donostia-San Sebastian", "San Sebastian", "Donostia-San Sebastián"],
  },
  "san-sebastian": {
    name: "Donostia-San Sebastian",
    province: "Gipuzkoa",
    description: "Carreras populares en Donostia-San Sebastian. Running, trail y marchas en la capital de Gipuzkoa.",
    aliases: ["Donostia", "Donostia-San Sebastian", "San Sebastian", "Donostia-San Sebastián"],
  },
  santander: {
    name: "Santander",
    province: "Cantabria",
    description: "Carreras populares en Santander. Running, trail y marchas en la capital de Cantabria.",
    aliases: ["Santander"],
  },
  logrono: {
    name: "Logroño",
    province: "La Rioja",
    description: "Carreras populares en Logroño. Running, trail y marchas en la capital de La Rioja.",
    aliases: ["Logroño", "Logrono"],
  },
  pamplona: {
    name: "Pamplona-Iruña",
    province: "Navarra",
    description: "Carreras populares en Pamplona-Iruña. Running, trail y marchas en la capital de Navarra.",
    aliases: ["Pamplona", "Pamplona-Iruña", "Iruña", "Iruna", "Pamplona/Iruna"],
  },
  "pamplona-iruna": {
    name: "Pamplona-Iruña",
    province: "Navarra",
    description: "Carreras populares en Pamplona-Iruña. Running, trail y maja en la capital de Navarra.",
    aliases: ["Pamplona", "Pamplona-Iruña", "Iruña", "Iruna", "Pamplona/Iruna"],
  },
  burgos: {
    name: "Burgos",
    province: "Burgos",
    description: "Carreras populares en Burgos. Running, trail y marchas en la capital burgalesa.",
    aliases: ["Burgos"],
  },
  zamora: {
    name: "Zamora",
    province: "Zamora",
    description: "Carreras populares en Zamora. Running, trail y marchas en la ciudad de Zamora.",
    aliases: ["Zamora"],
  },
};

/** Todas las claves apuntan a la misma ficha con `aliases` ya rellenos. */
export const cities: Record<string, CityInfo> = Object.fromEntries(
  Object.entries(raw).map(([slug, value]) => [
    slug,
    { ...value, aliases: value.aliases ?? [value.name] },
  ])
);

/**
 * Filtro de Prisma que cubre las variantes con las que aparece una ciudad.
 * Usa `city` exacto cuando existe y `location` como plan B, siempre
 * case-insensitive: en PostgreSQL `contains` es sensible a mayúsculas.
 */
export function cityWhere(city: CityInfo) {
  return {
    OR: city.aliases.flatMap((alias) => [
      { city: { equals: alias, mode: "insensitive" as const } },
      { location: { contains: alias, mode: "insensitive" as const } },
    ]),
    pendingReview: false,
    date: { gte: new Date() },
  };
}