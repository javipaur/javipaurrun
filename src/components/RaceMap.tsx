"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface RaceMarker {
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

interface RaceMapProps {
  races: RaceMarker[];
  center?: [number, number];
  zoom?: number;
}

const typeColors: Record<string, string> = {
  ASFALTO: "#3b82f6",
  MEDIA_MARATON: "#8b5cf6",
  MARATON: "#ef4444",
  TRAIL: "#22c55e",
  MARCHA: "#f59e0b",
  ORIENTACION: "#06b6d4",
};

export default function RaceMap({
  races,
  center = [42.8, -2.0],
  zoom = 8,
}: RaceMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://openstreetmap.org/copyright">OSM</a>',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [center, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const markers = L.featureGroup();

    for (const race of races) {
      const color = typeColors[race.type] || "#6b7280";

      const icon = L.divIcon({
        html: `<div style="
          width: 14px; height: 14px;
          background: ${color};
          border: 2px solid white;
          border-radius: 50%;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        "></div>`,
        className: "",
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const dateStr = new Date(race.date).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      const popupContent = `
        <div style="font-family: system-ui, sans-serif; font-size: 13px; line-height: 1.4; max-width: 220px;">
          <strong style="font-size: 14px;">${race.name}</strong><br/>
          <span style="color: #6b7280;">${dateStr}${race.distance ? ` · ${race.distance}` : ""}</span><br/>
          <span style="color: #6b7280;">${race.location}, ${race.province}</span><br/>
          <span style="display: inline-block; margin-top: 4px; padding: 1px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; background: ${color}; color: white;">${race.type}</span>
          ${race.url ? `<br/><br/><a href="${race.url}" target="_blank" rel="noopener noreferrer" style="color: #f97316; font-weight: 500; text-decoration: none;">Ver carrera →</a>` : ""}
        </div>
      `;

      const marker = L.marker([race.lat, race.lng], { icon }).bindPopup(
        popupContent,
        { maxWidth: 260 }
      );

      markers.addLayer(marker);
    }

    markers.addTo(map);

    if (races.length > 0) {
      map.fitBounds(markers.getBounds().pad(0.1));
    }

    return () => {
      markers.remove();
    };
  }, [races]);

  return (
    <div
      ref={containerRef}
      className="w-full h-[500px] rounded-xl border border-gray-200 z-0"
    />
  );
}
