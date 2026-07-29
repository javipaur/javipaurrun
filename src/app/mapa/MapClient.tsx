"use client";

import { useState } from "react";
import RaceMap from "@/components/RaceMap";

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

const types = [
  { value: "", label: "Todas" },
  { value: "ASFALTO", label: "Asfalto" },
  { value: "TRAIL", label: "Trail" },
  { value: "MEDIA_MARATON", label: "Media Maratón" },
  { value: "MARATON", label: "Maratón" },
  { value: "MARCHA", label: "Marcha" },
  { value: "ORIENTACION", label: "Orientación" },
];

export default function MapClient({ markers }: { markers: Marker[] }) {
  const [typeFilter, setTypeFilter] = useState("");

  const filtered = typeFilter
    ? markers.filter((m) => m.type === typeFilter)
    : markers;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {types.map((t) => (
          <button
            key={t.value}
            onClick={() => setTypeFilter(t.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              typeFilter === t.value
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
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

      <p className="text-xs text-gray-400 mt-2 text-center">
        Haz clic en un marcador para ver los detalles de la carrera
      </p>
    </div>
  );
}
