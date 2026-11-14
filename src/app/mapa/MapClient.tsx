"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { getRaceTypeLabel, raceTypes } from "@/lib/utils";

const RaceMap = dynamic(
  () => import("@/components/RaceMap"),
  { ssr: false, loading: () => null }
);

interface Marker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  date: string;
  type: string;
  location: string;
  province: string;
  url?: string | null;
  distance?: string | null;
}

export default function MapClient({ markers }: { markers: Marker[] }) {
  const [typeFilter, setTypeFilter] = useState("");

  const typeOptions = useMemo(() => {
    const present = new Set(markers.map((m) => m.type));
    const ordered: { value: string; label: string }[] = raceTypes
      .filter((t) => present.has(t.value))
      .map((t) => ({ value: t.value, label: t.label }));
    // include any unexpected types present in data
    for (const t of present) {
      if (!ordered.some((o) => o.value === t)) {
        ordered.push({ value: t, label: getRaceTypeLabel(t) });
      }
    }
    return [{ value: "", label: "Todas" }, ...ordered];
  }, [markers]);

  const filtered = typeFilter
    ? markers.filter((m) => m.type === typeFilter)
    : markers;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {typeOptions.map((t) => (
          <button
            key={t.value || "all"}
            onClick={() => setTypeFilter(t.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              typeFilter === t.value
                ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 dark:bg-white/5 dark:text-gray-300 dark:border-white/10 dark:hover:border-white/20"
            }`}
          >
            {t.label}
            {t.value && (
              <span className="ml-1 text-xs opacity-60">
                ({markers.filter((m) => m.type === t.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <RaceMap races={filtered} />

      <div className="mt-3 flex flex-col items-center gap-2 text-center sm:flex-row sm:justify-between">
        <p className="text-xs text-gray-400">
          Haz clic en un marcador para ver los detalles del evento
        </p>
        {typeFilter && (
          <Link
            href={`/calendario?tipo=${encodeURIComponent(typeFilter)}`}
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400"
          >
            Ver {getRaceTypeLabel(typeFilter).toLowerCase()} en el calendario →
          </Link>
        )}
      </div>
    </div>
  );
}
