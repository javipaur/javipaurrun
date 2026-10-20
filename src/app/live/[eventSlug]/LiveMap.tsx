"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";

export interface LiveMapRunner {
  id: string;
  bib: number;
  name: string;
  status: string;
  lat?: number;
  lng?: number;
}

export interface LiveMapCheckpoint {
  id: string;
  name: string;
  km: number;
  lat: number | null;
  lng: number | null;
}

interface LiveMapProps {
  runners: LiveMapRunner[];
  checkpoints: LiveMapCheckpoint[];
  totalDistance: number;
}

function runnerIcon(status: string): L.DivIcon {
  const color = status === "FINALIZADO" ? "#3b82f6" : "#f97316";
  return L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;background:${color};border:2px solid #fff;border-radius:9999px;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

const CP_ICON = L.divIcon({
  className: "",
  html: '<div style="display:flex;align-items:center;justify-content:center;width:20px;height:20px;background:#2563eb;border:2px solid #fff;border-radius:9999px;color:#fff;font-weight:700;font-size:10px;font-family:Inter,sans-serif">CP</div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const ZONE_STYLE: L.CircleMarkerOptions = {
  radius: 12,
  color: "#2563eb",
  weight: 1,
  fillColor: "#2563eb",
  fillOpacity: 0.12,
};

export default function LiveMap({ runners, checkpoints }: LiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: false,
      center: [40.4168, -3.7038],
      zoom: 6,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setReady(true);
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  const markers = useMemo(
    () => runners.filter((r) => r.lat != null && r.lng != null),
    [runners]
  );

  useEffect(() => {
    if (!ready || !layerRef.current) return;
    const group = layerRef.current!;
    group.clearLayers();

    for (const c of checkpoints) {
      if (c.lat == null || c.lng == null) continue;
      L.circleMarker([c.lat, c.lng], ZONE_STYLE).addTo(group)
        .bindTooltip(`${c.name} · km ${c.km}`, { sticky: true });
      L.marker([c.lat, c.lng], { icon: CP_ICON }).addTo(group);
    }

    for (const m of markers) {
      L.marker([m.lat!, m.lng!], { icon: runnerIcon(m.status) }).addTo(group)
        .bindTooltip(`${m.name} · Dorsal ${m.bib}`, { direction: "top", offset: [0, -10] });
    }

    const roadPts: L.LatLngExpression[] = markers
      .filter((m) => m.status === "EN_CURSO")
      .map((m) => [m.lat!, m.lng!] as L.LatLngTuple);
    if (roadPts.length >= 2) {
      L.polyline(roadPts, { color: "#f97316", weight: 3, opacity: 0.7, dashArray: "8 8" }).addTo(group);
    }

    const allPts: L.LatLngExpression[] = [
      ...checkpoints.filter((c) => c.lat != null && c.lng != null).map((c) => [c.lat!, c.lng!] as L.LatLngTuple),
      ...markers.map((m) => [m.lat!, m.lng!] as L.LatLngTuple),
    ];
    if (allPts.length > 0) {
      mapRef.current!.fitBounds(L.latLngBounds(allPts).pad(0.25));
    }
  }, [markers, checkpoints, ready]);

  return <div ref={containerRef} className="h-[420px] w-full rounded-xl z-0" />;
}