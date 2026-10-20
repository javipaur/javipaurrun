import { getAutonomousCommunity, normalizeProvinceName } from "@/lib/utils";

export interface VisitorLocation {
  province: string | null;
  community: string | null;
  lat: number | null;
  lng: number | null;
}

export const VISITOR_LOCATION_KEY = "jp-visitor-location";
export const VISITOR_DISMISSED_KEY = "jp-visitor-dismissed";

function flat(value?: string | null): string {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Convierte lo que devuelve Nominatim (que usa sus propios nombres) al nombre
 * canónico de provincia que realmente usa la base de datos.
 */
export function normalizeProvinceFromText(text?: string | null): string | null {
  return normalizeProvinceName(text);
}

/**
 * Orden de campos segun probabilidad de contener una provincia.
 * En España Nominatim devuelve la comunidad en `state` y la provincia en
 * `state_district`, asi que el orden NO es直觉 — hay que probar todos.
 */
const PROVINCE_FIELDS = ["province", "state_district", "region", "state", "county"] as const;

/** Alias de comunidad en ASCII: evitamos acentos para no depender de la codificacion. */
const COMMUNITY_ALIASES: Record<string, string> = {
  "pais vasco": "pais-vasco",
  "pais vasco (euskadi)": "pais-vasco",
  euskadi: "pais-vasco",
  cataluna: "cataluna",
  catalunya: "cataluna",
  andalucia: "andalucia",
  aragon: "aragon",
  "principado de asturias": "asturias",
  asturias: "asturias",
  "illes balears": "baleares",
  "islas baleares": "baleares",
  baleares: "baleares",
  canarias: "canarias",
  cantabria: "cantabria",
  "castilla-la mancha": "castilla-la-mancha",
  "castilla la mancha": "castilla-la-mancha",
  "castilla y leon": "castilla-y-leon",
  "comunidad valenciana": "comunidad-valenciana",
  "comunidad de madrid": "madrid",
  extremadura: "extremadura",
  galicia: "galicia",
  "la rioja": "la-rioja",
  madrid: "madrid",
  "region de murcia": "murcia",
  murcia: "murcia",
  "comunidad foral de navarra": "navarra",
  navarra: "navarra",
};

export function communityFromText(text?: string | null): string | null {
  const key = flat(text);
  if (!key) return null;
  return COMMUNITY_ALIASES[key] ?? null;
}

export function locationFromNominatim(data: unknown, lat: number, lng: number): VisitorLocation {
  const address = (data as { address?: Record<string, string> })?.address ?? {};

  // 1. Buscamos un campo que realmente sea una provincia.
  for (const field of PROVINCE_FIELDS) {
    const province = normalizeProvinceFromText(address[field]);
    if (province) {
      return { province, community: getAutonomousCommunity(province), lat, lng };
    }
  }

  // 2. Si no hay provincia, al menos aprovechamos la comunidad si aparece.
  for (const field of PROVINCE_FIELDS) {
    const community = communityFromText(address[field]);
    if (community) {
      return { province: null, community, lat, lng };
    }
  }

  return { province: null, community: null, lat, lng };
}

const COMMUNITY_LABELS: Record<string, string> = {
  andalucia: "Andaluc\u00eda",
  aragon: "Arag\u00f3n",
  asturias: "Asturias",
  baleares: "Baleares",
  canarias: "Canarias",
  cantabria: "Cantabria",
  "castilla-la-mancha": "Castilla-La Mancha",
  "castilla-y-leon": "Castilla y Le\u00f3n",
  cataluna: "Catalu\u00f1a",
  "comunidad-valenciana": "Comunidad Valenciana",
  extremadura: "Extremadura",
  galicia: "Galicia",
  "la-rioja": "La Rioja",
  madrid: "Madrid",
  murcia: "Murcia",
  navarra: "Navarra",
  "pais-vasco": "Pa\u00eds Vasco",
  otra: "otra zona",
};

export function communityLabel(community: string | null): string {
  if (!community) return "";
  return COMMUNITY_LABELS[community] ?? community;
}