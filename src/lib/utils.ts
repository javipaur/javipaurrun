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

const provinces = [
  "Araba", "Bizkaia", "Gipuzkoa", "Cantabria", "Burgos",
  "La Rioja", "Navarra", "Zamora", "Otra",
];

const raceTypes = [
  { value: "ASFALTO", label: "Asfalto" },
  { value: "MEDIA_MARATON", label: "Media Maratón" },
  { value: "MARATON", label: "Maratón" },
  { value: "TRAIL", label: "Trail" },
  { value: "MARCHA", label: "Marcha" },
  { value: "ORIENTACION", label: "Orientación" },
] as const;

export { provinces, raceTypes };

export function getProvinceLabel(value: string): string {
  return provinces.find((p) => p === value) || value;
}

export function getRaceTypeLabel(value: string): string {
  return raceTypes.find((t) => t.value === value)?.label || value;
}
