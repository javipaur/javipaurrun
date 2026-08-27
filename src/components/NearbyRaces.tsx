"use client";

import { useState } from "react";
import Link from "next/link";
import { LocateFixed, MapPin, Navigation, ArrowRight } from "lucide-react";

interface NearbyRace {
  id: string;
  name: string;
  slug: string;
  type: string;
  distance?: string | null;
  location: string;
  province: string;
  date: string;
  latitude: number;
  longitude: number;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatKm(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 100) return `${km.toFixed(1)} km`;
  return `${Math.round(km)} km`;
}

export default function NearbyRaces({
  races,
  defaultLocation = "Madrid, 40.4168, -3.7038",
}: {
  races: NearbyRace[];
  defaultLocation?: string;
}) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "granted" | "denied" | "unsupported">("idle");
  const [error, setError] = useState("");

  function requestLocation() {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setStatus("unsupported");
      return;
    }
    setStatus("loading");
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("granted");
      },
      () => {
        setStatus("denied");
        setError("Activa la ubicación en tu navegador para ver carreras cerca de ti.");
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }

  let sorted: { race: NearbyRace; km: number }[] = [];
  if (coords) {
    sorted = races
      .map((race) => ({
        race,
        km: haversineKm(coords.lat, coords.lng, race.latitude, race.longitude),
      }))
      .sort((a, b) => a.km - b.km)
      .slice(0, 5);
  }

  const showList = status === "granted" && coords;
  const fallbackCity = defaultLocation.split(",")[0].trim();

  return (
    <div>
      {!showList && (
        <div className="card-premium p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-5 justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-gradient/10 border border-orange-200/60 dark:border-orange-500/20 flex items-center justify-center shrink-0">
              <Navigation size={22} className="text-orange-500" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Carreras cerca de ti</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {status === "denied"
                  ? error
                  : "Comparte tu ubicación para encontrar las carreras más cercanas."}
              </p>
            </div>
          </div>
          <button
            onClick={requestLocation}
            disabled={status === "loading"}
            className="btn-primary shrink-0 disabled:opacity-60"
          >
            <LocateFixed size={16} />
            {status === "loading" ? "Localizando..." : "Usar mi ubicación"}
          </button>
        </div>
      )}

      {showList && sorted.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Navigation size={16} className="text-orange-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              A {formatKm(sorted[0].km)} de ti
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sorted.map(({ race, km }) => (
              <Link
                key={race.id}
                href={`/carrera/${race.slug}`}
                className="card-premium group p-4 flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center shrink-0">
                  <MapPin size={18} className="text-orange-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                    {race.province}
                  </span>
                  <p className="font-semibold text-gray-900 dark:text-white text-[13px] leading-snug line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors mt-0.5">
                    {race.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 flex items-center gap-1">
                    <Navigation size={11} className="text-gray-400" />
                    <span className="font-semibold text-orange-500">{formatKm(km)}</span>
                    <span className="text-gray-300 dark:text-gray-600">·</span>
                    <span>{race.location}</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-4">
            <Link href="/mapa" className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors">
              Ver todas en el mapa <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

      {status === "unsupported" && (
        <p className="text-xs text-gray-400">Tu navegador no soporta geolocalización. Carreras cerca de <span className="font-semibold">{fallbackCity}</span> no disponibles.</p>
      )}
    </div>
  );
}
