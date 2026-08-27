"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, SlidersHorizontal, X, MapPin } from "lucide-react";
import { raceTypes, provinces, autonomousCommunities, distanceRanges } from "@/lib/utils";

export default function RaceFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showMobile, setShowMobile] = useState(false);

  const currentType = searchParams.get("tipo") || "";
  const currentProvince = searchParams.get("provincia") || "";
  const currentComunidad = searchParams.get("comunidad") || "";
  const currentDistancia = searchParams.get("distancia") || "";
  const currentSearch = searchParams.get("buscar") || "";
  const hasFilters = currentType || currentProvince || currentComunidad || currentDistancia || currentSearch;

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/calendario?${params.toString()}`);
  }

  const [locating, setLocating] = useState(false);

  function detectLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=es`,
            { headers: { "User-Agent": "JavipaurRun/1.0" } }
          );
          const data = await res.json();
          const addr = data.address || {};
          const province = addr.province || addr.state || addr.region || "";
          if (province) {
            updateFilter("provincia", province);
          }
        } catch {
          // ignore
        }
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 10000 }
    );
  }

  function clearFilters() {
    router.push("/calendario");
  }

  const filtersContent = (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Buscar</label>
        <div className="relative">
          <input
            type="text"
            defaultValue={currentSearch}
            placeholder="Nombre, lugar..."
            onChange={(e) => updateFilter("buscar", e.target.value)}
            className="field pl-10"
          />
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Tipo</label>
        <select
          value={currentType}
          onChange={(e) => updateFilter("tipo", e.target.value)}
          className="field"
        >
          <option value="">Todos</option>
          {raceTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Distancia</label>
        <select
          value={currentDistancia}
          onChange={(e) => updateFilter("distancia", e.target.value)}
          className="field"
        >
          <option value="">Todas</option>
          {distanceRanges.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      <button
        onClick={detectLocation}
        disabled={locating}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full btn-primary disabled:opacity-60"
      >
        <MapPin size={14} />
        {locating ? "Detectando ubicación..." : "Usar mi ubicación"}
      </button>

      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Comunidad Autónoma</label>
        <select
          value={currentComunidad}
          onChange={(e) => updateFilter("comunidad", e.target.value)}
          className="field"
        >
          <option value="">Todas</option>
          {autonomousCommunities.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Provincia</label>
        <select
          value={currentProvince}
          onChange={(e) => updateFilter("provincia", e.target.value)}
          className="field"
        >
          <option value="">Todas</option>
          {provinces.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {hasFilters && (
        <button
          onClick={clearFilters}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <X size={14} />
          Limpiar filtros
        </button>
      )}
    </div>
  );

  return (
    <>
      <button
        onClick={() => setShowMobile(true)}
        className="lg:hidden fixed bottom-20 right-4 z-40 w-12 h-12 rounded-xl bg-brand-gradient text-white shadow-lg flex items-center justify-center hover:brightness-105 transition-all"
      >
        <SlidersHorizontal size={20} />
      </button>

      <aside className="hidden lg:block">
        <div className="card-premium p-5 sticky top-24">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <SlidersHorizontal size={15} className="text-orange-500" />
            Filtros
          </h3>
          {filtersContent}
        </div>
      </aside>

      {showMobile && (
        <div className="fixed inset-0 z-50 lg:hidden animate-fade-in">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowMobile(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#131316] rounded-t-2xl p-5 pb-8 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-900 dark:text-white">Filtros</h3>
              <button onClick={() => setShowMobile(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X size={18} />
              </button>
            </div>
            {filtersContent}
          </div>
        </div>
      )}
    </>
  );
}
