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

export { autonomousCommunities, provinceToCommunity, provinces, raceTypes };

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
