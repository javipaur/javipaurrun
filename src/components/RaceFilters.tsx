"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Search, SlidersHorizontal, X, MapPin, Download } from "lucide-react";
import { raceTypes, provinces, autonomousCommunities, distanceRanges } from "@/lib/utils";
import AlertSignup from "./AlertSignup";

const SAVED_TIPO = "jp-filtro-tipo";
const SAVED_PROVINCIA = "jp-filtro-provincia";
const SEARCH_DEBOUNCE_MS = 400;

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

  useEffect(() => {
    if (currentType) localStorage.setItem(SAVED_TIPO, currentType);
    if (currentProvince) localStorage.setItem(SAVED_PROVINCIA, currentProvince);
  }, [currentType, currentProvince]);

  const restoredRef = useRef(false);

  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    if (!currentType && !currentProvince && !currentComunidad && !currentDistancia && !currentSearch) {
      const tipo = localStorage.getItem(SAVED_TIPO) || "";
      const provincia = localStorage.getItem(SAVED_PROVINCIA) || "";
      if (tipo || provincia) {
        const params = new URLSearchParams();
        if (tipo) params.set("tipo", tipo);
        if (provincia) params.set("provincia", provincia);
        router.replace(`/calendario?${params.toString()}`);
      }
    }
  }, [currentType, currentProvince, currentComunidad, currentDistancia, currentSearch, router]);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/calendario?${params.toString()}`);
  }

  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleSearchChange(value: string) {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => updateFilter("buscar", value), SEARCH_DEBOUNCE_MS);
  }

  useEffect(() => () => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
  }, []);

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

  function findNearby() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("page");
        params.set("lat", String(pos.coords.latitude));
        params.set("lng", String(pos.coords.longitude));
        params.set("radio", "25");
        params.delete("provincia");
        params.delete("comunidad");
        router.push(`/calendario?${params.toString()}`);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 10000 }
    );
  }

  function clearFilters() {
    localStorage.removeItem(SAVED_TIPO);
    localStorage.removeItem(SAVED_PROVINCIA);
    router.push("/calendario");
  }

  const filtersContent = (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Buscar</label>
        <div className="relative">
          <input
            type="text"
            defaultValue={currentSearch}
            placeholder="Nombre, lugar..."
            onChange={(e) => handleSearchChange(e.target.value)}
            className="field pl-10"
          />
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Tipo</label>
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
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Distancia</label>
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

      <div>
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Mes</label>
        <select
          value={searchParams.get("mes") || ""}
          onChange={(e) => updateFilter("mes", e.target.value)}
          className="field"
        >
          <option value="">Todos</option>
          {Array.from({ length: 12 }, (_, i) => {
            const d = new Date();
            d.setDate(1);
            d.setMonth(d.getMonth() + i);
            return (
              <option key={i} value={`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`}>
                {d.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
              </option>
            );
          })}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Ordenar por</label>
        <select
          value={searchParams.get("orden") || ""}
          onChange={(e) => updateFilter("orden", e.target.value)}
          className="field"
        >
          <option value="">Fecha (más próximas)</option>
          <option value="distancia-asc">Distancia (menor a mayor)</option>
          <option value="distancia-desc">Distancia (mayor a menor)</option>
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

      <button
        onClick={findNearby}
        disabled={locating}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full border border-orange-300 dark:border-orange-700 text-orange-600 dark:text-orange-300 text-sm font-semibold hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors disabled:opacity-60"
      >
        <MapPin size={14} />
        Carreras cerca de mi
      </button>

      <div>
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Comunidad Autónoma</label>
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
        <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">Provincia</label>
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

      <AlertSignup compact />

      <a
        href={`/api/calendario/export?${searchParams.toString()}`}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <Download size={14} />
        Exportar a calendario
      </a>
      <p className="text-[11px] text-text-secondary leading-snug -mt-3">
        Descarga un archivo .ics con las carreras que estás viendo (máx. 500).
      </p>
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
