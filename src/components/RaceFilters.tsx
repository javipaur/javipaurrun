"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { raceTypes, provinces, autonomousCommunities } from "@/lib/utils";

export default function RaceFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showMobile, setShowMobile] = useState(false);

  const currentType = searchParams.get("tipo") || "";
  const currentProvince = searchParams.get("provincia") || "";
  const currentComunidad = searchParams.get("comunidad") || "";
  const currentSearch = searchParams.get("buscar") || "";
  const hasFilters = currentType || currentProvince || currentComunidad || currentSearch;

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/calendario?${params.toString()}`);
  }

  function clearFilters() {
    router.push("/calendario");
  }

  const filtersContent = (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Buscar</label>
        <div className="relative">
          <input
            type="text"
            defaultValue={currentSearch}
            placeholder="Nombre, lugar..."
            onChange={(e) => updateFilter("buscar", e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
          />
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
        <select
          value={currentType}
          onChange={(e) => updateFilter("tipo", e.target.value)}
          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
        >
          <option value="">Todos</option>
          {raceTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Comunidad Autónoma</label>
        <select
          value={currentComunidad}
          onChange={(e) => updateFilter("comunidad", e.target.value)}
          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
        >
          <option value="">Todas</option>
          {autonomousCommunities.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Provincia</label>
        <select
          value={currentProvince}
          onChange={(e) => updateFilter("provincia", e.target.value)}
          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 transition-all"
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
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors"
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
        className="lg:hidden fixed bottom-20 right-4 z-40 w-12 h-12 rounded-xl bg-gray-900 text-white shadow-lg flex items-center justify-center hover:bg-gray-800 transition-all"
      >
        <SlidersHorizontal size={20} />
      </button>

      <aside className="hidden lg:block">
        <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-20">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Filtros</h3>
          {filtersContent}
        </div>
      </aside>

      {showMobile && (
        <div className="fixed inset-0 z-50 lg:hidden animate-fade-in">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowMobile(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-5 pb-8 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900">Filtros</h3>
              <button onClick={() => setShowMobile(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
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
