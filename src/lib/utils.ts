export function cn(...inputs: (string | boolean | undefined | null)[]) {
  return inputs.filter(Boolean).join(" ");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateShort(date: Date | string): string {
  return new Date(date).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function daysUntil(date: Date | string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}

export function daysUntilLabel(date: Date | string): string {
  const days = daysUntil(date);
  if (days < 0) return "Celebrada";
  if (days === 0) return "Hoy";
  if (days === 1) return "Mañana";
  return `En ${days} días`;
}

const autonomousCommunities = [
  { value: "andalucia", label: "Andalucía" },
  { value: "aragon", label: "Aragón" },
  { value: "asturias", label: "Asturias" },
  { value: "baleares", label: "Baleares" },
  { value: "canarias", label: "Canarias" },
  { value: "cantabria", label: "Cantabria" },
  { value: "castilla-la-mancha", label: "Castilla-La Mancha" },
  { value: "castilla-y-leon", label: "Castilla y León" },
  { value: "cataluna", label: "Cataluña" },
  { value: "comunidad-valenciana", label: "Comunidad Valenciana" },
  { value: "extremadura", label: "Extremadura" },
  { value: "galicia", label: "Galicia" },
  { value: "la-rioja", label: "La Rioja" },
  { value: "madrid", label: "Madrid" },
  { value: "murcia", label: "Murcia" },
  { value: "navarra", label: "Navarra" },
  { value: "pais-vasco", label: "País Vasco" },
  { value: "otra", label: "Otra" },
] as const;

const provinceToCommunity: Record<string, string> = {
  "Araba": "pais-vasco",
  "Álava": "pais-vasco",
  "Bizkaia": "pais-vasco",
  "Vizcaya": "pais-vasco",
  "Gipuzkoa": "pais-vasco",
  "Guipúzcoa": "pais-vasco",
  "Cantabria": "cantabria",
  "Burgos": "castilla-y-leon",
  "La Rioja": "la-rioja",
  "Navarra": "navarra",
  "Zamora": "castilla-y-leon",
  "Otra": "otra",
  "Albacete": "castilla-la-mancha",
  "Alicante": "comunidad-valenciana",
  "Almería": "andalucia",
  "Asturias": "asturias",
  "Ávila": "castilla-y-leon",
  "Badajoz": "extremadura",
  "Barcelona": "cataluna",
  "Cáceres": "extremadura",
  "Cádiz": "andalucia",
  "Castellón": "comunidad-valenciana",
  "Ciudad Real": "castilla-la-mancha",
  "Córdoba": "andalucia",
  "A Coruña": "galicia",
  "Cuenca": "castilla-la-mancha",
  "Girona": "cataluna",
  "Granada": "andalucia",
  "Guadalajara": "castilla-la-mancha",
  "Huelva": "andalucia",
  "Huesca": "aragon",
  "Jaén": "andalucia",
  "León": "castilla-y-leon",
  "Lleida": "cataluna",
  "Lugo": "galicia",
  "Madrid": "madrid",
  "Málaga": "andalucia",
  "Murcia": "murcia",
  "Ourense": "galicia",
  "Palencia": "castilla-y-leon",
  "Las Palmas": "canarias",
  "Pontevedra": "galicia",
  "Salamanca": "castilla-y-leon",
  "Santa Cruz de Tenerife": "canarias",
  "Segovia": "castilla-y-leon",
  "Sevilla": "andalucia",
  "Soria": "castilla-y-leon",
  "Tarragona": "cataluna",
  "Teruel": "aragon",
  "Toledo": "castilla-la-mancha",
  "Valencia": "comunidad-valenciana",
  "Valladolid": "castilla-y-leon",
  "Zaragoza": "aragon",
  "Baleares (Illes)": "baleares",
  "Illes Balears": "baleares",
};

export const PROVINCE_SLUGS: Record<string, string> = {
  "a-coruna": "A Coruña",
  alava: "Álava/Araba",
  arabako: "Álava/Araba",
  albacete: "Albacete",
  alicante: "Alicante",
  almeria: "Almería",
  asturias: "Asturias",
  avila: "Ávila",
  badajoz: "Badajoz",
  baleares: "Baleares",
  barcelona: "Barcelona",
  bizkaia: "Bizkaia",
  burgos: "Burgos",
  caceres: "Cáceres",
  cadiz: "Cádiz",
  cantabria: "Cantabria",
  castellon: "Castellón",
  "ciudad-real": "Ciudad Real",
  cordoba: "Córdoba",
  cuenca: "Cuenca",
  girona: "Girona",
  granada: "Granada",
  guadalajara: "Guadalajara",
  gipuzkoa: "Gipuzkoa",
  huelva: "Huelva",
  huesca: "Huesca",
  jaen: "Jaén",
  leon: "León",
  lleida: "Lleida",
  lugo: "Lugo",
  madrid: "Madrid",
  malaga: "Málaga",
  murcia: "Murcia",
  navarra: "Navarra",
  ourense: "Ourense",
  palencia: "Palencia",
  "las-palmas": "Las Palmas",
  pontevedra: "Pontevedra",
  "la-rioja": "La Rioja",
  salamanca: "Salamanca",
  "santa-cruz-de-tenerife": "Santa Cruz de Tenerife",
  segovia: "Segovia",
  sevilla: "Sevilla",
  soria: "Soria",
  tarragona: "Tarragona",
  teruel: "Teruel",
  toledo: "Toledo",
  valencia: "Valencia",
  valladolid: "Valladolid",
  zamora: "Zamora",
  zaragoza: "Zaragoza",
  ceuta: "Ceuta",
  melilla: "Melilla",
};

/**
 * Alias de cada provincia hacia el nombre canónico que se guarda en la BD.
 * Sin esto "Álava" y "Araba" aparecen como dos provincias distintas.
 */
const PROVINCE_CANONICAL: Record<string, string> = {
  "Álava": "Araba",
  "Guipúzcoa": "Gipuzkoa",
  "Illes Balears": "Baleares (Illes)",
  Vizcaya: "Bizkaia",
};

/** Provincias únicas y canónicas (las que existen en `Race.province`). */
const provinces = Array.from(
  new Set(Object.keys(provinceToCommunity).map((p) => PROVINCE_CANONICAL[p] ?? p))
).sort();

const raceTypes = [
  { value: "ASFALTO", label: "Asfalto" },
  { value: "MEDIA_MARATON", label: "Media Maratón" },
  { value: "MARATON", label: "Maratón" },
  { value: "TRAIL", label: "Trail" },
  { value: "MARCHA", label: "Marcha" },
  { value: "ORIENTACION", label: "Orientación" },
] as const;

const distanceRanges = [
  { value: "corto", label: "Corta (\u2264 5 km)", min: 0, max: 5 },
  { value: "medio", label: "Media (5-15 km)", min: 5, max: 15 },
  { value: "largo", label: "Larga (15-42 km)", min: 15, max: 42 },
  { value: "ultra", label: "Ultra (> 42 km)", min: 42, max: Infinity },
] as const;

export function parseKmFromDistance(distance?: string | null): number | null {
  if (!distance) return null;
  const match = distance.match(/(\d+[.,]?\d*)\s*km/i);
  if (!match) return null;
  return parseFloat(match[1].replace(",", "."));
}

export { autonomousCommunities, provinceToCommunity, provinces, raceTypes, distanceRanges };

export function getProvinceLabel(value: string): string {
  return provinces.find((p) => p === value) || value;
}

export function getRaceTypeLabel(value: string): string {
  return raceTypes.find((t) => t.value === value)?.label || value;
}

export function getProvincesByCommunity(community: string): string[] {
  if (!community) return [];
  return Object.keys(provinceToCommunity).filter((province) => provinceToCommunity[province] === community);
}

export function getAutonomousCommunity(province: string): string {
  for (const [key, value] of Object.entries(provinceToCommunity)) {
    if (province.toLowerCase().includes(key.toLowerCase())) return value;
  }
  return "otra";
}

export function getAutonomousCommunityLabel(value: string): string {
  return autonomousCommunities.find((c) => c.value === value)?.label || value;
}

const RACE_TYPE_KEYS = ["ASFALTO", "MEDIA_MARATON", "MARATON", "TRAIL", "MARCHA", "ORIENTACION"] as const;

const RACE_TYPE_GRADIENTS: Record<string, string> = {
  TRAIL: "from-emerald-600 via-emerald-500/50 to-teal-600",
  MARATON: "from-violet-600 via-violet-500/50 to-indigo-600",
  MEDIA_MARATON: "from-blue-600 via-blue-500/50 to-cyan-600",
  ASFALTO: "from-slate-600 via-slate-500/50 to-zinc-600",
  MARCHA: "from-amber-600 via-amber-500/50 to-orange-600",
  ORIENTACION: "from-pink-600 via-pink-500/50 to-rose-600",
};

const RACE_TYPE_DETAIL_COLORS: Record<string, string> = {
  ASFALTO: "bg-orange-50 text-orange-700",
  MEDIA_MARATON: "bg-purple-50 text-purple-700",
  MARATON: "bg-red-50 text-red-700",
  TRAIL: "bg-emerald-50 text-emerald-700",
  MARCHA: "bg-amber-50 text-amber-700",
  ORIENTACION: "bg-blue-50 text-blue-700",
};

const RACE_TYPE_HEX_COLORS: Record<string, string> = {
  ASFALTO: "#3b82f6",
  MEDIA_MARATON: "#8b5cf6",
  MARATON: "#ef4444",
  TRAIL: "#22c55e",
  MARCHA: "#f59e0b",
  ORIENTACION: "#06b6d4",
};

export function isKnownRaceType(type: string): boolean {
  return (RACE_TYPE_KEYS as readonly string[]).includes(type);
}

export function getRaceBadgeClass(type: string): string {
  return isKnownRaceType(type) ? `type-badge type-${type}` : "type-badge type-ASFALTO";
}

export function getRaceDotClass(type: string): string {
  return isKnownRaceType(type) ? `type-dot dot-${type}` : "type-dot dot-ASFALTO";
}

export function getRaceGradient(type: string): string {
  return RACE_TYPE_GRADIENTS[type] || "from-gray-600 via-gray-500/50 to-gray-700";
}

export function getRaceDetailColor(type: string): string {
  return RACE_TYPE_DETAIL_COLORS[type] || RACE_TYPE_DETAIL_COLORS.ASFALTO;
}

export function getRaceHexColor(type: string): string {
  return RACE_TYPE_HEX_COLORS[type] || "#6b7280";
}

/**
 * Nombres alternativos que acabamos usando en distintas fuentes para la misma
 * provincia. La clave canónica es la que realmente se guarda en `Race.province`.
 */
const PROVINCE_ALIASES: Record<string, string> = {
  alava: "Araba",
  "alava/araba": "Araba",
  araba: "Araba",
  vizcaya: "Bizkaia",
  bizkaia: "Bizkaia",
  guipuzcoa: "Gipuzkoa",
  gipuzkoa: "Gipuzkoa",
  "illes balears": "Baleares (Illes)",
  baleares: "Baleares (Illes)",
  "baleares (illes)": "Baleares (Illes)",
  "la rioja": "La Rioja",
  "rioja": "La Rioja",
  "las palmas": "Las Palmas",
  "santa cruz de tenerife": "Santa Cruz de Tenerife",
  "a coruna": "A Coruña",
  coruna: "A Coruña",
  "san sebastian": "Gipuzkoa",
};

function stripAccentsLoose(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Convierte cualquier variante de nombre de provincia (acentos, mayúsculas,
 * nombres alternativos) a la forma canónica usada en la base de datos.
 */
export function normalizeProvinceName(value?: string | null): string | null {
  if (!value) return null;
  const flat = stripAccentsLoose(value);
  if (!flat) return null;

  if (PROVINCE_ALIASES[flat]) return PROVINCE_ALIASES[flat];

  const exact = provinces.find((p) => stripAccentsLoose(p) === flat);
  if (exact) return exact;

  const canonicalOnly = PROVINCE_ALIASES[flat];
  if (canonicalOnly) return canonicalOnly;

  // Última resort: la provincia canónica aparece dentro del texto.
  const contained = provinces.find(
    (p) => stripAccentsLoose(p).length >= 5 && flat.includes(stripAccentsLoose(p))
  );
  if (contained) return contained;

  return null;
}

/**
 * Slug de URL para un nombre de provincia tal y como vive en `Race.province`.
 *
 * Inverso de getProvinceDbNames. Necesario porque los tres sitios donde se
 * guarda el nombre no hablan el mismo idioma:
 *   - `PROVINCE_SLUGS` usa el nombre visible: "Álava/Araba", "Baleares"
 *   - el scraper escribe:                     "Araba", "Baleares (Illes)"
 * Con igualdad estricta, esas provincias no enlazan a su pagina y quedan
 * fuera del sitemap.
 */
export function slugForProvinceName(province: string): string | null {
  if (!province) return null;
  const flat = stripAccentsLoose(province.trim());
  if (!flat) return null;

  // 1. Coincidencia directa (la mayoria de los casos).
  for (const [slug, display] of Object.entries(PROVINCE_SLUGS)) {
    if (stripAccentsLoose(display) === flat) return slug;
  }

  // 2. Alguna de las partes del nombre visible ("Álava/Araba" -> "araba").
  for (const [slug, display] of Object.entries(PROVINCE_SLUGS)) {
    const parts = display.split(/[\/·]/).map((p) => stripAccentsLoose(p)).filter(Boolean);
    if (parts.includes(flat)) return slug;
  }

  // 3. El nombre de la BD contiene el visible o al reves ("Baleares (Illes)").
  for (const [slug, display] of Object.entries(PROVINCE_SLUGS)) {
    const d = stripAccentsLoose(display);
    if (flat.includes(d) || d.includes(flat)) return slug;
  }

  // 4. Coincidencia contra los nombres reales de provincia.
  const inList = provinces.find((p) => stripAccentsLoose(p) === flat);
  if (inList) {
    for (const [slug, display] of Object.entries(PROVINCE_SLUGS)) {
      if (getProvinceDbNames(slug).some((n) => stripAccentsLoose(n) === flat)) return slug;
    }
  }

  return null;
}

/**
 * Nombres de provincia tal y como están en `Race.province` para un slug de URL.
 *
 * Hace falta porque el nombre visible y el de la BD no siempre coinciden:
 * el slug "alava" se muestra como "Álava/Araba" pero en la BD solo existe "Araba".
 * Filtrar por el nombre visible devolvía 0 resultados.
 */
export function getProvinceDbNames(slug: string): string[] {
  const display = PROVINCE_SLUGS[slug];
  if (!display) return [];

  const parts = display.split("/").map((p) => stripAccentsLoose(p)).filter(Boolean);

  const matches = provinces.filter((p) => {
    const flat = stripAccentsLoose(p);
    return parts.some((part) => flat === part || (part.length >= 4 && flat.includes(part)));
  });

  return matches.length > 0 ? matches : [display];
}

/** Provincia canónica (la que existe en la BD) a partir de un slug de URL. */
export function getProvinceFromSlug(slug: string): string | null {
  return getProvinceDbNames(slug)[0] ?? null;
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
