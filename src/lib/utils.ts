export function cn(...inputs: (string | boolean | undefined | null)[]) {
  return inputs.filter(Boolean).join(" ");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúñü]+/g, "-")
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

const provinces = Object.keys(provinceToCommunity).sort();

const raceTypes = [
  { value: "ASFALTO", label: "Asfalto" },
  { value: "MEDIA_MARATON", label: "Media Maratón" },
  { value: "MARATON", label: "Maratón" },
  { value: "TRAIL", label: "Trail" },
  { value: "MARCHA", label: "Marcha" },
  { value: "ORIENTACION", label: "Orientación" },
] as const;

const distanceRanges = [
  { value: "corto", label: "Corta (≤ 5 km)", min: 0, max: 5 },
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
