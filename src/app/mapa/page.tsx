import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import MapClient from "./MapClient";

export const metadata: Metadata = {
  title: "Mapa de carreras populares - JavipaurRun",
  description:
    "Explora las próximas carreras populares en un mapa interactivo. Encuentra eventos de running, trail, maratones y más cerca de ti.",
};

export default async function MapaPage() {
  const races = await prisma.race.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
      date: { gte: new Date() },
    },
    orderBy: { date: "asc" },
    take: 500,
  });

  const markers = races.map((r) => ({
    id: r.id,
    name: r.name,
    lat: r.latitude!,
    lng: r.longitude!,
    date: r.date.toISOString(),
    type: r.type,
    location: r.location,
    province: r.province,
    url: r.url,
    distance: r.distance,
  }));

  const noCoords = await prisma.race.count({
    where: { latitude: null, date: { gte: new Date() } },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Mapa de carreras</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {markers.length} carrera{markers.length !== 1 ? "s" : ""} en el mapa
          {noCoords > 0 && (
            <span className="text-gray-400">
              {" · "}
              {noCoords} sin ubicación
            </span>
          )}
        </p>
      </div>

      <MapClient markers={markers} />

      {markers.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 mt-6">
          <div className="text-4xl mb-3">🗺️</div>
          <p className="text-gray-500 font-medium mb-1">
            No hay carreras geolocalizadas aún
          </p>
          <p className="text-gray-400 text-sm">
            Ejecuta el scraping para importar carreras con ubicación
          </p>
        </div>
      )}
    </div>
  );
}
