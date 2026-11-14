"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type MapPoint = { id: string; label: string; km: number; tip: string; lat?: number | null; lng?: number | null };

export default function SpectatorGuideMap({
  latitude,
  longitude,
  name,
  location,
  points,
}: {
  latitude: number;
  longitude: number;
  name: string;
  location: string;
  points?: MapPoint[];
}) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: [latitude, longitude],
      zoom: 14,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 19,
    }).addTo(map);

    const mainIcon = L.divIcon({
      className: "",
      html: `<div style="width:14px;height:14px;border-radius:9999px;background:#0284c7;border:2px solid white;box-shadow:0 0 0 2px rgba(2,132,199,0.35)"></div>`,
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    L.marker([latitude, longitude], { icon: mainIcon })
      .addTo(map)
      .bindPopup(`<strong>${name}</strong><br/>${location}<br/>Zona de referencia`);

    L.circle([latitude, longitude], {
      radius: 500,
      color: "#f59e0b",
      fillColor: "#f59e0b",
      fillOpacity: 0.08,
    }).addTo(map);

    const withCoords = (points ?? []).filter(
      (p): p is MapPoint & { lat: number; lng: number } => typeof p.lat === "number" && typeof p.lng === "number"
    );

    const group: L.Layer[] = [];
    for (const p of withCoords) {
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:12px;height:12px;border-radius:9999px;background:#f59e0b;border:2px solid white;box-shadow:0 0 0 2px rgba(245,158,11,0.35)"></div>`,
        iconSize: [12, 12],
        iconAnchor: [6, 6],
      });
      const marker = L.marker([p.lat, p.lng], { icon }).bindPopup(
        `<strong>${p.label}</strong><br/>Km ${p.km}<br/>${p.tip}`
      );
      marker.addTo(map);
      group.push(marker);
    }

    if (group.length > 0) {
      const bounds = L.featureGroup(group as any).getBounds();
      bounds.extend([latitude, longitude]);
      map.fitBounds(bounds.pad(0.2));
    }

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [latitude, longitude, location, name, points]);

  return (
    <div
      ref={containerRef}
      className="h-[320px] w-full overflow-hidden rounded-2xl border border-amber-200/70 dark:border-amber-900/40 z-0"
    />
  );
}
