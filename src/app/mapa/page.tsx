import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import MapClient from "./MapClient";
import { publicRaces } from "@/lib/race-filters";
import { startOfToday } from "@/lib/time";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Mapa de carreras y eventos en España",
  description:
    "Explora en un mapa interactivo las próximas carreras y eventos deportivos en España: running, trail, ciclismo, triatlón, natación, híbridos y más.",
  alternates: { canonical: "/mapa" },
};

export default async function MapaPage() {
  const races = await prisma.race.findMany({
    where: publicRaces({
      latitude: { not: null },
      longitude: { not: null },
      date: { gte: startOfToday() },
    }),
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
    where: publicRaces({ latitude: null, date: { gte: startOfToday() } }),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
      <div className="mb-7">
        <p className="section-eyebrow mb-1.5">Explora</p>
        <h1 className="section-title mb-2">Mapa de carreras y eventos</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          {markers.length} evento{markers.length !== 1 ? "s" : ""} en el mapa
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
        <div className="text-center py-16 card-premium mt-6">
          <div className="text-4xl mb-3">🗺️</div>
          <p className="font-semibold text-gray-900 dark:text-white mb-1">
            No hay eventos geolocalizados aún
          </p>
          <p className="text-gray-500 text-sm">
            Ejecuta la importación/scraping para añadir eventos con ubicación
          </p>
        </div>
      )}
    </div>
  );
}
