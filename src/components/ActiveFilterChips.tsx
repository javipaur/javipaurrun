"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X, ListFilter, MapPin } from "lucide-react";
import { getRaceTypeLabel, distanceRanges, getAutonomousCommunityLabel } from "@/lib/utils";

interface ActiveFilterChipsProps {
  total: number;
}

/** Filtros constan→valor y como se muestran. `key` = parametro de la URL. */
const LABELS: Record<string, (v: string) => string> = {
  tipo: (v) => getRaceTypeLabel(v),
  provincia: (v) => v,
  comunidad: (v) => getAutonomousCommunityLabel(v),
  distancia: (v) => distanceRanges.find((d) => d.value === v)?.label ?? v,
  mes: (v) => {
    const [y, m] = v.split("-").map(Number);
    if (!y || !m) return v;
    return new Date(y, m - 1, 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" });
  },
  orden: (v) =>
    v === "distancia-asc" ? "distancia ↑" : v === "distancia-desc" ? "distancia ↓" : v,
  buscar: (v) => `"${v}"`,
};

const HIDDEN = new Set(["page", "lat", "lng", "radio", "ids"]);

export default function ActiveFilterChips({ total }: ActiveFilterChipsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const chips = [...searchParams.entries()]
    .filter(([key, value]) => value && !HIDDEN.has(key))
    .map(([key, value]) => ({ key, value, label: LABELS[key]?.(value) ?? value }));

  const hasNearby = searchParams.has("lat") && searchParams.has("lng");

  function remove(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    router.push(`/calendario?${params.toString()}`);
  }

  function clearAll() {
    router.push("/calendario");
  }

  if (chips.length === 0 && !hasNearby) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-5">
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary mr-1">
        <ListFilter size={13} />
        {total} resultado{total !== 1 ? "s" : ""}
      </span>

      {hasNearby && (
        <button
          onClick={clearAll}
          className="group inline-flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-semibold hover:bg-orange-200 transition-colors"
        >
          <MapPin size={12} />
          Cerca de mí
          <X size={12} className="opacity-60 group-hover:opacity-100" />
        </button>
      )}

      {chips.map(({ key, value, label }) => (
        <button
          key={`${key}-${value}`}
          onClick={() => remove(key)}
          title={`Quitar filtro: ${label}`}
          className="group inline-flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
        >
          <span className="text-text-tertiary font-normal">{key}:</span>
          <span className="capitalize">{label}</span>
          <X size={12} className="opacity-50 group-hover:opacity-100" />
        </button>
      ))}

      {chips.length + (hasNearby ? 1 : 0) > 1 && (
        <button
          onClick={clearAll}
          className="text-xs font-semibold text-primary hover:underline underline-offset-2 px-1"
        >
          Limpiar todo
        </button>
      )}
    </div>
  );
}