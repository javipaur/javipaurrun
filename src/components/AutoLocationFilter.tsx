"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MapPin, X, LocateFixed } from "lucide-react";
import {
  VISITOR_DISMISSED_KEY,
  VISITOR_LOCATION_KEY,
  communityLabel,
  type VisitorLocation,
} from "@/lib/visitor-location";
import { getProvincesByCommunity } from "@/lib/utils";

/** Rutas donde NO tiene sentido forzar el filtro de ubicación. */
const SKIP_PATHS = ["/admin", "/auth", "/enviar-carrera", "/offline", "/live"];

type Phase = "hidden" | "asking" | "detecting" | "ready" | "declined";

export default function AutoLocationFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [phase, setPhase] = useState<Phase>("hidden");
  const [location, setLocation] = useState<VisitorLocation | null>(null);

  // ¿El usuario ya filtró a mano? Si sí, no 自动 nunca le imponemos nada.
  const hasManualFilter =
    searchParams.has("provincia") ||
    searchParams.has("comunidad") ||
    searchParams.has("lat");

  useEffect(() => {
    queueMicrotask(() => {
      if (SKIP_PATHS.some((p) => pathname.startsWith(p))) {
        setPhase("hidden");
        return;
      }

      if (localStorage.getItem(VISITOR_DISMISSED_KEY) === "1") {
        setPhase("hidden");
        return;
      }

      const raw = localStorage.getItem(VISITOR_LOCATION_KEY);
      if (raw) {
        try {
          setLocation(JSON.parse(raw) as VisitorLocation);
          setPhase("ready");
        } catch {
          localStorage.removeItem(VISITOR_LOCATION_KEY);
          setPhase("asking");
        }
        return;
      }

      setPhase("asking");
    });
  }, [pathname]);

  // Aplica el filtro automáticamente una vez, solo si el usuario no eligió otro.
  useEffect(() => {
    if (phase !== "ready" || !location?.province || hasManualFilter) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("provincia", location.province);
    params.delete("page");
    localStorage.setItem("jp-location-applied", "1");

    const next = `${pathname}?${params.toString()}`;
    if (next !== `${pathname}${searchParams.size ? `?${searchParams.toString()}` : ""}`) {
      router.replace(next);
    }
  }, [phase, location, hasManualFilter, pathname, router, searchParams]);

  async function detect() {
    if (!navigator.geolocation) {
      setPhase("declined");
      return;
    }
    setPhase("detecting");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let next: VisitorLocation = { province: null, community: null, lat: latitude, lng: longitude };

        try {
          // El reverse geocode se hace en el servidor (/api/geo/reverse):
          // Nominatim exige un User-Agent válido que el navegador no puede enviar.
          const res = await fetch(`/api/geo/reverse?lat=${latitude}&lng=${longitude}`);
          if (res.ok) next = (await res.json()) as VisitorLocation;
        } catch {
          // Si falla el reverse geocode, mantenemos solo las coordenadas.
        }

        localStorage.setItem(VISITOR_LOCATION_KEY, JSON.stringify(next));
        setLocation(next);

        if (next.province) {
          setPhase("ready");
        } else {
          setPhase("declined");
        }
      },
      () => setPhase("declined"),
      { timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
  }

  function dismiss() {
    localStorage.setItem(VISITOR_DISMISSED_KEY, "1");
    setPhase("hidden");
  }

  function showAll() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("provincia");
    params.delete("comunidad");
    params.delete("lat");
    params.delete("lng");
    router.replace(`${pathname}?${params.toString()}`);
    setPhase("hidden");
  }

  if (phase === "hidden") return null;

  if (phase === "declined") return null;

  if (phase === "asking" || phase === "detecting") {
    return (
      <div className="w-full mb-4 rounded-xl border border-gray-200 bg-white/70 dark:bg-white/5 backdrop-blur px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 animate-fade-in">
        <LocateFixed size={18} className="text-primary shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-text-primary">
            ¿Quieres ver solo las carreras de tu zona?
          </p>
          <p className="text-xs text-text-secondary">
            Usamos tu ubicación únicamente en el navegador para filtrar. No la guardamos en el servidor.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={detect} disabled={phase === "detecting"} className="btn-primary text-xs py-2 disabled:opacity-60">
            {phase === "detecting" ? "Buscando..." : "Sí, usar mi ubicación"}
          </button>
          <button onClick={dismiss} className="btn-secondary text-xs py-2">
            Ahora no
          </button>
        </div>
      </div>
    );
  }

  if (phase === "ready" && location?.province) {
    const communityProvinces =
      location.community && location.community !== location.province
        ? getProvincesByCommunity(location.community).slice(0, 4)
        : [];

    return (
      <div className="w-full mb-4 rounded-xl border border-orange-200 bg-orange-50/80 dark:bg-orange-500/10 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 animate-fade-in">
        <MapPin size={18} className="text-primary shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-text-primary">
            Mostrando carreras de {location.province}
            {location.community ? ` (${communityLabel(location.community)})` : ""}
          </p>
          <p className="text-xs text-text-secondary">
            Detectado desde tu ubicación
            {communityProvinces.length > 0 && ` · También incluye: ${communityProvinces.join(", ")}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={showAll} className="btn-secondary text-xs py-2">
            Ver todas
          </button>
          <button onClick={dismiss} aria-label="Cerrar aviso" className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return null;
}